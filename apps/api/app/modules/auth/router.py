from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ...core.rate_limiter import rate_limit
from ...core.security import create_token, decode_access_token_ignoring_expiry
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


@router.post("/refresh", dependencies=[Depends(rate_limit(requests_per_minute=30, by="ip"))])
def do_refresh(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    raw = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token_ignoring_expiry(raw)
    if not payload or not payload.get("userId"):
        raise HTTPException(status_code=401, detail="Invalid session token")
    row = db.execute(
        text('SELECT id, company_id, email, name, role, status FROM "users" WHERE id = :id'),
        {"id": payload["userId"]},
    ).first()
    if not row or (row[5] and row[5] != "active"):
        raise HTTPException(status_code=401, detail="User not found or deactivated")
    user = {"id": row[0], "company_id": row[1], "email": row[2], "name": row[3], "role": row[4]}
    return {"success": True, "token": create_token(user), "user": user}


@router.post("/register", dependencies=[Depends(rate_limit(requests_per_minute=5, by="ip"))])
def do_register(body: RegisterBody):
    try:
        user = register_user(body.companyId, body.email, body.name, body.role, body.password)
        return {"success": True, "user": user}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/signup", dependencies=[Depends(rate_limit(requests_per_minute=5, by="ip"))])
def do_signup(body: RegisterBody):
    return do_register(body)
