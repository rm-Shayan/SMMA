import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, require_roles
from ..credits import ledger

router = APIRouter(prefix="/team", tags=["manager-team"])

class AllocateBody(BaseModel):
    userId: str
    amount: int = Field(gt=0)
    note: str = "Manager credit allocation"

class RevokeBody(BaseModel):
    userId: str
    amount: int = Field(gt=0)
    note: str = "Manager credit revoke"

@router.get("/members")
def get_team_members(tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, email, role, is_active, created_at FROM "users" WHERE company_id = :c ORDER BY created_at DESC'),
        {"c": tenant.company_id},
    ).all()
    return {"success": True, "managerId": tenant.user_id, "members": [dict(r._mapping) for r in rows]}

@router.get("/credits")
def get_team_credits(tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT cw.id, cw.user_id, cw.balance, cw.reserved, u.email, u.role FROM "credit_wallets" cw JOIN "users" u ON cw.user_id = u.id WHERE cw.company_id = :c'),
        {"c": tenant.company_id},
    ).all()
    return {"success": True, "teamWallets": [dict(r._mapping) for r in rows]}

@router.post("/credits/allocate")
def allocate_to_member(body: AllocateBody, tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    res = ledger.allocate(db, tenant.company_id, body.userId, body.amount, tenant.user_id)
    return {"success": True, "allocated": res, "note": body.note}

@router.post("/credits/revoke")
def revoke_from_member(body: RevokeBody, tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    res = ledger.revoke(db, tenant.company_id, body.userId, body.amount, tenant.user_id, note=body.note)
    return {"success": True, "revoked": res}

