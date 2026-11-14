import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, require_roles
from .team_ops_router import team_user_ids

router = APIRouter(prefix="/team", tags=["manager-team"])

class ScheduleBody(BaseModel):
    agentId: int
    cron: str
    payload: dict = {}

@router.get("/schedules")
def team_schedules(tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT * FROM "schedules" WHERE company_id = :c ORDER BY next_run_at ASC NULLS LAST'), {"c": tenant.company_id}).all()
    return {"success": True, "schedules": [dict(row._mapping) for row in rows]}

@router.post("/schedules")
def create_team_schedule(body: ScheduleBody, tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db)):
    schedule_id = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "schedules" (id, company_id, agent_id, user_id, cron, payload, enabled) VALUES (:id, :c, :a, :u, :cron, :payload, true)'),
        {"id": schedule_id, "c": tenant.company_id, "a": body.agentId, "u": tenant.user_id, "cron": body.cron, "payload": __import__("json").dumps(body.payload)},
    )
    db.commit()
    return {"success": True, "scheduleId": schedule_id}

@router.get("/brief")
def team_brief(tenant: Tenant = Depends(require_roles("manager", "company_admin", "super_admin")), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id, brief_date, items FROM "daily_briefs" WHERE company_id = :c ORDER BY brief_date DESC LIMIT 1'), {"c": tenant.company_id}).first()
    return {"success": True, "brief": dict(row._mapping) if row else None}

@router.post("/members/bulk-agent-access")
def bulk_grant_access(tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db), userIds: list[str] = [], agentId: int = 0, mode: str = "draft"):
    for user_id in userIds:
        db.execute(
            text(
                'INSERT INTO "user_agent_access" (user_id, agent_id, mode, granted_by, granted_at) VALUES (:u, :a, :m, :by, NOW()) '
                'ON CONFLICT (user_id, agent_id) DO UPDATE SET mode = EXCLUDED.mode'
            ),
            {"u": user_id, "a": agentId, "m": mode, "by": tenant.user_id},
        )
    db.commit()
    return {"success": True, "granted": len(userIds), "agentId": agentId}

