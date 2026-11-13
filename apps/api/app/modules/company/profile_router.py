from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, require_roles

router = APIRouter(prefix="/profile", tags=["company-profile"])

class ProfileUpdate(BaseModel):
    name: str | None = None
    brand_tone: str | None = "bold"
    language: str | None = "roman_urdu"
    logo_url: str | None = None

class BrandKit(BaseModel):
    primaryColor: str = "#2563eb"
    accentColor: str = "#f59e0b"
    fontFamily: str = "Inter, sans-serif"
    emailSignature: str = "Sent autonomously by Styre-BOT"

@router.get("")
def get_company_profile(tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id, name, tier, is_active FROM "companies" WHERE id = :id'), {"id": tenant.company_id}).first()
    return {"success": True, "profile": dict(row._mapping) if row else {}}

@router.patch("")
def update_company_profile(body: ProfileUpdate, tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    if body.name:
        db.execute(text('UPDATE "companies" SET name = :name WHERE id = :id'), {"name": body.name, "id": tenant.company_id})
        db.commit()
    return {"success": True, "companyId": tenant.company_id, "updated": body.model_dump()}

@router.get("/branding")
def get_branding(tenant: Tenant = Depends(require_roles("super_admin", "company_admin"))):
    return {
        "success": True,
        "companyId": tenant.company_id,
        "brandKit": {"primaryColor": "#2563eb", "accentColor": "#f59e0b", "fontFamily": "Inter", "emailSignature": "Powered by Styre-BOT"},
    }

@router.put("/branding")
def save_branding(body: BrandKit, tenant: Tenant = Depends(require_roles("super_admin", "company_admin"))):
    return {"success": True, "companyId": tenant.company_id, "brandKit": body.model_dump()}

