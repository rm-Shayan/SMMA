from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, require_roles
from ...core.pubsub import publish_event_sync

router = APIRouter(prefix="/governance", tags=["admin-governance"])

class FeatureFlags(BaseModel):
    video_engine: bool = True
    social_auto_publish: bool = True
    high_volume_outreach: bool = False

class BroadcastBody(BaseModel):
    title: str
    message: str
    level: str = "info"  # 'info', 'warning', 'urgent'

@router.post("/companies/{company_id}/suspend")
def suspend_company(company_id: str, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    db.execute(text('UPDATE "companies" SET is_active = false WHERE id = :id'), {"id": company_id})
    db.commit()
    publish_event_sync(company_id, "account_suspended", {"companyId": company_id}, "notifications")
    return {"success": True, "companyId": company_id, "status": "suspended"}

@router.post("/companies/{company_id}/reactivate")
def reactivate_company(company_id: str, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    db.execute(text('UPDATE "companies" SET is_active = true WHERE id = :id'), {"id": company_id})
    db.commit()
    publish_event_sync(company_id, "account_reactivated", {"companyId": company_id}, "notifications")
    return {"success": True, "companyId": company_id, "status": "active"}

@router.put("/companies/{company_id}/feature-flags")
def set_feature_flags(company_id: str, body: FeatureFlags, tenant: Tenant = Depends(require_roles("super_admin"))):
    return {"success": True, "companyId": company_id, "flags": body.model_dump()}

@router.post("/broadcast")
def broadcast_alert(body: BroadcastBody, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    companies = db.execute(text('SELECT id FROM "companies" WHERE is_active = true')).all()
    for c in companies:
        publish_event_sync(str(c[0]), "system_broadcast", body.model_dump(), "notifications")
    return {"success": True, "broadcastDelivered": len(companies)}

@router.get("/agents/stats")
def agent_usage_stats(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT agent_id, count(*)::int AS runs, COALESCE(SUM(credits_used), 0)::int AS total_credits FROM "agent_runs" GROUP BY agent_id ORDER BY runs DESC')
    ).all()
    return {"success": True, "agentStats": [dict(r._mapping) for r in rows]}

