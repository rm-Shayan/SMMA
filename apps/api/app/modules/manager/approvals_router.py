from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, require_roles
from ...core.pubsub import publish_event_sync

router = APIRouter(prefix="/approvals", tags=["manager-approvals"])

class ReviewBody(BaseModel):
    decision: str  # 'approved' or 'rejected'
    notes: str | None = None

@router.get("/pending")
def list_pending_approvals(tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT * FROM "approvals" WHERE company_id = :c AND status = \'pending\' ORDER BY created_at ASC'),
        {"c": tenant.company_id},
    ).all()
    return {"success": True, "pendingCount": len(rows), "approvals": [dict(r._mapping) for r in rows]}

@router.post("/{approval_id}/review")
def review_approval(approval_id: str, body: ReviewBody, tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    if body.decision not in ("approved", "rejected"):
        return {"success": False, "error": "Decision must be 'approved' or 'rejected'"}
    db.execute(
        text('UPDATE "approvals" SET status = :s, decision_note = :n, decided_by = :u, decided_at = NOW() WHERE id = :id AND company_id = :c'),
        {"s": body.decision, "n": body.notes, "u": tenant.user_id, "id": approval_id, "c": tenant.company_id},
    )
    db.commit()
    publish_event_sync(tenant.company_id, "approval_reviewed", {"approvalId": approval_id, "decision": body.decision}, "notifications")
    return {"success": True, "approvalId": approval_id, "decision": body.decision}

