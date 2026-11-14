import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ..campaigns.outreach import OutreachAgent

router = APIRouter(prefix="/campaigns", tags=["employee-campaigns"])


class CampaignBody(BaseModel):
    connectedAccountId: str
    goal: str = Field(min_length=5)
    tone: str = "professional"
    prospects: list[dict] = Field(min_length=1)


@router.get("")
def my_campaigns(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(text('SELECT * FROM "campaigns" WHERE company_id = :c AND user_id = :u ORDER BY created_at DESC LIMIT :limit'), {"c": tenant.company_id, "u": tenant.user_id, "limit": limit}).all()
    return {"success": True, "campaigns": [dict(row._mapping) for row in rows]}


@router.post("")
def create_campaign(body: CampaignBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    campaign_id = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "campaigns" (id, company_id, user_id, connected_account_id, goal, tone, credit_limit, status) VALUES (:id, :c, :u, :a, :g, :t, :cap, \'active\')'),
        {"id": campaign_id, "c": tenant.company_id, "u": tenant.user_id, "a": body.connectedAccountId, "g": body.goal, "t": body.tone, "cap": len(body.prospects)},
    )
    db.commit()
    return {"success": True, "campaignId": campaign_id, "prospects": len(body.prospects)}


@router.post("/{campaign_id}/pause")
def pause_campaign(campaign_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    db.execute(text('UPDATE "campaigns" SET status = \'paused\' WHERE id = :id AND company_id = :c AND user_id = :u'), {"id": campaign_id, "c": tenant.company_id, "u": tenant.user_id})
    db.commit()
    return {"success": True, "campaignId": campaign_id, "status": "paused"}


@router.get("/{campaign_id}/recipients")
def recipients(campaign_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT cr.id, cr.status, cr.followups_sent, ct.email, ct.name FROM "campaign_recipients" cr JOIN "contacts" ct ON cr.contact_id = ct.id WHERE cr.campaign_id = :id AND ct.company_id = :c'),
        {"id": campaign_id, "c": tenant.company_id},
    ).all()
    return {"success": True, "recipients": [dict(row._mapping) for row in rows]}