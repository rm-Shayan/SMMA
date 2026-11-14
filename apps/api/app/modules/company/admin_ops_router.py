import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant, require_roles
from ..credits import service as ledger

router = APIRouter(tags=["company-admin-ops"])
POLICY = {"requireApprovalAbove": 20, "autoApproveAgents": [], "escalatePricing": True}
PAYMENT_METHODS: list[dict] = []


class SpendCapBody(BaseModel):
    campaignCreditLimit: int = Field(ge=0)


class RuleBody(BaseModel):
    requireApprovalAbove: int = 20
    autoApproveAgents: list[int] = []
    escalatePricing: bool = True


class PaymentBody(BaseModel):
    provider: str
    reference: str


@router.post("/users/{user_id}/reactivate")
def reactivate_user(user_id: str, tenant: Tenant = Depends(require_roles("company_admin", "super_admin")), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id FROM "users" WHERE id = :id AND company_id = :c'), {"id": user_id, "c": tenant.company_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    db.execute(text('UPDATE "users" SET status = \'active\' WHERE id = :id'), {"id": user_id})
    db.commit()
    return {"success": True, "userId": user_id, "status": "active"}


@router.get("/credits/spend-caps")
def spend_caps(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT COALESCE(max(credit_limit), 0) AS cap, count(*)::int AS campaigns FROM "campaigns" WHERE company_id = :c'), {"c": tenant.company_id}).first()
    return {"success": True, "spendCaps": {"maxCampaignCreditLimit": int(row[0]), "campaigns": int(row[1])}}


@router.patch("/credits/spend-caps")
def set_spend_cap(body: SpendCapBody, tenant: Tenant = Depends(require_roles("company_admin")), db: Session = Depends(get_db)):
    db.execute(text('UPDATE "campaigns" SET credit_limit = :cap WHERE company_id = :c'), {"cap": body.campaignCreditLimit, "c": tenant.company_id})
    db.commit()
    return {"success": True, "maxCampaignCreditLimit": body.campaignCreditLimit}


@router.get("/approvals/rules")
def approval_rules(tenant: Tenant = Depends(require_roles("company_admin", "manager", "super_admin"))):
    return {"success": True, "rules": POLICY}


@router.patch("/approvals/rules")
def update_rules(body: RuleBody, tenant: Tenant = Depends(require_roles("company_admin")), db: Session = Depends(get_db)):
    POLICY.update(body.model_dump())
    return {"success": True, "rules": POLICY}


@router.get("/analytics/scheduled-reports")
def scheduled_reports(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, agent_id, cron, payload, next_run_at, enabled FROM "schedules" WHERE company_id = :c AND payload::text LIKE :q'),
        {"c": tenant.company_id, "q": "%report%"},
    ).all()
    return {"success": True, "reports": [dict(row._mapping) for row in rows]}


@router.get("/billing/payment-methods")
def payment_methods(tenant: Tenant = Depends(get_tenant)):
    return {"success": True, "methods": PAYMENT_METHODS}


@router.post("/billing/payment-methods")
def add_payment_method(body: PaymentBody, tenant: Tenant = Depends(require_roles("company_admin"))):
    PAYMENT_METHODS.append({"id": str(uuid.uuid4()), **body.model_dump()})
    return {"success": True, "methods": PAYMENT_METHODS}


@router.post("/integrations/oauth/{provider}/callback")
def oauth_callback(provider: str, tenant: Tenant = Depends(require_roles("company_admin", "manager")), db: Session = Depends(get_db), code: str = "", state: str = ""):
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code required")
    account_id = str(uuid.uuid4())
    db.execute(
        text(
            'INSERT INTO "connected_accounts" (id, company_id, user_id, provider, display_name, token_enc, status, created_at) '
            "VALUES (:id, :c, :u, :p, :name, :token, 'active', NOW())"
        ),
        {"id": account_id, "c": tenant.company_id, "u": tenant.user_id, "p": provider, "name": f"{provider} account", "token": code},
    )
    db.execute(
        text('INSERT INTO "account_limits" (connected_account_id, min_gap_sec, max_gap_sec, per_hour, per_day, work_hours) VALUES (:id, 45, 180, 20, 50, \'09:00-22:00\') ON CONFLICT DO NOTHING'),
        {"id": account_id},
    )
    db.commit()
    return {"success": True, "accountId": account_id, "provider": provider}


@router.patch("/campaigns/{campaign_id}")
def update_company_campaign(campaign_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), goal: str | None = None, tone: str | None = None, status: str | None = None, creditLimit: int | None = None):
    db.execute(
        text('UPDATE "campaigns" SET goal = COALESCE(:goal, goal), tone = COALESCE(:tone, tone), status = COALESCE(:status, status), credit_limit = COALESCE(:cap, credit_limit) WHERE id = :id AND company_id = :c'),
        {"id": campaign_id, "c": tenant.company_id, "goal": goal, "tone": tone, "status": status, "cap": creditLimit},
    )
    db.commit()
    return {"success": True, "campaignId": campaign_id}