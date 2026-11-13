from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ...core.pubsub import publish_event_sync

router = APIRouter(prefix="/overview", tags=["employee-overview"])

class CreditReq(BaseModel):
    requestedAmount: int = Field(gt=0)
    reason: str = "Need credits for outreach campaign"

@router.get("/dashboard")
def employee_dashboard(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    wallet = db.execute(
        text('SELECT balance, reserved FROM "credit_wallets" WHERE company_id = :c AND user_id = :u'),
        {"c": tenant.company_id, "u": tenant.user_id},
    ).first()
    my_posts = db.execute(
        text('SELECT count(*)::int FROM "social_posts" WHERE company_id = :c AND user_id = :u'),
        {"c": tenant.company_id, "u": tenant.user_id},
    ).scalar() or 0
    my_drafts = db.execute(
        text('SELECT count(*)::int FROM "approvals" WHERE company_id = :c AND requested_by = :u AND status = \'pending\''),
        {"c": tenant.company_id, "u": tenant.user_id},
    ).scalar() or 0
    return {
        "success": True,
        "userId": tenant.user_id,
        "wallet": {"balance": wallet[0] if wallet else 0, "reserved": wallet[1] if wallet else 0},
        "stats": {"totalPosts": my_posts, "pendingApprovals": my_drafts},
    }

@router.get("/wallet")
def employee_wallet(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    wallet = db.execute(
        text('SELECT id, balance, reserved FROM "credit_wallets" WHERE company_id = :c AND user_id = :u'),
        {"c": tenant.company_id, "u": tenant.user_id},
    ).first()
    return {"success": True, "wallet": dict(wallet._mapping) if wallet else None}

@router.post("/credits/request")
def request_more_credits(body: CreditReq, tenant: Tenant = Depends(get_tenant)):
    publish_event_sync(
        tenant.company_id,
        "credit_topup_requested",
        {"userId": tenant.user_id, "amount": body.requestedAmount, "reason": body.reason},
        "notifications",
    )
    return {"success": True, "requestedAmount": body.requestedAmount, "status": "submitted"}

