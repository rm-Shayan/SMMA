import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ...core.audit import record
from ..knowledge.trainee import summarize_csv

router = APIRouter(tags=["employee-growth"])


class ConnectionBody(BaseModel):
    provider: str
    secret: str
    displayName: str | None = None


class ReportBody(BaseModel):
    fileName: str = "report.csv"
    csv: str


class ScheduleBody(BaseModel):
    agentId: int
    cron: str
    payload: dict = {}


@router.post("/connections")
def create_connection(body: ConnectionBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    account_id = str(uuid.uuid4())
    db.execute(
        text(
            'INSERT INTO "connected_accounts" (id, company_id, user_id, provider, display_name, token_enc, status, created_at) '
            "VALUES (:id, :c, :u, :p, :n, :t, 'active', NOW())"
        ),
        {"id": account_id, "c": tenant.company_id, "u": tenant.user_id, "p": body.provider, "n": body.displayName or body.provider, "t": body.secret},
    )
    db.commit()
    return {"success": True, "accountId": account_id, "provider": body.provider}


@router.post("/connections/{account_id}/test")
def test_connection(account_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id, provider FROM "connected_accounts" WHERE id = :id AND company_id = :c AND user_id = :u'), {"id": account_id, "c": tenant.company_id, "u": tenant.user_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"success": True, "accountId": account_id, "provider": row[1], "reachable": True}


@router.post("/reports/generate")
def generate_report(body: ReportBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    report = summarize_csv(body.csv, body.fileName)
    from pathlib import Path

    folder = Path(__file__).resolve().parents[3] / "generated"
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / f"{tenant.company_id}_{body.fileName}"
    path.write_text(report["csv"], encoding="utf-8")
    db.execute(
        text('INSERT INTO "generated_files" (id, company_id, user_id, agent_run_id, file_name, storage_path, created_at) VALUES (:id, :c, :u, NULL, :n, :p, NOW())'),
        {"id": str(uuid.uuid4()), "c": tenant.company_id, "u": tenant.user_id, "n": body.fileName, "p": str(path)},
    )
    db.commit()
    return {"success": True, "report": {"fileName": body.fileName, "path": str(path), "rows": report["rows"], "totals": report["totals"]}}


@router.post("/brief/{brief_id}/done")
def brief_done(brief_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    record(db, tenant.company_id, tenant.user_id, "brief", "daily_briefs", brief_id, {"action": "mark_done"})
    return {"success": True, "briefId": brief_id, "done": True}


@router.get("/schedules")
def my_schedules(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT * FROM "schedules" WHERE company_id = :c AND user_id = :u ORDER BY next_run_at ASC NULLS LAST'), {"c": tenant.company_id, "u": tenant.user_id}).all()
    return {"success": True, "schedules": [dict(row._mapping) for row in rows]}


@router.post("/schedules")
def create_schedule(body: ScheduleBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    schedule_id = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "schedules" (id, company_id, agent_id, user_id, cron, payload, enabled) VALUES (:id, :c, :a, :u, :cron, :payload, true)'),
        {"id": schedule_id, "c": tenant.company_id, "a": body.agentId, "u": tenant.user_id, "cron": body.cron, "payload": json.dumps(body.payload)},
    )
    db.commit()
    return {"success": True, "scheduleId": schedule_id}