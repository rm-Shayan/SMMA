from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant

router = APIRouter()


class DecisionBody(BaseModel):
    status: str


@router.get("/")
def list_pending(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text(
            """
            SELECT a.*, ar.id AS run_id, ar.thread_key, ar.input, ar.output, ag.name AS agent_name
            FROM "approvals" a
            JOIN "agent_runs" ar ON a.agent_run_id = ar.id
            JOIN "agent_actions" aa ON ar.agent_action_id = aa.id
            JOIN "agents" ag ON aa.agent_id = ag.id
            WHERE ar.company_id = :c AND a.status = 'pending'
            ORDER BY ar.started_at DESC
            """
        ),
        {"c": tenant.company_id},
    ).all()
    return {"success": True, "approvals": [dict(row._mapping) for row in rows]}


@router.post("/{approval_id}/decide")
def decide(approval_id: str, body: DecisionBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(
        text(
            """
            SELECT a.id, a.agent_run_id, aa.agent_id
            FROM "approvals" a
            JOIN "agent_runs" ar ON a.agent_run_id = ar.id
            JOIN "agent_actions" aa ON ar.agent_action_id = aa.id
            WHERE a.id = :id AND ar.company_id = :c
            """
        ),
        {"id": approval_id, "c": tenant.company_id},
    ).first()
    if not row:
        return {"success": False, "error": "Approval not found"}
    if body.status not in ("approved", "rejected"):
        return {"success": False, "error": "Invalid status"}

    db.execute(
        text('UPDATE "approvals" SET status = :status, approver_id = :approver, decided_at = NOW() WHERE id = :id'),
        {"status": body.status, "approver": tenant.user_id, "id": approval_id},
    )
    if body.status == "approved":
        db.execute(text('UPDATE "agent_runs" SET status = \'completed\' WHERE id = :run'), {"run": str(row[1])})
        db.execute(
            text('UPDATE "social_posts" SET status = \'approved\' WHERE created_by_run = :run AND status = \'draft\''),
            {"run": str(row[1])},
        )
    db.commit()
    return {"success": True, "approvalId": approval_id, "status": body.status}



@router.get("/{approval_id}")
def get_approval(approval_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(
        text(
            """
            SELECT a.*, ar.id AS run_id, ar.input, ar.output, ag.name AS agent_name
            FROM "approvals" a JOIN "agent_runs" ar ON a.agent_run_id = ar.id
            JOIN "agent_actions" aa ON ar.agent_action_id = aa.id JOIN "agents" ag ON aa.agent_id = ag.id
            WHERE a.id = :id AND ar.company_id = :c
            """
        ),
        {"id": approval_id, "c": tenant.company_id},
    ).first()
    if not row:
        return {"success": False, "error": "Approval not found"}
    return {"success": True, "approval": dict(row._mapping)}


@router.post("/bulk")
def bulk_decide(body: dict, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    ids = body.get("approvalIds") or []
    status = body.get("status")
    if not ids or status not in ("approved", "rejected"):
        return {"success": False, "error": "approvalIds and valid status required"}
    db.execute(
        text('UPDATE "approvals" SET status = :status, approver_id = :by, decided_at = NOW() WHERE id = ANY(:ids) AND agent_run_id IN (SELECT id FROM "agent_runs" WHERE company_id = :c)'),
        {"status": status, "by": tenant.user_id, "ids": ids, "c": tenant.company_id},
    )
    db.commit()
    return {"success": True, "updated": len(ids), "status": status}
