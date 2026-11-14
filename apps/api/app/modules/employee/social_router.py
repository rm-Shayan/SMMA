import json
import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant

router = APIRouter(prefix="/social", tags=["employee-social"])


class ReplyBody(BaseModel):
    body: str


@router.get("/posts")
def my_posts(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(text('SELECT * FROM "social_posts" WHERE company_id = :c ORDER BY COALESCE(scheduled_at, published_at) DESC NULLS LAST LIMIT :limit'), {"c": tenant.company_id, "limit": limit}).all()
    return {"success": True, "posts": [dict(row._mapping) for row in rows]}


@router.get("/comments")
def my_comments(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(text('SELECT * FROM "social_comments" WHERE company_id = :c ORDER BY created_at DESC LIMIT :limit'), {"c": tenant.company_id, "limit": limit}).all()
    return {"success": True, "comments": [dict(row._mapping) for row in rows]}


@router.post("/comments/{comment_id}/reply")
def reply_comment(comment_id: str, body: ReplyBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id, post_id FROM "social_comments" WHERE id = :id AND company_id = :c'), {"id": comment_id, "c": tenant.company_id}).first()
    if not row:
        return {"success": False, "error": "Comment not found"}
    job_id = str(uuid.uuid4())
    db.execute(
        text(
            'INSERT INTO "outbox_jobs" (id, connected_account_id, agent_run_id, thread_key, target_type, target_post_id, priority, reply_text, status, not_before, expires_at, idempotency_key) '
            "VALUES (:id, :account, NULL, :thread, 'comment_reply', :post, 1, :payload, 'queued', NOW() + INTERVAL '1 minute', NOW() + INTERVAL '3 days', :key)"
        ),
        {"id": job_id, "account": "00000000-0000-0000-0000-000000000000", "thread": f"comment_{comment_id}", "post": comment_id, "payload": json.dumps({"body": body.body}), "key": f"reply_{comment_id}"},
    )
    db.commit()
    return {"success": True, "outboxJobId": job_id}

class PostBody(BaseModel):
    platform: str
    content: str


@router.post("/posts")
def create_draft(body: PostBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    import uuid

    post_id = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "social_posts" (id, company_id, connected_account_id, created_by_run, platform, content, status, created_at) VALUES (:id, :c, NULL, NULL, :p, :content, \'draft\', NOW())'),
        {"id": post_id, "c": tenant.company_id, "p": body.platform, "content": body.content},
    )
    db.commit()
    return {"success": True, "postId": post_id, "status": "draft"}
