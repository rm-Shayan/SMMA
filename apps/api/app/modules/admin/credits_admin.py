import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, require_roles
from ..credits import ledger

router = APIRouter(prefix="/credits", tags=["admin-credits"])

class GrantBody(BaseModel):
    amount: int = Field(gt=0)
    note: str = "Super admin grant"

class RatesBody(BaseModel):
    rates: dict[str, int]

@router.get("/overview")
def credits_overview(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    total_minted = db.execute(text('SELECT COALESCE(SUM(balance), 0)::int FROM "credit_wallets"')).scalar()
    total_reserved = db.execute(text('SELECT COALESCE(SUM(reserved), 0)::int FROM "credit_wallets"')).scalar()
    total_tx = db.execute(text('SELECT count(*)::int FROM "credit_transactions"')).scalar()
    return {
        "success": True,
        "totalMinted": total_minted,
        "totalReserved": total_reserved,
        "totalTransactions": total_tx,
    }

@router.post("/companies/{company_id}/grant")
def grant_company_credits(company_id: str, body: GrantBody, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    wallet = ledger.grant(db, company_id, body.amount, tenant.user_id)
    return {"success": True, "companyId": company_id, "wallet": wallet}

@router.get("/rates")
def get_action_rates(tenant: Tenant = Depends(require_roles("super_admin"))):
    default_rates = {
        "cold_email": 1,
        "video_generation": 5,
        "voiceover": 2,
        "competitor_report": 3,
        "social_post": 1,
        "comment_reply": 1,
        "sop_quiz": 2,
    }
    return {"success": True, "actionRates": default_rates}

@router.post("/rates")
def set_action_rates(body: RatesBody, tenant: Tenant = Depends(require_roles("super_admin"))):
    return {"success": True, "updatedRates": body.rates}

@router.get("/ledger")
def global_ledger(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db), limit: int = 100):
    rows = db.execute(
        text(
            'SELECT ct.*, cw.company_id FROM "credit_transactions" ct '
            'JOIN "credit_wallets" cw ON ct.wallet_id = cw.id '
            'ORDER BY ct.created_at DESC LIMIT :limit'
        ),
        {"limit": limit},
    ).all()
    return {"success": True, "transactions": [dict(r._mapping) for r in rows]}

