import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, require_roles

router = APIRouter(tags=["admin-extra"])
PLANS = [{"id": "starter", "credits": 500, "priceUsd": 99}, {"id": "growth", "credits": 2000, "priceUsd": 349}]
COUPONS: list[dict] = []
TEMPLATES = [{"key": "low_balance", "title": "Low credit balance", "body": "Your company has only {credits} credits left."}]


class UserBody(BaseModel):
    companyId: str
    email: str
    name: str
    role: str = "employee"


class CouponBody(BaseModel):
    code: str
    percentOff: int = 10


class TemplateBody(BaseModel):
    key: str
    title: str
    body: str


class TestBody(BaseModel):
    companyId: str
    key: str


@router.post("/users")
def create_user(body: UserBody, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    user_id = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "users" (id, company_id, email, name, role, status, created_at) VALUES (:id, :c, :e, :n, :r, \'active\', NOW())'),
        {"id": user_id, "c": body.companyId, "e": body.email.lower(), "n": body.name, "r": body.role},
    )
    db.commit()
    return {"success": True, "user": {"id": user_id, **body.model_dump()}}


@router.get("/impersonate/{session_id}")
def impersonation_detail(session_id: str, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT * FROM "audit_logs" WHERE id = :id AND action = \'impersonate\''), {"id": session_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "session": dict(row._mapping)}


@router.get("/login-history")
def login_history(tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db), limit: int = 100):
    rows = db.execute(
        text('SELECT id, company_id, user_id, created_at FROM "audit_logs" WHERE action = \'login\' ORDER BY created_at DESC LIMIT :limit'),
        {"limit": limit},
    ).all()
    return {"success": True, "history": [dict(row._mapping) for row in rows]}


@router.get("/companies/{company_id}/invoices")
def company_invoices(company_id: str, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT ct.id, ct.amount, ct.note, ct.created_at FROM "credit_transactions" ct JOIN "credit_wallets" cw ON ct.wallet_id = cw.id WHERE cw.company_id = :id AND cw.user_id IS NULL AND ct.type = \'purchase\' ORDER BY ct.created_at DESC'),
        {"id": company_id},
    ).all()
    return {"success": True, "invoices": [dict(row._mapping) for row in rows]}


@router.get("/notifications/templates")
def templates(tenant: Tenant = Depends(require_roles("super_admin"))):
    return {"success": True, "templates": TEMPLATES}


@router.post("/notifications/templates")
def add_template(body: TemplateBody, tenant: Tenant = Depends(require_roles("super_admin"))):
    TEMPLATES.append(body.model_dump())
    return {"success": True, "templates": TEMPLATES}


@router.post("/notifications/test")
def test_notification(body: TestBody, tenant: Tenant = Depends(require_roles("super_admin"))):
    return {"success": True, "sent": True, "companyId": body.companyId, "template": body.key}


@router.get("/billing/plans")
def plans(tenant: Tenant = Depends(require_roles("super_admin"))):
    return {"success": True, "plans": PLANS}


@router.post("/billing/plans")
def add_plan(tenant: Tenant = Depends(require_roles("super_admin")), planId: str = "", credits: int = 0, priceUsd: float = 0):
    PLANS.append({"id": planId, "credits": credits, "priceUsd": priceUsd})
    return {"success": True, "plans": PLANS}


@router.get("/billing/coupons")
def coupons(tenant: Tenant = Depends(require_roles("super_admin"))):
    return {"success": True, "coupons": COUPONS}


@router.post("/billing/coupons")
def add_coupon(body: CouponBody, tenant: Tenant = Depends(require_roles("super_admin"))):
    COUPONS.append({"id": str(uuid.uuid4()), **body.model_dump()})
    return {"success": True, "coupons": COUPONS}