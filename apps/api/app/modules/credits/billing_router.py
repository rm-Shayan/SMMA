import csv
import io
import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant, require_roles
from . import service as ledger
from .stripe_service import create_checkout_session, handle_stripe_webhook

billing_router = APIRouter()

class AmountBody(BaseModel):
    amount: int = Field(gt=0)

class CheckoutBody(BaseModel):
    credits: int = Field(gt=0)
    priceUsd: float = Field(gt=0.0)

@billing_router.post("/checkout-session")
def checkout(body: CheckoutBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    result = create_checkout_session(tenant.company_id, tenant.user_id, body.credits, body.priceUsd, db=db)
    return {"success": True, **result}

@billing_router.post("/stripe-webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db), stripe_signature: str = Header(default="")):
    payload = await request.body()
    try:
        res = handle_stripe_webhook(payload, stripe_signature, db)
        return {"success": True, **res}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@billing_router.get("/wallets")
def wallets(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, company_id, user_id, balance, reserved FROM "credit_wallets" WHERE company_id = :c ORDER BY user_id NULLS FIRST'),
        {"c": tenant.company_id},
    ).all()
    return {"success": True, "wallets": [dict(row._mapping) for row in rows]}

@billing_router.get("/wallets/{wallet_id}")
def wallet_detail(wallet_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(
        text('SELECT id, company_id, user_id, balance, reserved FROM "credit_wallets" WHERE id = :id AND company_id = :c'),
        {"id": wallet_id, "c": tenant.company_id},
    ).first()
    if not row:
        return {"success": False, "error": "Wallet not found"}
    return {"success": True, "wallet": dict(row._mapping)}

@billing_router.post("/wallets/{wallet_id}/adjust")
def adjust_wallet(wallet_id: str, body: AmountBody, tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    row = db.execute(
        text('SELECT id, company_id FROM "credit_wallets" WHERE id = :id AND company_id = :c FOR UPDATE'),
        {"id": wallet_id, "c": tenant.company_id},
    ).first()
    if not row:
        return {"success": False, "error": "Wallet not found"}
    db.execute(text('UPDATE "credit_wallets" SET balance = balance + :amount WHERE id = :id'), {"amount": body.amount, "id": wallet_id})
    db.execute(
        text(
            'INSERT INTO "credit_transactions" (id, wallet_id, counter_wallet_id, type, amount, created_by, note, created_at) '
            "VALUES (:id, :wallet, NULL, 'purchase', :amount, :by, 'Manual adjustment', NOW())"
        ),
        {"id": str(uuid.uuid4()), "wallet": wallet_id, "amount": body.amount, "by": tenant.user_id},
    )
    db.commit()
    return {"success": True, "wallet": ledger.get_wallet(db, wallet_id)}

@billing_router.get("/ledger/export")
def ledger_export(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text(
            """
            SELECT ct.created_at, ct.type, ct.amount, ct.note, cw.user_id
            FROM "credit_transactions" ct JOIN "credit_wallets" cw ON ct.wallet_id = cw.id
            WHERE cw.company_id = :c ORDER BY ct.created_at DESC
            """
        ),
        {"c": tenant.company_id},
    ).all()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["created_at", "type", "amount", "note", "user_id"])
    for row in rows:
        writer.writerow([row[0], row[1], row[2], row[3], row[4]])
    return Response(content=buffer.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=ledger.csv"})

