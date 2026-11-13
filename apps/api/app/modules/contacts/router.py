import csv
import io
import uuid
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, get_tenant

router = APIRouter(prefix="/contacts", tags=["contacts"])

class ContactUpdate(BaseModel):
    name: str | None = None
    company_name: str | None = None
    topic: str | None = None
    status: str | None = None

@router.get("")
def list_contacts(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50, offset: int = 0):
    rows = db.execute(
        text('SELECT * FROM "contacts" WHERE company_id = :c ORDER BY created_at DESC LIMIT :limit OFFSET :offset'),
        {"c": tenant.company_id, "limit": limit, "offset": offset},
    ).all()
    total = db.execute(text('SELECT count(*)::int FROM "contacts" WHERE company_id = :c'), {"c": tenant.company_id}).scalar()
    return {"success": True, "total": total, "contacts": [dict(r._mapping) for r in rows]}

@router.get("/export")
def export_contacts(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT name, email, company_name, topic, unsubscribed, created_at FROM "contacts" WHERE company_id = :c'), {"c": tenant.company_id}).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Name", "Email", "Company", "Topic", "Unsubscribed", "Created At"])
    for r in rows:
        writer.writerow(list(r))
    return Response(content=buf.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=contacts.csv"})

@router.get("/{contact_id}")
def get_contact(contact_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT * FROM "contacts" WHERE id = :id AND company_id = :c'), {"id": contact_id, "c": tenant.company_id}).first()
    if not row:
        return {"success": False, "error": "Contact not found"}
    return {"success": True, "contact": dict(row._mapping)}

@router.patch("/{contact_id}")
def update_contact(contact_id: str, body: ContactUpdate, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    db.execute(
        text('UPDATE "contacts" SET name = COALESCE(:name, name), company_name = COALESCE(:comp, company_name), topic = COALESCE(:topic, topic) WHERE id = :id AND company_id = :c'),
        {"id": contact_id, "c": tenant.company_id, "name": body.name, "comp": body.company_name, "topic": body.topic},
    )
    db.commit()
    return {"success": True, "contactId": contact_id}

@router.delete("/{contact_id}")
def delete_contact(contact_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    db.execute(text('DELETE FROM "contacts" WHERE id = :id AND company_id = :c'), {"id": contact_id, "c": tenant.company_id})
    db.commit()
    return {"success": True, "contactId": contact_id}

