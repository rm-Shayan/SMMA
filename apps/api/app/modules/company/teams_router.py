import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, require_roles

router = APIRouter(prefix="/teams", tags=["company-teams"])

class CreateTeam(BaseModel):
    name: str = Field(min_length=2)
    department: str = "marketing"

class AssignMember(BaseModel):
    userId: str
    teamId: str

@router.get("")
def list_teams(tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT * FROM "teams" WHERE company_id = :c ORDER BY created_at DESC'), {"c": tenant.company_id}).all()
    return {"success": True, "teams": [dict(r._mapping) for r in rows]}

@router.post("")
def create_team(body: CreateTeam, tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    tid = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "teams" (id, company_id, name, created_at) VALUES (:id, :c, :n, NOW())'),
        {"id": tid, "c": tenant.company_id, "n": body.name},
    )
    db.commit()
    return {"success": True, "team": {"id": tid, "name": body.name, "companyId": tenant.company_id}}

@router.post("/assign")
def assign_member(body: AssignMember, tenant: Tenant = Depends(require_roles("super_admin", "company_admin")), db: Session = Depends(get_db)):
    mid = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "team_members" (id, team_id, user_id, role, created_at) VALUES (:id, :t, :u, \'member\', NOW()) ON CONFLICT DO NOTHING'),
        {"id": mid, "t": body.teamId, "u": body.userId},
    )
    db.commit()
    return {"success": True, "assigned": True, "userId": body.userId, "teamId": body.teamId}

