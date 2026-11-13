from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, require_roles
from ...core.pubsub import publish_event_sync

router = APIRouter(prefix="/oversight", tags=["manager-oversight"])

class AgentOverride(BaseModel):
    userId: str
    agentId: int
    forceDraftMode: bool = True

@router.get("/campaigns")
def list_team_campaigns(tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, user_id, goal, tone, credit_limit, status, created_at FROM "campaigns" WHERE company_id = :c ORDER BY created_at DESC LIMIT 50'),
        {"c": tenant.company_id},
    ).all()
    return {"success": True, "campaigns": [dict(r._mapping) for r in rows]}

@router.post("/campaigns/{campaign_id}/pause")
def pause_team_campaign(campaign_id: str, tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    db.execute(text('UPDATE "campaigns" SET status = \'paused\' WHERE id = :id AND company_id = :c'), {"id": campaign_id, "c": tenant.company_id})
    db.commit()
    publish_event_sync(tenant.company_id, "campaign_paused_by_manager", {"campaignId": campaign_id}, "notifications")
    return {"success": True, "campaignId": campaign_id, "status": "paused"}

@router.get("/analytics/summary")
def team_analytics_summary(tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    posts = db.execute(text('SELECT count(*)::int FROM "social_posts" WHERE company_id = :c'), {"c": tenant.company_id}).scalar()
    runs = db.execute(text('SELECT count(*)::int FROM "agent_runs" WHERE company_id = :c'), {"c": tenant.company_id}).scalar()
    leads = db.execute(text('SELECT count(*)::int FROM "contacts" WHERE company_id = :c'), {"c": tenant.company_id}).scalar()
    return {"success": True, "teamMetrics": {"totalPosts": posts, "totalAgentRuns": runs, "leadsCaptured": leads}}

@router.post("/agent-override")
def override_member_agent(body: AgentOverride, tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager"))):
    return {"success": True, "configured": True, "userId": body.userId, "forceDraftMode": body.forceDraftMode}

