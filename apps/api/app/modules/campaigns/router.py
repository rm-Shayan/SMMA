import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ...core.runner import run_agent
from ..credits import ledger
from .contacts_router import contacts_router

router = APIRouter()
router.include_router(contacts_router)

class Prospect(BaseModel):
    name: str
    email: str
    companyName: str | None = None
    topic: str | None = None

class CampaignBody(BaseModel):
    connectedAccountId: str
    goal: str = Field(min_length=5)
    tone: str = "professional"
    mode: str = "draft"
    prospects: list[Prospect] = Field(min_length=1)

@router.post("/")
def create_campaign(body: CampaignBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    cid = str(uuid.uuid4())
    ledger.allocate(db, tenant.company_id, tenant.user_id, max(1, len(body.prospects)), tenant.user_id)
    db.execute(text('INSERT INTO "campaigns" (id, company_id, user_id, connected_account_id, goal, tone, credit_limit, status) VALUES (:id, :c, :u, :account, :goal, :tone, :limit, \'active\')'), {"id": cid, "c": tenant.company_id, "u": tenant.user_id, "account": body.connectedAccountId, "goal": body.goal, "tone": body.tone, "limit": len(body.prospects)})
    db.commit()
    result = run_agent(tenant, "outreach", 6, "a0000000-0000-0000-0000-000000000006", body.mode, body.model_dump())
    return {"success": True, "campaignId": cid, "agentRunId": result.run_id, "data": result.data}

@router.get("/")
def list_campaigns(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(text('SELECT * FROM "campaigns" WHERE company_id = :c ORDER BY created_at DESC LIMIT :limit'), {"c": tenant.company_id, "limit": limit}).all()
    return {"success": True, "campaigns": [dict(r._mapping) for r in rows]}

@router.get("/{campaign_id}")
def get_campaign(campaign_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT * FROM "campaigns" WHERE id = :id AND company_id = :c'), {"id": campaign_id, "c": tenant.company_id}).first()
    return {"success": bool(row), "campaign": dict(row._mapping) if row else None}

@router.get("/{campaign_id}/recipients")
def list_recipients(campaign_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 100):
    rows = db.execute(text('SELECT cr.id, cr.contact_id, cr.topic, cr.status, ct.name, ct.email FROM "campaign_recipients" cr JOIN "contacts" ct ON cr.contact_id = ct.id WHERE cr.campaign_id = :id AND ct.company_id = :c ORDER BY cr.status LIMIT :limit'), {"id": campaign_id, "c": tenant.company_id, "limit": limit}).all()
    return {"success": True, "recipients": [dict(r._mapping) for r in rows]}

@router.patch("/{campaign_id}")
def update_campaign(campaign_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), goal: str | None = None, tone: str | None = None, status: str | None = None):
    row = db.execute(text('SELECT id FROM "campaigns" WHERE id = :id AND company_id = :c'), {"id": campaign_id, "c": tenant.company_id}).first()
    if not row:
        return {"success": False, "error": "Campaign not found"}
    db.execute(
        text('UPDATE "campaigns" SET goal = COALESCE(:goal, goal), tone = COALESCE(:tone, tone), status = COALESCE(:status, status) WHERE id = :id'),
        {"id": campaign_id, "goal": goal, "tone": tone, "status": status},
    )
    db.commit()
    return {"success": True, "campaignId": campaign_id}

@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id FROM "campaigns" WHERE id = :id AND company_id = :c'), {"id": campaign_id, "c": tenant.company_id}).first()
    if not row:
        return {"success": False, "error": "Campaign not found"}
    db.execute(text('DELETE FROM "campaign_recipients" WHERE campaign_id = :id'), {"id": campaign_id})
    db.execute(text('DELETE FROM "campaigns" WHERE id = :id'), {"id": campaign_id})
    db.commit()
    return {"success": True, "campaignId": campaign_id}

@router.get("/{campaign_id}/analytics")
def campaign_analytics(campaign_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(
        text(
            'SELECT count(*)::int AS recipients, '
            'count(*) FILTER (WHERE cr.status = \'sent\')::int AS sent, '
            'count(*) FILTER (WHERE cr.status = \'replied\')::int AS replied '
            'FROM "campaign_recipients" cr JOIN "contacts" ct ON cr.contact_id = ct.id '
            'WHERE cr.campaign_id = :id AND ct.company_id = :c'
        ),
        {"id": campaign_id, "c": tenant.company_id},
    ).first()
    if not row:
        return {"success": False, "error": "Campaign not found"}
    return {"success": True, "analytics": dict(row._mapping)}
