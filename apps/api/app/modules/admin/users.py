import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, require_roles

router = APIRouter()


class UserBody(BaseModel):
    email: str
    name: str
    role: str = "employee"


class UserPatch(BaseModel):
    name: str | None = None
    role: str | None = None
    status: str | None = None


class AgentAccessBody(BaseModel):
    agentId: int
    mode: str = "draft"


@router.get("")
def list_users(tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, company_id, email, name, role, status, created_at FROM "users" WHERE company_id = :c ORDER BY created_at'),
        {"c": tenant.company_id},
    ).all()
    return {"success": True, "users": [dict(row._mapping) for row in rows]}


@router.post("")
def create_user(body: UserBody, tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    if body.role not in ("super_admin", "company_admin", "manager", "employee"):
        return {"success": False, "error": "Invalid role"}
    user_id = str(uuid.uuid4())
    db.execute(
        text(
            'INSERT INTO "users" (id, company_id, email, name, role, status, created_at) '
            "VALUES (:id, :c, :email, :name, :role, 'active', NOW())"
        ),
        {"id": user_id, "c": tenant.company_id, "email": body.email.lower(), "name": body.name, "role": body.role},
    )
    db.commit()
    return {"success": True, "user": {"id": user_id, "companyId": tenant.company_id, **body.model_dump()}}


@router.patch("/{user_id}")
def update_user(user_id: str, body: UserPatch, tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id FROM "users" WHERE id = :id AND company_id = :c'), {"id": user_id, "c": tenant.company_id}).first()
    if not row:
        return {"success": False, "error": "User not found"}
    db.execute(
        text('UPDATE "users" SET name = COALESCE(:name, name), role = COALESCE(:role, role), status = COALESCE(:status, status) WHERE id = :id'),
        {"id": user_id, "name": body.name, "role": body.role, "status": body.status},
    )
    db.commit()
    return {"success": True, "userId": user_id}


@router.delete("/{user_id}")
def deactivate_user(user_id: str, tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id FROM "users" WHERE id = :id AND company_id = :c'), {"id": user_id, "c": tenant.company_id}).first()
    if not row:
        return {"success": False, "error": "User not found"}
    db.execute(text('UPDATE "users" SET status = \'inactive\' WHERE id = :id'), {"id": user_id})
    db.execute(text('DELETE FROM "user_agent_access" WHERE user_id = :id'), {"id": user_id})
    db.commit()
    return {"success": True, "userId": user_id, "status": "inactive"}


@router.post("/{user_id}/agent-access")
def grant_access(user_id: str, body: AgentAccessBody, tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    db.execute(
        text(
            """
            INSERT INTO "user_agent_access" (user_id, agent_id, mode, granted_by, granted_at)
            VALUES (:user, :agent, :mode, :by, NOW())
            ON CONFLICT (user_id, agent_id) DO UPDATE SET mode = EXCLUDED.mode
            """
        ),
        {"user": user_id, "agent": body.agentId, "mode": body.mode if body.mode in ("draft", "auto") else "draft", "by": tenant.user_id},
    )
    db.commit()
    return {"success": True, "userId": user_id, "agentId": body.agentId, "mode": body.mode}


@router.delete("/{user_id}/agent-access/{agent_id}")
def revoke_access(user_id: str, agent_id: int, tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    db.execute(text('DELETE FROM "user_agent_access" WHERE user_id = :user AND agent_id = :agent'), {"user": user_id, "agent": agent_id})
    db.commit()
    return {"success": True, "userId": user_id, "agentId": agent_id}