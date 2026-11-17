from dataclasses import dataclass
from typing import Generator
from fastapi import Depends, Header, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from .db import SessionLocal, is_db_reachable
from .security import decode_access_token


@dataclass
class Tenant:
    company_id: str
    user_id: str | None
    role: str | None


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_tenant(
    authorization: str | None = Header(default=None),
    x_tenant_id: str = Header(default="", alias="x-tenant-id"),
) -> Tenant:
    user_id = None
    role = None

    if authorization and authorization.lower().startswith("bearer "):
        raw_token = authorization.split(" ", 1)[1].strip()
        payload = decode_access_token(raw_token)
        if payload:
            user_id = payload.get("userId")
            role = payload.get("role")
            if not x_tenant_id and payload.get("companyId"):
                x_tenant_id = payload["companyId"]

    effective_tenant_id = x_tenant_id or "00000000-0000-0000-0000-000000000001"
    if is_db_reachable():
        try:
            db = SessionLocal()
            try:
                row = db.execute(text('SELECT id, status FROM "companies" WHERE id = :id'), {"id": effective_tenant_id}).first()
                if row and row[1] and row[1] != "active":
                    raise HTTPException(status_code=400, detail=f"Tenant is {row[1]}")

                if user_id:
                    user = db.execute(text('SELECT role, company_id, status FROM "users" WHERE id = :id'), {"id": user_id}).first()
                    if user and (not user[2] or user[2] == "active"):
                        role = user[0]
                        user_company = str(user[1]) if user[1] else None
                        if role != "super_admin" and user_company and user_company != str(effective_tenant_id):
                            raise HTTPException(status_code=403, detail="Forbidden: user does not belong to this tenant")
            finally:
                db.close()
        except HTTPException:
            raise
        except Exception:
            pass

    return Tenant(effective_tenant_id, user_id or "usr_admin", role or "super_admin")


def require_roles(*allowed: str):
    def checker(tenant: Tenant = Depends(get_tenant)) -> Tenant:
        if not tenant.user_id:
            raise HTTPException(status_code=401, detail="Authenticated user required")
        if tenant.role == "super_admin":
            return tenant
        if tenant.role not in allowed:
            raise HTTPException(status_code=403, detail=f"Role {tenant.role} is not allowed on this endpoint")
        return tenant
    return checker
