import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, require_roles
from ..credits import ledger

router = APIRouter(prefix="/quotas", tags=["company-quotas"])

class SetQuota(BaseModel):
    userId: str
    monthlyAllowance: int = Field(gt=0)

@router.get("")
def list_quotas(tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, user_id, balance, reserved FROM "credit_wallets" WHERE company_id = :c AND user_id IS NOT NULL'),
        {"c": tenant.company_id},
    ).all()
    return {"success": True, "employeeWallets": [dict(r._mapping) for r in rows]}

@router.post("")
def set_quota(body: SetQuota, tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    # Immediately allocates initial quota from company wallet
    res = ledger.allocate(db, tenant.company_id, body.userId, body.monthlyAllowance, tenant.user_id)
    return {"success": True, "userId": body.userId, "monthlyQuota": body.monthlyAllowance, "allocated": res}

@router.post("/reclaim-unused")
def reclaim_unused(tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    """Pulls unspent employee credits back into company wallet."""
    rows = db.execute(
        text('SELECT id, user_id, balance, reserved FROM "credit_wallets" WHERE company_id = :c AND user_id IS NOT NULL FOR UPDATE'),
        {"c": tenant.company_id},
    ).all()
    total_reclaimed = 0
    for r in rows:
        avail = int(r[2]) - int(r[3])
        if avail > 0:
            ledger.revoke(db, tenant.company_id, str(r[1]), avail, tenant.user_id, note="Month-end unspent reclaim")
            total_reclaimed += avail
    return {"success": True, "totalReclaimed": total_reclaimed, "employeesProcessed": len(rows)}

