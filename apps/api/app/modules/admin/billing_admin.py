from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, require_roles

router = APIRouter(prefix="/billing", tags=["admin-billing"])

class SubscriptionUpdate(BaseModel):
    plan: str = "enterprise"
    status: str = "active"

@router.get("/revenue")
def revenue_analytics(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    tx_count = db.execute(text('SELECT count(*)::int FROM "credit_transactions" WHERE type = \'purchase\'')).scalar()
    total_purchased = db.execute(text('SELECT COALESCE(SUM(amount), 0)::int FROM "credit_transactions" WHERE type = \'purchase\'')).scalar()
    companies = db.execute(text('SELECT count(*)::int FROM "companies"')).scalar()
    return {
        "success": True,
        "totalPurchasedCredits": total_purchased,
        "purchaseTransactions": tx_count,
        "activeTenants": companies,
        "estimatedRevenueUsd": round(total_purchased * 0.10, 2),
    }

@router.get("/invoices")
def global_invoices(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, company_id, balance, reserved FROM "credit_wallets" WHERE user_id IS NULL')
    ).all()
    return {"success": True, "tenantWallets": [dict(r._mapping) for r in rows]}

@router.post("/companies/{company_id}/subscription")
def update_company_subscription(company_id: str, body: SubscriptionUpdate, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    db.execute(text('UPDATE "companies" SET tier = :tier WHERE id = :id'), {"tier": body.plan, "id": company_id})
    db.commit()
    return {"success": True, "companyId": company_id, "updatedPlan": body.plan}

