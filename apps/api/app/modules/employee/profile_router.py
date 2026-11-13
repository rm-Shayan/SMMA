from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant

router = APIRouter(tags=["employee-profile"])


class ProfileBody(BaseModel):
    name: str | None = None


@router.get("/profile")
def profile(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    if not tenant.user_id:
        raise HTTPException(status_code=401, detail="Authenticated user required")
    row = db.execute(text('SELECT id, company_id, email, name, role, status, team_id FROM "users" WHERE id = :id'), {"id": tenant.user_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "profile": dict(row._mapping)}


@router.patch("/profile")
def update_profile(body: ProfileBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    db.execute(text('UPDATE "users" SET name = COALESCE(:name, name) WHERE id = :id'), {"id": tenant.user_id, "name": body.name})
    db.commit()
    return {"success": True, "userId": tenant.user_id}


@router.get("/runs")
def my_runs(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(
        text('SELECT id, agent_action_id, status, credits_used, cost_usd, started_at FROM "agent_runs" WHERE company_id = :c AND user_id = :u ORDER BY started_at DESC LIMIT :limit'),
        {"c": tenant.company_id, "u": tenant.user_id, "limit": limit},
    ).all()
    return {"success": True, "runs": [dict(row._mapping) for row in rows]}


@router.get("/runs/{run_id}")
def my_run(run_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT * FROM "agent_runs" WHERE id = :id AND company_id = :c AND user_id = :u'), {"id": run_id, "c": tenant.company_id, "u": tenant.user_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"success": True, "run": dict(row._mapping)}


@router.get("/outbox")
def my_outbox(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(
        text(
            'SELECT oj.id, oj.status, oj.target_type, oj.not_before FROM "outbox_jobs" oj '
            'JOIN "agent_runs" ar ON oj.agent_run_id = ar.id '
            'WHERE ar.company_id = :c AND ar.user_id = :u ORDER BY oj.not_before ASC NULLS LAST LIMIT :limit'
        ),
        {"c": tenant.company_id, "u": tenant.user_id, "limit": limit},
    ).all()
    return {"success": True, "jobs": [dict(row._mapping) for row in rows]}


@router.get("/tasks")
def my_tasks(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(
        text('SELECT id, request, status, credit_budget, created_at FROM "tasks" WHERE company_id = :c AND user_id = :u ORDER BY created_at DESC LIMIT :limit'),
        {"c": tenant.company_id, "u": tenant.user_id, "limit": limit},
    ).all()
    return {"success": True, "tasks": [dict(row._mapping) for row in rows]}


@router.get("/approvals")
def my_approvals(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT a.id, a.status, ar.id AS run_id, ag.name AS agent FROM "approvals" a JOIN "agent_runs" ar ON a.agent_run_id = ar.id JOIN "agent_actions" aa ON ar.agent_action_id = aa.id JOIN "agents" ag ON aa.agent_id = ag.id WHERE ar.company_id = :c AND ar.user_id = :u ORDER BY ar.started_at DESC'),
        {"c": tenant.company_id, "u": tenant.user_id},
    ).all()
    return {"success": True, "approvals": [dict(row._mapping) for row in rows]}


@router.get("/usage")
def my_usage(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(
        text('SELECT count(*)::int AS runs, COALESCE(sum(credits_used),0)::int AS credits, COALESCE(sum(cost_usd),0) AS cost FROM "agent_runs" WHERE company_id = :c AND user_id = :u'),
        {"c": tenant.company_id, "u": tenant.user_id},
    ).first()
    return {"success": True, "usage": dict(row._mapping)}