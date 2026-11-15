from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ...core.rate_limiter import rate_limit
from .service import login, register_user

router = APIRouter()


class LoginBody(BaseModel):
    email: str
    password: str = Field(min_length=1)


class RegisterBody(BaseModel):
    companyId: str
    email: str
    name: str
    role: str = "employee"
    password: str = Field(min_length=8)


@router.post("/login", dependencies=[Depends(rate_limit(requests_per_minute=10, by="ip"))])
def do_login(body: LoginBody):
    try:
        res = login(body.email, body.password)
        return {"success": True, **res}
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


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


@router.post("/register", dependencies=[Depends(rate_limit(requests_per_minute=5, by="ip"))])
def do_register(body: RegisterBody):
    try:
        user = register_user(body.companyId, body.email, body.name, body.role, body.password)
        return {"success": True, "user": user}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
