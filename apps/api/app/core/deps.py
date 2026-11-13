from dataclasses import dataclass
from typing import Generator
from fastapi import Depends, Header, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from .db import SessionLocal


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
    x_tenant_id: str = Header(default="", alias="x-tenant-id"),
    x_user_id: str = Header(default="", alias="x-user-id"),
) -> Tenant:
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail="Missing required header: x-tenant-id")
    db = SessionLocal()
    try:
        row = db.execute(text('SELECT id, status FROM "companies" WHERE id = :id'), {"id": x_tenant_id}).first()
        if not row:
            raise HTTPException(status_code=400, detail=f"Unknown tenant: {x_tenant_id}")
        if row[1] and row[1] != "active":
            raise HTTPException(status_code=400, detail=f"Tenant is {row[1]}")
        role = None
        if x_user_id:
            user = db.execute(text('SELECT role FROM "users" WHERE id = :id'), {"id": x_user_id}).first()
            role = user[0] if user else None
        return Tenant(x_tenant_id, x_user_id or None, role)
    finally:
        db.close()


def require_roles(*allowed: str):
    def checker(tenant: Tenant = Depends(get_tenant)) -> Tenant:
        if not tenant.user_id:
            raise HTTPException(status_code=401, detail="Authenticated user required")
        if tenant.role not in allowed:
            raise HTTPException(status_code=403, detail=f"Role {tenant.role} is not allowed on this endpoint")
        return tenant
    return checker
