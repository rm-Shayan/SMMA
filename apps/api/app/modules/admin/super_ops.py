import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, require_roles
from ..credits import service as ledger

router = APIRouter()


class RoleBody(BaseModel):
    role: str


class AmountBody(BaseModel):
    companyId: str
    amount: int
    note: str = "superadmin adjustment"


@router.get("/companies/{company_id}")
def get_company(company_id: str, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT * FROM "companies" WHERE id = :id'), {"id": company_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"success": True, "company": dict(row._mapping)}


@router.delete("/companies/{company_id}")
def archive_company(company_id: str, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    db.execute(text('UPDATE "companies" SET status = \'deleted\' WHERE id = :id'), {"id": company_id})
    db.commit()
    return {"success": True, "companyId": company_id, "status": "deleted"}


@router.get("/companies/{company_id}/health")
def company_health(company_id: str, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    wallet = db.execute(text('SELECT balance FROM "credit_wallets" WHERE company_id = :id AND user_id IS NULL'), {"id": company_id}).first()
    users = db.execute(text('SELECT count(*)::int FROM "users" WHERE company_id = :id'), {"id": company_id}).scalar()
    runs = db.execute(text('SELECT count(*)::int FROM "agent_runs" WHERE company_id = :id'), {"id": company_id}).scalar()
    return {"success": True, "health": {"companyId": company_id, "users": users, "runs": runs, "balance": wallet[0] if wallet else 0}}


@router.get("/users")
def admin_users(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT id, company_id, email, name, role, status FROM "users" ORDER BY created_at DESC')).all()
    return {"success": True, "users": [dict(row._mapping) for row in rows]}


@router.patch("/users/{user_id}/role")
def set_role(user_id: str, body: RoleBody, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    if body.role not in ("super_admin", "company_admin", "manager", "employee"):
        return {"success": False, "error": "Invalid role"}
    db.execute(text('UPDATE "users" SET role = :role WHERE id = :id'), {"role": body.role, "id": user_id})
    db.commit()
    return {"success": True, "userId": user_id, "role": body.role}


@router.delete("/users/{user_id}")
def archive_user(user_id: str, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    db.execute(text('UPDATE "users" SET status = \'inactive\' WHERE id = :id'), {"id": user_id})
    db.commit()
    return {"success": True, "userId": user_id, "status": "inactive"}


@router.get("/impersonate/sessions")
def sessions(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT id, user_id, entity_id, meta, created_at FROM "audit_logs" WHERE action = \'impersonate\' ORDER BY created_at DESC LIMIT 100')).all()
    return {"success": True, "sessions": [dict(row._mapping) for row in rows]}


@router.post("/billing/refund")
def refund(body: AmountBody, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    wallet = ledger.get_company_wallet(db, body.companyId)
    if not wallet:
        raise HTTPException(status_code=404, detail="Company wallet not found")
    db.execute(text('UPDATE "credit_wallets" SET balance = balance - :amount WHERE id = :id'), {"amount": body.amount, "id": wallet["id"]})
    db.execute(
        text('INSERT INTO "credit_transactions" (id, wallet_id, type, amount, created_by, note, created_at) VALUES (:id, :w, \'purchase\', :amount, :by, :note, NOW())'),
        {"id": str(uuid.uuid4()), "w": wallet["id"], "amount": -body.amount, "by": tenant.user_id, "note": body.note},
    )
    db.commit()
    return {"success": True, "refunded": body.amount}


@router.get("/billing/transactions")
def billing_transactions(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT ct.created_at, ct.type, ct.amount, ct.note FROM "credit_transactions" ct JOIN "credit_wallets" cw ON ct.wallet_id = cw.id WHERE cw.user_id IS NULL ORDER BY ct.created_at DESC LIMIT 100')).all()
    return {"success": True, "transactions": [dict(row._mapping) for row in rows]}


@router.post("/billing/adjust")
def adjust(body: AmountBody, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    return {"success": True, "wallet": ledger.purchase(db, body.companyId, body.amount, tenant.user_id, body.note)}