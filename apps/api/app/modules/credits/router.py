import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant, require_roles
from . import service as ledger
from .billing_router import billing_router

router = APIRouter()
router.include_router(billing_router)

class AmountBody(BaseModel):
    amount: int = Field(gt=0)

class AllocateBody(BaseModel):
    userId: str
    amount: int = Field(gt=0)

class RevokeBody(BaseModel):
    userId: str
    amount: int = Field(gt=0)
    note: str | None = None

@router.get("/balance")
def balances(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    company = ledger.get_company_wallet(db, tenant.company_id)
    user = None
    if tenant.user_id:
        row = db.execute(
            text('SELECT id FROM "credit_wallets" WHERE company_id = :c AND user_id = :u'),
            {"c": tenant.company_id, "u": tenant.user_id},
        ).first()
        if row:
            user = ledger.get_wallet(db, str(row[0]))
    return {"success": True, "companyWallet": company, "userWallet": user}

@router.post("/purchase")
def purchase(body: AmountBody, tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    wallet = ledger.purchase(db, tenant.company_id, body.amount, tenant.user_id)
    return {"success": True, "wallet": wallet}

@router.post("/grant")
def grant(body: AmountBody, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    wallet = ledger.grant(db, tenant.company_id, body.amount, tenant.user_id)
    return {"success": True, "wallet": wallet}

@router.post("/allocate")
def allocate(body: AllocateBody, tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    result = ledger.allocate(db, tenant.company_id, body.userId, body.amount, tenant.user_id)
    return {"success": True, **result}

@router.post("/revoke")
def revoke(body: RevokeBody, tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    result = ledger.revoke(db, tenant.company_id, body.userId, body.amount, tenant.user_id, body.note)
    return {"success": True, **result}

@router.post("/expire")
def expire_credits(tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, balance, reserved FROM "credit_wallets" WHERE company_id = :c AND user_id IS NOT NULL FOR UPDATE'),
        {"c": tenant.company_id},
    ).all()
    total = 0
    for row in rows:
        available = int(row[1]) - int(row[2])
        if available <= 0:
            continue
        db.execute(text('UPDATE "credit_wallets" SET balance = balance - :amount WHERE id = :id'), {"amount": available, "id": row[0]})
        db.execute(
            text(
                'INSERT INTO "credit_transactions" (id, wallet_id, counter_wallet_id, type, amount, created_by, note, created_at) '
                "VALUES (:id, :wallet, NULL, 'expire', :amount, :by, 'Plan expiry', NOW())"
            ),
            {"id": str(uuid.uuid4()), "wallet": row[0], "amount": -available, "by": tenant.user_id},
        )
        total += available
    db.commit()
    return {"success": True, "expired": total, "wallets": len(rows)}

@router.get("/transactions")
def transactions(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(
        text(
            'SELECT ct.* FROM "credit_transactions" ct JOIN "credit_wallets" cw ON ct.wallet_id = cw.id '
            'WHERE cw.company_id = :c ORDER BY ct.created_at DESC LIMIT :limit'
        ),
        {"c": tenant.company_id, "limit": limit},
    ).all()
    return {"success": True, "transactions": [dict(row._mapping) for row in rows]}
