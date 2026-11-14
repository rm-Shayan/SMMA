import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, require_roles

router = APIRouter(prefix="/team", tags=["manager-team-ops"])
RULES = {"requireApprovalAbove": 20, "autoApproveAgents": [], "escalatePricing": True}
SETTINGS = {"notifyOnPending": True, "notifyOnLowBalance": True, "escalationHours": 4}


class RuleBody(BaseModel):
    requireApprovalAbove: int = 20
    autoApproveAgents: list[int] = []
    escalatePricing: bool = True


@router.post("/members/import")
def import_members(tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db), csv: str = ""):
    reader = csv.DictReader(io.StringIO(csv))
    imported = 0
    for row in reader:
        email = (row.get("email") or "").strip().lower()
        if not email:
            continue
        db.execute(
            text('INSERT INTO "users" (id, company_id, email, name, role, status, created_at) VALUES (:id, :c, :e, :n, \'employee\', \'active\', NOW()) ON CONFLICT (email) DO NOTHING'),
            {"id": str(__import__("uuid").uuid4()), "c": tenant.company_id, "e": email, "n": row.get("name") or email},
        )
        imported += 1
    db.commit()
    return {"success": True, "imported": imported}


@router.get("/members/{user_id}/access")
def member_access(user_id: str, tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT ua.agent_id, ag.name, ua.mode FROM "user_agent_access" ua JOIN "agents" ag ON ua.agent_id = ag.id WHERE ua.user_id = :u'),
        {"u": user_id},
    ).all()
    return {"success": True, "access": [dict(row._mapping) for row in rows]}


@router.get("/credits/ledger")
def team_ledger(tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db), limit: int = 100):
    rows = db.execute(
        text(
            'SELECT ct.created_at, ct.type, ct.amount, ct.note, u.email FROM "credit_transactions" ct '
            'JOIN "credit_wallets" cw ON ct.wallet_id = cw.id LEFT JOIN "users" u ON cw.user_id = u.id '
            'WHERE cw.company_id = :c ORDER BY ct.created_at DESC LIMIT :limit'
        ),
        {"c": tenant.company_id, "limit": limit},
    ).all()
    return {"success": True, "ledger": [dict(row._mapping) for row in rows]}


@router.get("/credits/caps")
def caps(tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT COALESCE(max(credit_limit), 0) AS cap FROM "campaigns" WHERE company_id = :c'), {"c": tenant.company_id}).first()
    return {"success": True, "campaignCreditCap": int(row[0])}


@router.put("/credits/caps")
def set_caps(tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db), cap: int = 50):
    db.execute(text('UPDATE "campaigns" SET credit_limit = :cap WHERE company_id = :c'), {"cap": cap, "c": tenant.company_id})
    db.commit()
    return {"success": True, "campaignCreditCap": cap}


@router.get("/approvals/{approval_id}")
def approval_detail(approval_id: str, tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db)):
    row = db.execute(
        text('SELECT a.*, ar.id AS run_id, ar.input, ar.output FROM "approvals" a JOIN "agent_runs" ar ON a.agent_run_id = ar.id WHERE a.id = :id AND ar.company_id = :c'),
        {"id": approval_id, "c": tenant.company_id},
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Approval not found")
    return {"success": True, "approval": dict(row._mapping)}


@router.post("/approvals/bulk")
def bulk_review(tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db), approvalIds: list[str] = [], status: str = "approved"):
    if status not in ("approved", "rejected"):
        return {"success": False, "error": "Invalid status"}
    db.execute(
        text('UPDATE "approvals" SET status = :status, approver_id = :by, decided_at = NOW() WHERE id = ANY(:ids) AND agent_run_id IN (SELECT id FROM "agent_runs" WHERE company_id = :c)'),
        {"status": status, "by": tenant.user_id, "ids": approvalIds, "c": tenant.company_id},
    )
    db.commit()
    return {"success": True, "updated": len(approvalIds)}


@router.get("/approvals/rules")
def rules(tenant: Tenant = Depends(require_roles("manager", "company_admin"))):
    return {"success": True, "rules": RULES}


@router.put("/approvals/rules")
def update_rules(body: RuleBody, tenant: Tenant = Depends(require_roles("manager", "company_admin"))):
    RULES.update(body.model_dump())
    return {"success": True, "rules": RULES}


@router.get("/oversight/campaigns/{campaign_id}")
def campaign_detail(campaign_id: str, tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT * FROM "campaigns" WHERE id = :id AND company_id = :c'), {"id": campaign_id, "c": tenant.company_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"success": True, "campaign": dict(row._mapping)}


@router.post("/oversight/campaigns/{campaign_id}/assign")
def assign_campaign(campaign_id: str, tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db), userId: str = ""):
    db.execute(text('UPDATE "campaigns" SET user_id = :u WHERE id = :id AND company_id = :c'), {"u": userId, "id": campaign_id, "c": tenant.company_id})
    db.commit()
    return {"success": True, "campaignId": campaign_id, "userId": userId}


@router.get("/settings")
def settings(tenant: Tenant = Depends(require_roles("manager", "company_admin"))):
    return {"success": True, "settings": SETTINGS}


@router.put("/settings")
def update_settings(tenant: Tenant = Depends(require_roles("manager", "company_admin")), db: Session = Depends(get_db), notifyOnPending: bool | None = None, notifyOnLowBalance: bool | None = None, escalationHours: int | None = None):
    if notifyOnPending is not None:
        SETTINGS["notifyOnPending"] = notifyOnPending
    if notifyOnLowBalance is not None:
        SETTINGS["notifyOnLowBalance"] = notifyOnLowBalance
    if escalationHours is not None:
        SETTINGS["escalationHours"] = escalationHours
    return {"success": True, "settings": SETTINGS}