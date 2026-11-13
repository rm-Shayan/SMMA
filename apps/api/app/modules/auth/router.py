from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from .service import login, register_user

router = APIRouter()


class LoginBody(BaseModel):
    email: str
    password: str | None = None


class RegisterBody(BaseModel):
    companyId: str
    email: str
    name: str
    role: str


@router.post("/login")
def do_login(body: LoginBody):
    try:
        return {"success": True, **login(body.email)}
    except ValueError as exc:
        return {"success": False, "error": str(exc)}


@router.get("/me")
def me(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    if not tenant.user_id:
        raise HTTPException(status_code=401, detail="Authenticated user required")
    row = db.execute(
        text('SELECT id, company_id, email, name, role, status FROM "users" WHERE id = :id'),
        {"id": tenant.user_id},
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "user": dict(row._mapping)}


@router.post("/register")
def do_register(body: RegisterBody):
    return {"success": True, "user": register_user(body.companyId, body.email, body.name, body.role)}

