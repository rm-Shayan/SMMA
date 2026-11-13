from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, require_roles

router = APIRouter(prefix="/security", tags=["company-security"])

class LimitUpdate(BaseModel):
    perDay: int = Field(gt=0, le=500)
    workHours: str = "09:00-18:00"

class ApprovalPolicy(BaseModel):
    requireApprovalAboveCredits: int = 5
    socialPostAutoApprove: bool = False

@router.get("/connectors-health")
def connectors_health(tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, provider, status, created_at FROM "connected_accounts" WHERE company_id = :c'),
        {"c": tenant.company_id},
    ).all()
    return {"success": True, "connectedAccounts": [dict(r._mapping) for r in rows]}

@router.patch("/connectors/{account_id}/limits")
def update_connector_limits(account_id: str, body: LimitUpdate, tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    db.execute(
        text('INSERT INTO "account_limits" (connected_account_id, per_day, work_hours) VALUES (:id, :p, :w) ON CONFLICT (connected_account_id) DO UPDATE SET per_day = :p, work_hours = :w'),
        {"id": account_id, "p": body.perDay, "w": body.workHours},
    )
    db.commit()
    return {"success": True, "accountId": account_id, "dailyCap": body.perDay, "workHours": body.workHours}

@router.get("/audit-trail")
def company_audit_trail(tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(
        text('SELECT * FROM "audit_logs" WHERE company_id = :c ORDER BY created_at DESC LIMIT :limit'),
        {"c": tenant.company_id, "limit": limit},
    ).all()
    return {"success": True, "auditLogs": [dict(r._mapping) for r in rows]}

@router.put("/approval-policy")
def set_approval_policy(body: ApprovalPolicy, tenant: Tenant = Depends(require_roles("super_admin", "company_admin"))):
    return {"success": True, "companyId": tenant.company_id, "policy": body.model_dump()}

