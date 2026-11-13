import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ...core.pubsub import publish_event_sync

router = APIRouter(prefix="/work", tags=["employee-work"])

class SubmitApproval(BaseModel):
    actionType: str  # 'social_post', 'outbox_campaign', 'cold_email'
    targetId: str
    creditsEstimated: int = Field(default=1, gt=0)
    notes: str = ""

@router.get("/connectors")
def get_my_connectors(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, provider, status, created_at FROM "connected_accounts" WHERE company_id = :c AND user_id = :u'),
        {"c": tenant.company_id, "u": tenant.user_id},
    ).all()
    return {"success": True, "connectors": [dict(r._mapping) for r in rows]}

@router.get("/drafts")
def get_my_drafts(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT * FROM "approvals" WHERE company_id = :c AND requested_by = :u ORDER BY created_at DESC'),
        {"c": tenant.company_id, "u": tenant.user_id},
    ).all()
    return {"success": True, "drafts": [dict(r._mapping) for r in rows]}

@router.post("/submit-approval")
def submit_for_approval(body: SubmitApproval, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    aid = str(uuid.uuid4())
    db.execute(
        text(
            'INSERT INTO "approvals" (id, company_id, requested_by, action_type, target_id, credits_estimated, status, created_at) '
            "VALUES (:id, :c, :u, :t, :target, :credits, 'pending', NOW())"
        ),
        {"id": aid, "c": tenant.company_id, "u": tenant.user_id, "t": body.actionType, "target": body.targetId, "credits": body.creditsEstimated},
    )
    db.commit()
    publish_event_sync(tenant.company_id, "new_approval_submitted", {"approvalId": aid, "userId": tenant.user_id}, "notifications")
    return {"success": True, "approvalId": aid, "status": "pending_manager_review"}

