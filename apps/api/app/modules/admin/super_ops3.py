from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, require_roles

router = APIRouter()


class StatusBody(BaseModel):
    status: str


@router.get("/users/{user_id}")
def get_user(user_id: str, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    row = db.execute(
        text('SELECT id, company_id, email, name, role, status, created_at FROM "users" WHERE id = :id'),
        {"id": user_id},
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "user": dict(row._mapping)}


@router.post("/users/{user_id}/suspend")
def suspend_user(user_id: str, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    db.execute(text('UPDATE "users" SET status = \'suspended\' WHERE id = :id'), {"id": user_id})
    db.commit()
    return {"success": True, "userId": user_id, "status": "suspended"}


@router.delete("/impersonate/{session_id}")
def revoke_impersonation(session_id: str, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    db.execute(text('DELETE FROM "audit_logs" WHERE id = :id AND action = \'impersonate\''), {"id": session_id})
    db.commit()
    return {"success": True, "sessionId": session_id}


@router.post("/maintenance/pause")
def pause(tenant: Tenant = Depends(require_roles("super_admin"))):
    return {"success": True, "maintenance": True}


@router.post("/maintenance/resume")
def resume(tenant: Tenant = Depends(require_roles("super_admin"))):
    return {"success": True, "maintenance": False}


@router.get("/companies/{company_id}/usage")
def company_usage(company_id: str, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    row = db.execute(
        text(
            """
            SELECT count(*)::int AS runs, COALESCE(sum(credits_used), 0)::int AS credits,
                   COALESCE(sum(cost_usd), 0) AS cost
            FROM "agent_runs" WHERE company_id = :id
            """
        ),
        {"id": company_id},
    ).first()
    return {"success": True, "usage": {"companyId": company_id, **dict(row._mapping)}}


@router.get("/companies/{company_id}/agents")
def company_agents(company_id: str, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    rows = db.execute(
        text(
            """
            SELECT ag.id, ag.code, ag.name, ca.enabled_at
            FROM "agents" ag LEFT JOIN "company_agents" ca ON ca.agent_id = ag.id AND ca.company_id = :id
            ORDER BY ag.id
            """
        ),
        {"id": company_id},
    ).all()
    return {"success": True, "agents": [dict(row._mapping) for row in rows]}


@router.get("/companies/{company_id}/outbox")
def company_outbox(company_id: str, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db), limit: int = 100):
    rows = db.execute(
        text(
            """
            SELECT oj.id, oj.status, oj.target_type, oj.not_before
            FROM "outbox_jobs" oj JOIN "connected_accounts" ca ON oj.connected_account_id = ca.id
            WHERE ca.company_id = :id ORDER BY oj.not_before ASC NULLS FIRST LIMIT :limit
            """
        ),
        {"id": company_id, "limit": limit},
    ).all()
    return {"success": True, "jobs": [dict(row._mapping) for row in rows]}


@router.post("/companies/{company_id}/status")
def set_status(company_id: str, body: StatusBody, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    if body.status not in ("active", "suspended", "deleted"):
        return {"success": False, "error": "Invalid status"}
    db.execute(text('UPDATE "companies" SET status = :status WHERE id = :id'), {"status": body.status, "id": company_id})
    db.commit()
    return {"success": True, "companyId": company_id, "status": body.status}