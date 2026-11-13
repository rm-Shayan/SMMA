import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import SessionLocal, get_db
from ...core.deps import Tenant, get_tenant, require_roles
from ...core.runner import run_agent, stream_agent

router = APIRouter()


class RunBody(BaseModel):
    input: dict = {}
    mode: str = "draft"
    actionId: str | None = None


def _resolve_agent_action(db: Session, agent_id: int, action_id: str | None):
    agent = db.execute(text('SELECT id, code FROM "agents" WHERE id = :id'), {"id": agent_id}).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    action = db.execute(text('SELECT id FROM "agent_actions" WHERE agent_id = :id ORDER BY credit_cost ASC LIMIT 1'), {"id": agent_id}).first()
    return str(agent[1]), action_id or (str(action[0]) if action else "a0000000-0000-0000-0000-000000000000")


@router.get("")
def list_agents(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT a.id, a.code, a.name, a.default_mode, COALESCE(ca.enabled_at IS NOT NULL, true) AS enabled FROM "agents" a LEFT JOIN "company_agents" ca ON ca.agent_id = a.id AND ca.company_id = :c ORDER BY a.id'), {"c": tenant.company_id}).all()
    return {"success": True, "agents": [dict(r._mapping) for r in rows]}


@router.post("/{agent_id}/run")
def run(agent_id: int, body: RunBody, tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager", "employee"))):
    db = SessionLocal()
    try:
        code, action_id = _resolve_agent_action(db, agent_id, body.actionId)
        result = run_agent(tenant, code, agent_id, action_id, body.mode, body.input)
        return {"success": result.success, "runId": result.run_id, "data": result.data}
    finally:
        db.close()


@router.post("/{agent_id}/stream")
def stream(agent_id: int, body: RunBody, tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager", "employee"))):
    db = SessionLocal()
    try:
        code, action_id = _resolve_agent_action(db, agent_id, body.actionId)
        return StreamingResponse(stream_agent(tenant, code, agent_id, action_id, body.mode, body.input), media_type="text/event-stream")
    finally:
        db.close()


@router.get("/runs")
def list_runs(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(text('SELECT ar.*, ag.name AS agent_name FROM "agent_runs" ar JOIN "agent_actions" aa ON ar.agent_action_id = aa.id JOIN "agents" ag ON aa.agent_id = ag.id WHERE ar.company_id = :c ORDER BY ar.started_at DESC LIMIT :limit'), {"c": tenant.company_id, "limit": limit}).all()
    return {"success": True, "runs": [dict(r._mapping) for r in rows]}


@router.get("/runs/{run_id}")
def get_run(run_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT * FROM "agent_runs" WHERE id = :id AND company_id = :c'), {"id": run_id, "c": tenant.company_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"success": True, "run": dict(row._mapping)}


@router.post("/runs/{run_id}/cancel")
def cancel_run(run_id: str, tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id, status FROM "agent_runs" WHERE id = :id AND company_id = :c'), {"id": run_id, "c": tenant.company_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    if row[1] in ("completed", "failed", "cancelled"):
        return {"success": False, "error": f"Run already {row[1]}"}
    db.execute(text('UPDATE "agent_runs" SET status = \'cancelled\', finished_at = NOW() WHERE id = :id'), {"id": run_id})
    db.commit()
    return {"success": True, "runId": run_id, "status": "cancelled"}


@router.post("/company/{agent_id}/enable")
def enable_for_company(agent_id: int, tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    db.execute(text('INSERT INTO "company_agents" (company_id, agent_id, enabled_by, enabled_at) VALUES (:c, :agent, :by, NOW()) ON CONFLICT (company_id, agent_id) DO UPDATE SET enabled_at = NOW()'), {"c": tenant.company_id, "agent": agent_id, "by": tenant.user_id})
    db.commit()
    return {"success": True, "agentId": agent_id, "companyId": tenant.company_id, "enabled": True}


@router.post("/runs/bulk-cancel")
def bulk_cancel(body: dict, tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    ids = body.get("runIds") or []
    if not ids:
        return {"success": False, "error": "runIds required"}
    result = db.execute(
        text(
            'UPDATE "agent_runs" SET status = \'cancelled\', finished_at = NOW() '
            'WHERE id = ANY(:ids) AND company_id = :c AND status NOT IN (\'completed\', \'failed\', \'cancelled\')'
        ),
        {"ids": ids, "c": tenant.company_id},
    )
    db.commit()
    return {"success": True, "cancelled": result.rowcount or 0}
