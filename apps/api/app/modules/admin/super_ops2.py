import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, require_roles

router = APIRouter()
FLAGS = {"voice_mode": True, "video_generation": True, "auto_publish": False, "maintenance": False}


class FlagBody(BaseModel):
    enabled: bool


class QuotaBody(BaseModel):
    perDay: int = 50
    perHour: int = 20
    workHours: str = "09:00-22:00"


@router.get("/usage/export")
def usage_export(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT c.name, ag.name AS agent, count(*)::int AS runs, COALESCE(sum(ar.credits_used),0)::int AS credits FROM "agent_runs" ar JOIN "agent_actions" aa ON ar.agent_action_id = aa.id JOIN "agents" ag ON aa.agent_id = ag.id JOIN "companies" c ON ar.company_id = c.id GROUP BY c.name, ag.name')).all()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["company", "agent", "runs", "credits"])
    for row in rows:
        writer.writerow([row[0], row[1], row[2], row[3]])
    return Response(content=buffer.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=usage.csv"})


@router.get("/usage/agents")
def usage_agents(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT ag.name AS agent, count(*)::int AS runs, COALESCE(sum(ar.credits_used),0)::int AS credits, COALESCE(sum(ar.cost_usd),0) AS cost FROM "agent_runs" ar JOIN "agent_actions" aa ON ar.agent_action_id = aa.id JOIN "agents" ag ON aa.agent_id = ag.id GROUP BY ag.name ORDER BY cost DESC')).all()
    return {"success": True, "agents": [dict(row._mapping) for row in rows]}


@router.get("/usage/companies")
def usage_companies(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT c.id, c.name, count(ar.id)::int AS runs, COALESCE(sum(ar.credits_used),0)::int AS credits FROM "companies" c LEFT JOIN "agent_runs" ar ON ar.company_id = c.id GROUP BY c.id, c.name ORDER BY credits DESC')).all()
    return {"success": True, "companies": [dict(row._mapping) for row in rows]}


@router.get("/audit-logs/export")
def audit_export(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT created_at, action, entity, entity_id, user_id FROM "audit_logs" ORDER BY created_at DESC LIMIT 5000')).all()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["created_at", "action", "entity", "entity_id", "user_id"])
    for row in rows:
        writer.writerow([row[0], row[1], row[2], row[3], row[4]])
    return Response(content=buffer.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=audit-logs.csv"})


@router.get("/audit-logs/{log_id}")
def audit_detail(log_id: str, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT * FROM "audit_logs" WHERE id = :id'), {"id": log_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"success": True, "log": dict(row._mapping)}


@router.get("/agents")
def admin_agents(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT id, code, name, default_mode FROM "agents" ORDER BY id')).all()
    return {"success": True, "agents": [dict(row._mapping) for row in rows]}


@router.patch("/agents/{agent_id}")
def update_agent(agent_id: int, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db), name: str | None = None, defaultMode: str | None = None):
    db.execute(text('UPDATE "agents" SET name = COALESCE(:name, name), default_mode = COALESCE(:mode, default_mode) WHERE id = :id'), {"id": agent_id, "name": name, "mode": defaultMode})
    db.commit()
    return {"success": True, "agentId": agent_id}


@router.post("/agents/{agent_id}/disable")
def disable_agent(agent_id: int, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    db.execute(text('DELETE FROM "company_agents" WHERE agent_id = :id'), {"id": agent_id})
    db.commit()
    return {"success": True, "agentId": agent_id, "enabled": False}


@router.get("/quotas")
def quotas(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT c.id AS company_id, c.name, COALESCE(w.balance,0) AS balance, min(al.per_day) AS per_day, min(al.per_hour) AS per_hour FROM "companies" c LEFT JOIN "credit_wallets" w ON w.company_id = c.id AND w.user_id IS NULL LEFT JOIN "connected_accounts" ca ON ca.company_id = c.id LEFT JOIN "account_limits" al ON al.connected_account_id = ca.id GROUP BY c.id, c.name, w.balance ORDER BY c.name')).all()
    return {"success": True, "quotas": [dict(row._mapping) for row in rows]}


@router.patch("/quotas/{company_id}")
def set_quota(company_id: str, body: QuotaBody, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    db.execute(text('UPDATE "account_limits" SET per_day = :day, per_hour = :hour, work_hours = :hours WHERE connected_account_id IN (SELECT id FROM "connected_accounts" WHERE company_id = :c)'), {"day": body.perDay, "hour": body.perHour, "hours": body.workHours, "c": company_id})
    db.commit()
    return {"success": True, "companyId": company_id, **body.model_dump()}


@router.get("/security/events")
def security_events(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT * FROM "audit_logs" WHERE action IN (\'login\', \'impersonate\', \'connector\') ORDER BY created_at DESC LIMIT 100')).all()
    return {"success": True, "events": [dict(row._mapping) for row in rows]}


@router.post("/security/unblock-account")
def unblock(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db), accountId: str = ""):
    db.execute(text('UPDATE "account_limits" SET paused_until = NULL, backoff_level = 0 WHERE connected_account_id = :id'), {"id": accountId})
    db.commit()
    return {"success": True, "accountId": accountId}


@router.get("/feature-flags")
def flags(tenant: Tenant = Depends(require_roles("super_admin"))):
    return {"success": True, "flags": FLAGS}


@router.patch("/feature-flags/{key}")
def set_flag(key: str, body: FlagBody, tenant: Tenant = Depends(require_roles("super_admin"))):
    if key not in FLAGS:
        raise HTTPException(status_code=404, detail="Unknown flag")
    FLAGS[key] = body.enabled
    return {"success": True, "key": key, "enabled": body.enabled}