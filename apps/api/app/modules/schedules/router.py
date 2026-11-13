import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant, require_roles

router = APIRouter()


class ScheduleBody(BaseModel):
    agentId: int
    cron: str
    payload: dict = {}


class SchedulePatch(BaseModel):
    cron: str | None = None
    enabled: bool | None = None
    payload: dict | None = None


@router.get("")
def list_schedules(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT * FROM "schedules" WHERE company_id = :c ORDER BY next_run_at ASC NULLS LAST'),
        {"c": tenant.company_id},
    ).all()
    return {"success": True, "schedules": [dict(row._mapping) for row in rows]}


@router.post("")
def create_schedule(body: ScheduleBody, tenant: Tenant = Depends(require_roles("company_admin", "manager")), db: Session = Depends(get_db)):
    schedule_id = str(uuid.uuid4())
    db.execute(
        text(
            'INSERT INTO "schedules" (id, company_id, agent_id, user_id, cron, payload, enabled) '
            "VALUES (:id, :c, :agent, :u, :cron, :payload, true)"
        ),
        {"id": schedule_id, "c": tenant.company_id, "agent": body.agentId, "u": tenant.user_id, "cron": body.cron, "payload": __import__("json").dumps(body.payload)},
    )
    db.commit()
    return {"success": True, "schedule": {"id": schedule_id, **body.model_dump()}}


@router.patch("/{schedule_id}")
def update_schedule(schedule_id: str, body: SchedulePatch, tenant: Tenant = Depends(require_roles("company_admin", "manager")), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id FROM "schedules" WHERE id = :id AND company_id = :c'), {"id": schedule_id, "c": tenant.company_id}).first()
    if not row:
        return {"success": False, "error": "Schedule not found"}
    db.execute(
        text('UPDATE "schedules" SET cron = COALESCE(:cron, cron), enabled = COALESCE(:enabled, enabled), payload = COALESCE(:payload, payload) WHERE id = :id'),
        {"id": schedule_id, "cron": body.cron, "enabled": body.enabled, "payload": __import__("json").dumps(body.payload) if body.payload else None},
    )
    db.commit()
    return {"success": True, "scheduleId": schedule_id}


@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: str, tenant: Tenant = Depends(require_roles("company_admin", "manager")), db: Session = Depends(get_db)):
    db.execute(text('DELETE FROM "schedules" WHERE id = :id AND company_id = :c'), {"id": schedule_id, "c": tenant.company_id})
    db.commit()
    return {"success": True, "scheduleId": schedule_id}