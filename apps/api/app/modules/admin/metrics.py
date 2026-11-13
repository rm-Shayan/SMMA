import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, require_roles
from ..auth.service import create_token
from .super_ops import router as super_ops_router
from .super_ops2 import router as super_ops2_router
from .super_ops3 import router as super_ops3_router

router = APIRouter()
router.include_router(super_ops_router)
router.include_router(super_ops2_router)
router.include_router(super_ops3_router)


class ImpersonateBody(BaseModel):
    userId: str
    reason: str = "support"


@router.get("/metrics")
def metrics(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    companies = db.execute(text('SELECT count(*)::int FROM "companies"')).scalar()
    users = db.execute(text('SELECT count(*)::int FROM "users"')).scalar()
    runs = db.execute(text('SELECT count(*)::int FROM "agent_runs"')).scalar()
    credits = db.execute(text('SELECT COALESCE(sum(credits_used), 0)::int FROM "agent_runs"')).scalar()
    cost = db.execute(text('SELECT COALESCE(sum(cost_usd), 0) FROM "agent_runs"')).scalar()
    return {"success": True, "metrics": {"companies": companies, "users": users, "runs": runs, "creditsBurned": credits, "costUsd": float(cost)}}


@router.post("/impersonate")
def impersonate(body: ImpersonateBody, tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    import json

    row = db.execute(text('SELECT id, company_id, email, name, role FROM "users" WHERE id = :id'), {"id": body.userId}).first()
    if not row:
        return {"success": False, "error": "User not found"}
    user = dict(row._mapping)
    token = create_token(user)
    db.execute(
        text(
            'INSERT INTO "audit_logs" (id, company_id, user_id, action, entity, entity_id, meta, created_at) '
            "VALUES (:id, :c, :u, 'impersonate', 'users', :target, :meta, NOW())"
        ),
        {"id": str(uuid.uuid4()), "c": user["company_id"], "u": tenant.user_id, "target": body.userId, "meta": json.dumps({"reason": body.reason})},
    )
    db.commit()
    return {"success": True, "token": token, "user": user}


@router.get("/token-usage")
def token_usage(tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(
        text(
            """
            SELECT ag.name AS agent, count(*)::int AS runs,
                   COALESCE(sum(ar.credits_used), 0)::int AS credits,
                   COALESCE(sum(ar.cost_usd), 0) AS cost
            FROM "agent_runs" ar
            JOIN "agent_actions" aa ON ar.agent_action_id = aa.id
            JOIN "agents" ag ON aa.agent_id = ag.id
            WHERE ar.company_id = :c
            GROUP BY ag.name ORDER BY cost DESC LIMIT :limit
            """
        ),
        {"c": tenant.company_id, "limit": limit},
    ).all()
    return {"success": True, "usage": [dict(row._mapping) for row in rows]}


@router.get("/tenants")
def list_tenants(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT id, name, timezone, status, created_at FROM "companies" ORDER BY created_at DESC')).all()
    return {"success": True, "tenants": [dict(row._mapping) for row in rows]}


@router.post("/tenants")
def create_tenant(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    from .company import CompanyBody, create_company

    return create_company(CompanyBody(name="New Company"), tenant, db)