import json
import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ...core.runner import run_agent

competitors_router = APIRouter()

class EngageBody(BaseModel):
    connectedAccountId: str
    competitorPostRef: str
    competitorName: str
    postContent: str
    platform: str = "linkedin"

class CompetitorBody(BaseModel):
    name: str
    website: str | None = None
    keywords: str = "general"

@competitors_router.post("/engage-competitor")
def engage(body: EngageBody, tenant: Tenant = Depends(get_tenant)):
    result = run_agent(tenant, "competitor-engager", 7, "a0000000-0000-0000-0000-000000000007", "draft", body.model_dump())
    return {"success": result.success, "data": result.data, "runId": result.run_id}

@competitors_router.get("/competitors")
def list_competitors(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT * FROM "competitors" WHERE company_id = :c ORDER BY name'), {"c": tenant.company_id}).all()
    return {"success": True, "competitors": [dict(row._mapping) for row in rows]}

@competitors_router.post("/competitors")
def create_competitor(body: CompetitorBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    competitor_id = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "competitors" (id, company_id, name, website, social_handles, keywords) VALUES (:id, :c, :name, :website, \'[]\', :keywords)'),
        {"id": competitor_id, "c": tenant.company_id, "name": body.name, "website": body.website, "keywords": json.dumps(body.keywords)},
    )
    db.commit()
    return {"success": True, "competitor": {"id": competitor_id, **body.model_dump()}}

@competitors_router.get("/competitor-insights")
def competitor_insights(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(
        text(
            'SELECT ci.id, ci.type, ci.data, ci.captured_at, c.name AS competitor '
            'FROM "competitor_insights" ci JOIN "competitors" c ON ci.competitor_id = c.id '
            'WHERE c.company_id = :c ORDER BY ci.captured_at DESC LIMIT :limit'
        ),
        {"c": tenant.company_id, "limit": limit},
    ).all()
    return {"success": True, "insights": [dict(row._mapping) for row in rows]}

