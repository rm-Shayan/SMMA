import json
import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ...core.rate_limiter import rate_limit
from ...core.runner import run_agent
from .competitors_router import competitors_router
from .regenerate_router import router as regenerate_router
from .webhook_router import router as webhook_router

router = APIRouter()
router.include_router(competitors_router)
router.include_router(regenerate_router)
router.include_router(webhook_router)


class PostBody(BaseModel):
    connectedAccountId: str
    platform: str
    topic: str = "autonomous agents"
    tone: str = "professional"
    scheduledAt: str | None = None
    autoApprove: bool = False


class ReplyBody(BaseModel):
    body: str | None = None
    content: str | None = None

    def get_text(self) -> str:
        return self.body or self.content or ""


@router.post("/posts", dependencies=[Depends(rate_limit(requests_per_minute=20, by="tenant"))])
def publish(body: PostBody, tenant: Tenant = Depends(get_tenant)):
    result = run_agent(tenant, "publisher", 8, "a0000000-0000-0000-0000-000000000008", "auto", body.model_dump())
    return {"success": result.success, "data": result.data, "runId": result.run_id}


@router.get("/posts")
def list_posts(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(text('SELECT * FROM "social_posts" WHERE company_id = :c ORDER BY COALESCE(scheduled_at, published_at) DESC NULLS LAST LIMIT :limit'), {"c": tenant.company_id, "limit": limit}).all()
    return {"success": True, "posts": [dict(r._mapping) for r in rows]}


@router.get("/posts/{post_id}")
def get_post(post_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT * FROM "social_posts" WHERE id = :id AND company_id = :c'), {"id": post_id, "c": tenant.company_id}).first()
    return {"success": True, "post": dict(row._mapping)} if row else {"success": False, "error": "Post not found"}


@router.patch("/posts/{post_id}")
def update_post(post_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), content: str | None = None, status: str | None = None, scheduledAt: str | None = None):
    if status and status not in ("draft", "approved", "scheduled", "published"):
        return {"success": False, "error": "Invalid status"}
    db.execute(
        text('UPDATE "social_posts" SET content = COALESCE(:content, content), status = COALESCE(:status, status), scheduled_at = COALESCE(:scheduled, scheduled_at) WHERE id = :id AND company_id = :c'),
        {"id": post_id, "c": tenant.company_id, "content": content, "status": status, "scheduled": scheduledAt},
    )
    db.commit()
    return {"success": True, "postId": post_id}


@router.delete("/posts/{post_id}")
def delete_post(post_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    db.execute(text('DELETE FROM "social_posts" WHERE id = :id AND company_id = :c'), {"id": post_id, "c": tenant.company_id})
    db.commit()
    return {"success": True, "postId": post_id}


@router.post("/posts/{post_id}/approve")
def approve_post(post_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    db.execute(text('UPDATE "social_posts" SET status = \'approved\' WHERE id = :id AND company_id = :c'), {"id": post_id, "c": tenant.company_id})
    db.commit()
    return {"success": True, "postId": post_id, "status": "approved"}


@router.post("/posts/{post_id}/publish")
def publish_post(post_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id, status FROM "social_posts" WHERE id = :id AND company_id = :c'), {"id": post_id, "c": tenant.company_id}).first()
    if not row:
        return {"success": False, "error": "Post not found"}
    if row[1] == "draft":
        return {"success": False, "error": "Draft needs approval before publishing"}
    db.execute(text('UPDATE "social_posts" SET status = \'published\', published_at = NOW() WHERE id = :id'), {"id": post_id})
    db.commit()
    return {"success": True, "postId": post_id, "status": "published"}


@router.get("/calendar")
def calendar(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(text('SELECT id, platform, status, content, scheduled_at, published_at FROM "social_posts" WHERE company_id = :c ORDER BY COALESCE(scheduled_at, published_at) DESC NULLS LAST LIMIT :limit'), {"c": tenant.company_id, "limit": limit}).all()
    return {"success": True, "items": [dict(r._mapping) for r in rows]}


@router.get("/comments")
def list_comments(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(text('SELECT * FROM "social_comments" WHERE company_id = :c ORDER BY created_at DESC LIMIT :limit'), {"c": tenant.company_id, "limit": limit}).all()
    return {"success": True, "comments": [dict(r._mapping) for r in rows]}


@router.post("/comments/{comment_id}/reply")
def reply_comment(comment_id: str, body: ReplyBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT sc.id, sc.platform, COALESCE(sp.connected_account_id, sc.post_id) FROM "social_comments" sc LEFT JOIN "social_posts" sp ON sc.post_id = sp.id WHERE sc.id = :id AND sc.company_id = :c'), {"id": comment_id, "c": tenant.company_id}).first()
    if not row:
        return {"success": False, "error": "Comment not found"}
    job_id = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "outbox_jobs" (id, connected_account_id, thread_key, target_type, target_post_id, priority, reply_text, status, not_before, expires_at, idempotency_key) VALUES (:id, :account, :thread, \'comment_reply\', :post, 1, :payload, \'queued\', NOW() + INTERVAL \'1 minute\', NOW() + INTERVAL \'3 days\', :key)'),
        {"id": job_id, "account": row[2], "thread": f"comment_{comment_id}", "post": comment_id, "payload": json.dumps({"body": body.get_text()}), "key": f"reply_{comment_id}"},
    )
    db.commit()
    return {"success": True, "commentId": comment_id, "outboxJobId": job_id}


@router.post("/comments/{comment_id}/approve")
def approve_comment(comment_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id, status FROM "social_comments" WHERE id = :id AND company_id = :c'), {"id": comment_id, "c": tenant.company_id}).first()
    if not row:
        return {"success": False, "error": "Comment not found"}
    db.execute(text('UPDATE "social_comments" SET status = \'approved\' WHERE id = :id'), {"id": comment_id})
    db.commit()
    return {"success": True, "commentId": comment_id, "status": "approved"}
