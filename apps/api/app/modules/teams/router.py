import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant, require_roles

router = APIRouter()


class TeamBody(BaseModel):
    name: str
    managerId: str | None = None


class TeamPatch(BaseModel):
    name: str | None = None
    managerId: str | None = None


@router.get("")
def list_teams(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, company_id, manager_id, name FROM "teams" WHERE company_id = :c ORDER BY name'),
        {"c": tenant.company_id},
    ).all()
    return {"success": True, "teams": [dict(row._mapping) for row in rows]}


@router.post("")
def create_team(body: TeamBody, tenant: Tenant = Depends(require_roles("company_admin")), db: Session = Depends(get_db)):
    team_id = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "teams" (id, company_id, manager_id, name) VALUES (:id, :c, :m, :name)'),
        {"id": team_id, "c": tenant.company_id, "m": body.managerId, "name": body.name},
    )
    db.commit()
    return {"success": True, "team": {"id": team_id, **body.model_dump()}}


@router.patch("/{team_id}")
def update_team(team_id: str, body: TeamPatch, tenant: Tenant = Depends(require_roles("company_admin")), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id FROM "teams" WHERE id = :id AND company_id = :c'), {"id": team_id, "c": tenant.company_id}).first()
    if not row:
        return {"success": False, "error": "Team not found"}
    db.execute(
        text('UPDATE "teams" SET name = COALESCE(:name, name), manager_id = COALESCE(:manager, manager_id) WHERE id = :id'),
        {"id": team_id, "name": body.name, "manager": body.managerId},
    )
    db.commit()
    return {"success": True, "teamId": team_id}


@router.delete("/{team_id}")
def delete_team(team_id: str, tenant: Tenant = Depends(require_roles("company_admin")), db: Session = Depends(get_db)):
    db.execute(text('DELETE FROM "teams" WHERE id = :id AND company_id = :c'), {"id": team_id, "c": tenant.company_id})
    db.commit()
    return {"success": True, "teamId": team_id}