import csv
import io
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, require_roles

router = APIRouter(prefix="/team", tags=["manager-team-schedules"])


class ScheduleBody(BaseModel):
    agentId: int
    cron: str
    payload: dict = {}


@router.patch("/schedules/{schedule_id}")
def update_schedule(schedule_id: str, tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db), cron: str | None = None, enabled: bool | None = None):
    db.execute(
        text('UPDATE "schedules" SET cron = COALESCE(:cron, cron), enabled = COALESCE(:enabled, enabled) WHERE id = :id AND company_id = :c'),
        {"id": schedule_id, "c": tenant.company_id, "cron": cron, "enabled": enabled},
    )
    db.commit()
    return {"success": True, "scheduleId": schedule_id}


@router.delete("/schedules/{schedule_id}")
def delete_schedule(schedule_id: str, tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db)):
    db.execute(text('DELETE FROM "schedules" WHERE id = :id AND company_id = :c'), {"id": schedule_id, "c": tenant.company_id})
    db.commit()
    return {"success": True, "scheduleId": schedule_id}


@router.post("/schedules/{schedule_id}/assign")
def assign_schedule(schedule_id: str, tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db), userId: str = ""):
    db.execute(text('UPDATE "schedules" SET user_id = :u WHERE id = :id AND company_id = :c'), {"u": userId, "id": schedule_id, "c": tenant.company_id})
    db.commit()
    return {"success": True, "scheduleId": schedule_id, "userId": userId}


@router.get("/digest")
def digest(tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db)):
    pending = db.execute(text('SELECT count(*)::int FROM "approvals" a JOIN "agent_runs" ar ON a.agent_run_id = ar.id WHERE ar.company_id = :c AND a.status = \'pending\''), {"c": tenant.company_id}).scalar()
    runs = db.execute(text('SELECT count(*)::int FROM "agent_runs" WHERE company_id = :c AND started_at >= CURRENT_DATE'), {"c": tenant.company_id}).scalar()
    credits = db.execute(text('SELECT COALESCE(sum(credits_used),0)::int FROM "agent_runs" WHERE company_id = :c AND started_at >= CURRENT_DATE'), {"c": tenant.company_id}).scalar()
    return {"success": True, "digest": {"pendingApprovals": pending, "todayRuns": runs, "todayCredits": credits}}


@router.get("/export")
def export_team(tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT u.email, u.name, count(ar.id)::int AS runs, COALESCE(sum(ar.credits_used),0)::int AS credits FROM "users" u LEFT JOIN "agent_runs" ar ON ar.user_id = u.id WHERE u.company_id = :c GROUP BY u.email, u.name'),
        {"c": tenant.company_id},
    ).all()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["email", "name", "runs", "credits"])
    for row in rows:
        writer.writerow([row[0], row[1], row[2], row[3]])
    return Response(content=buffer.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=team.csv"})


@router.get("/reports/scheduled")
def scheduled_reports(tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT id, cron, payload, enabled FROM "schedules" WHERE company_id = :c AND payload::text LIKE :q'), {"c": tenant.company_id, "q": "%report%"}).all()
    return {"success": True, "reports": [dict(row._mapping) for row in rows]}


@router.post("/reports/scheduled")
def create_report(body: ScheduleBody, tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db)):
    report_id = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "schedules" (id, company_id, agent_id, user_id, cron, payload, enabled) VALUES (:id, :c, :a, :u, :cron, :payload, true)'),
        {"id": report_id, "c": tenant.company_id, "a": body.agentId, "u": tenant.user_id, "cron": body.cron, "payload": json.dumps(body.payload)},
    )
    db.commit()
    return {"success": True, "reportId": report_id}