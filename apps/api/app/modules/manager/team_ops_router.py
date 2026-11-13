import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, require_roles

router = APIRouter(prefix="/team", tags=["manager-team"])


class AccessBody(BaseModel):
    agentId: int
    mode: str = "draft"


class ScheduleBody(BaseModel):
    agentId: int
    cron: str
    payload: dict = {}


def team_user_ids(tenant: Tenant, db: Session) -> list[str]:
    rows = db.execute(
        text('SELECT id FROM "users" WHERE company_id = :c AND (team_id IN (SELECT id FROM "teams" WHERE manager_id = :m) OR team_id IS NULL)'),
        {"c": tenant.company_id, "m": tenant.user_id},
    ).all()
    return [str(row[0]) for row in rows]


@router.get("/members/{user_id}")
def member_detail(user_id: str, tenant: Tenant = Depends(require_roles("manager", "company_admin", "super_admin")), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id, email, name, role, status, team_id FROM "users" WHERE id = :id AND company_id = :c'), {"id": user_id, "c": tenant.company_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"success": True, "member": dict(row._mapping)}


@router.delete("/members/{user_id}")
def remove_member(user_id: str, tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db)):
    db.execute(text('UPDATE "users" SET team_id = NULL WHERE id = :id AND company_id = :c'), {"id": user_id, "c": tenant.company_id})
    db.commit()
    return {"success": True, "userId": user_id, "teamId": None}


@router.post("/members/{user_id}/agent-access")
def grant_access(user_id: str, body: AccessBody, tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db)):
    db.execute(
        text(
            'INSERT INTO "user_agent_access" (user_id, agent_id, mode, granted_by, granted_at) VALUES (:u, :a, :mode, :by, NOW()) '
            'ON CONFLICT (user_id, agent_id) DO UPDATE SET mode = EXCLUDED.mode'
        ),
        {"u": user_id, "a": body.agentId, "mode": body.mode, "by": tenant.user_id},
    )
    db.commit()
    return {"success": True, "userId": user_id, "agentId": body.agentId}


@router.delete("/members/{user_id}/agent-access/{agent_id}")
def revoke_access(user_id: str, agent_id: int, tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db)):
    db.execute(text('DELETE FROM "user_agent_access" WHERE user_id = :u AND agent_id = :a'), {"u": user_id, "a": agent_id})
    db.commit()
    return {"success": True, "userId": user_id, "agentId": agent_id}


@router.get("/members/{user_id}/performance")
def member_performance(user_id: str, tenant: Tenant = Depends(require_roles("manager", "company_admin", "super_admin")), db: Session = Depends(get_db)):
    row = db.execute(
        text(
            'SELECT count(*)::int AS runs, COALESCE(sum(credits_used),0)::int AS credits, COALESCE(sum(cost_usd),0) AS cost, '
            'count(*) FILTER (WHERE status = \'completed\')::int AS completed FROM "agent_runs" WHERE company_id = :c AND user_id = :u'
        ),
        {"c": tenant.company_id, "u": user_id},
    ).first()
    return {"success": True, "performance": {"userId": user_id, **dict(row._mapping)}}


@router.get("/leaderboard")
def leaderboard(tenant: Tenant = Depends(require_roles("manager", "company_admin", "super_admin")), db: Session = Depends(get_db)):
    ids = team_user_ids(tenant, db)
    if not ids:
        return {"success": True, "leaderboard": []}
    rows = db.execute(
        text(
            'SELECT u.id, u.name, count(ar.id)::int AS runs, COALESCE(sum(ar.credits_used),0)::int AS credits '
            'FROM "users" u LEFT JOIN "agent_runs" ar ON ar.user_id = u.id WHERE u.id = ANY(:ids) GROUP BY u.id, u.name ORDER BY credits DESC'
        ),
        {"ids": ids},
    ).all()
    return {"success": True, "leaderboard": [dict(row._mapping) for row in rows]}


@router.get("/tasks")
def team_tasks(tenant: Tenant = Depends(require_roles("manager", "company_admin", "super_admin")), db: Session = Depends(get_db), limit: int = 50):
    ids = team_user_ids(tenant, db)
    rows = db.execute(
        text('SELECT id, request, status, credit_budget, created_at FROM "tasks" WHERE company_id = :c AND user_id = ANY(:ids) ORDER BY created_at DESC LIMIT :limit'),
        {"c": tenant.company_id, "ids": ids or ["00000000-0000-0000-0000-000000000000"], "limit": limit},
    ).all()
    return {"success": True, "tasks": [dict(row._mapping) for row in rows]}


@router.get("/activity")
def team_activity(tenant: Tenant = Depends(require_roles("manager", "company_admin", "super_admin")), db: Session = Depends(get_db), limit: int = 50):
    ids = team_user_ids(tenant, db)
    rows = db.execute(
        text('SELECT id, agent_action_id, status, started_at FROM "agent_runs" WHERE company_id = :c AND user_id = ANY(:ids) ORDER BY started_at DESC LIMIT :limit'),
        {"c": tenant.company_id, "ids": ids or ["00000000-0000-0000-0000-000000000000"], "limit": limit},
    ).all()
    return {"success": True, "activity": [dict(row._mapping) for row in rows]}


@router.get("/analytics")
def team_analytics(tenant: Tenant = Depends(require_roles("manager", "company_admin", "super_admin")), db: Session = Depends(get_db)):
    ids = team_user_ids(tenant, db)
    row = db.execute(
        text('SELECT count(*)::int AS runs, COALESCE(sum(credits_used),0)::int AS credits, COALESCE(sum(cost_usd),0) AS cost FROM "agent_runs" WHERE company_id = :c AND user_id = ANY(:ids)'),
        {"c": tenant.company_id, "ids": ids or ["00000000-0000-0000-0000-000000000000"]},
    ).first()
    return {"success": True, "analytics": dict(row._mapping)}


@router.get("/usage/export")
def team_usage_export(tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db)):
    ids = team_user_ids(tenant, db)
    rows = db.execute(
        text('SELECT u.email, count(ar.id)::int AS runs, COALESCE(sum(ar.credits_used),0)::int AS credits FROM "users" u LEFT JOIN "agent_runs" ar ON ar.user_id = u.id WHERE u.id = ANY(:ids) GROUP BY u.email'),
        {"ids": ids or ["00000000-0000-0000-0000-000000000000"]},
    ).all()
    return {"success": True, "usage": [dict(row._mapping) for row in rows]}


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