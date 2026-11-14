import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.audit import record
from ...core.db import get_db
from ...core.deps import Tenant, get_tenant

router = APIRouter(prefix="/notifications", tags=["employee-notifications"])
PREFERENCES: dict[str, dict] = {}


class PreferencesBody(BaseModel):
    lowBalance: bool = True
    pendingApprovals: bool = True
    failedRuns: bool = True
    dailyBrief: bool = True


def _preferences(user_id: str) -> dict:
    return PREFERENCES.setdefault(user_id, {"lowBalance": True, "pendingApprovals": True, "failedRuns": True, "dailyBrief": True})


@router.get("")
def my_notifications(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    items = []
    wallet = db.execute(text('SELECT balance FROM "credit_wallets" WHERE company_id = :c AND user_id = :u'), {"c": tenant.company_id, "u": tenant.user_id}).first()
    if wallet and int(wallet[0]) < 20:
        items.append({"id": "low_balance", "type": "low_balance", "title": "Low credit balance", "message": f"Only {wallet[0]} credits left."})

    pending = db.execute(
        text('SELECT count(*)::int FROM "approvals" a JOIN "agent_runs" ar ON a.agent_run_id = ar.id WHERE ar.company_id = :c AND ar.user_id = :u AND a.status = \'pending\''),
        {"c": tenant.company_id, "u": tenant.user_id},
    ).scalar()
    if int(pending) > 0:
        items.append({"id": "pending_approvals", "type": "approval", "title": "Approvals pending", "message": f"{pending} draft(s) awaiting your review."})

    failed = db.execute(
        text('SELECT count(*)::int FROM "agent_runs" WHERE company_id = :c AND user_id = :u AND status = \'failed\''),
        {"c": tenant.company_id, "u": tenant.user_id},
    ).scalar()
    if int(failed) > 0:
        items.append({"id": "failed_runs", "type": "failure", "title": "Runs failed", "message": f"{failed} run(s) failed recently."})

    prefs = _preferences(tenant.user_id or "anonymous")
    return {"success": True, "notifications": [item for item in items if prefs.get(item["type"], True)]}


@router.post("/{notification_id}/read")
def mark_read(notification_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    record(db, tenant.company_id, tenant.user_id, "notification_read", "notifications", notification_id)
    return {"success": True, "notificationId": notification_id, "read": True}


@router.get("/preferences")
def preferences(tenant: Tenant = Depends(get_tenant)):
    return {"success": True, "preferences": _preferences(tenant.user_id or "anonymous")}


@router.put("/preferences")
def update_preferences(body: PreferencesBody, tenant: Tenant = Depends(get_tenant)):
    prefs = _preferences(tenant.user_id or "anonymous")
    prefs.update(body.model_dump())
    return {"success": True, "preferences": prefs}