import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, require_roles

router = APIRouter()


class CompanyBody(BaseModel):
    name: str = Field(min_length=2)
    timezone: str = "UTC"


class CompanyPatch(BaseModel):
    status: str


@router.get("/companies")
def list_companies(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT id, name, timezone, status, created_at FROM "companies" ORDER BY created_at DESC')).all()
    return {"success": True, "companies": [dict(row._mapping) for row in rows]}


@router.post("/companies")
def create_company(body: CompanyBody, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    company_id = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "companies" (id, name, timezone, status, created_at) VALUES (:id, :name, :tz, \'active\', NOW())'),
        {"id": company_id, "name": body.name, "tz": body.timezone},
    )
    db.commit()
    return {"success": True, "company": {"id": company_id, **body.model_dump(), "status": "active"}}


@router.patch("/companies/{company_id}")
def update_company(company_id: str, body: CompanyPatch, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    if body.status not in ("active", "suspended"):
        return {"success": False, "error": "Invalid status"}
    db.execute(text('UPDATE "companies" SET status = :status WHERE id = :id'), {"status": body.status, "id": company_id})
    db.commit()
    return {"success": True, "companyId": company_id, "status": body.status}


@router.get("/audit-logs")
def audit_logs(tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db), limit: int = 100):
    rows = db.execute(
        text('SELECT * FROM "audit_logs" WHERE company_id = :c ORDER BY created_at DESC LIMIT :limit'),
        {"c": tenant.company_id, "limit": limit},
    ).all()
    return {"success": True, "logs": [dict(row._mapping) for row in rows]}