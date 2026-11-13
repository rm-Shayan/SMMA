import base64
import csv as csv_parser
import io
import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import SessionLocal, get_db
from ...core.deps import Tenant, get_tenant
from ...core.runner import run_agent
from .inbox_ops import conversation_for_thread

contacts_router = APIRouter()

class ImportBody(BaseModel):
    csv: str = Field(min_length=10)

class InboundBody(BaseModel):
    connectedAccountId: str
    contactId: str | None = None
    channel: str
    threadKey: str
    senderEmail: str | None = None
    messageText: str

@contacts_router.post("/import")
def import_contacts(body: ImportBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    lines = [line for line in body.csv.splitlines() if line.strip()]
    if len(lines) < 2:
        return {"success": False, "error": "CSV must contain a header and at least one contact"}
    reader = csv_parser.DictReader(io.StringIO(body.csv))
    imported, invalid = 0, 0
    for row in reader:
        email = (row.get("email") or "").strip().lower()
        if not email or "@" not in email:
            invalid += 1
            continue
        if db.execute(text('SELECT id FROM "contacts" WHERE company_id = :c AND email = :e'), {"c": tenant.company_id, "e": email}).first():
            continue
        db.execute(text('INSERT INTO "contacts" (id, company_id, name, email, company_name, topic, created_at) VALUES (:id, :c, :n, :e, :company, :topic, NOW())'), {"id": str(uuid.uuid4()), "c": tenant.company_id, "n": row.get("name") or email.split("@")[0], "e": email, "company": row.get("company") or row.get("company_name"), "topic": row.get("topic")})
        imported += 1
    db.commit()
    return {"success": True, "imported": imported, "invalid": invalid}

@contacts_router.post("/inbound-webhook")
def inbound(body: InboundBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    conv_id = conversation_for_thread(db, tenant.company_id, body.connectedAccountId, body.threadKey, body.channel)
    result = run_agent(tenant, "inbox_responder", 9, "a0000000-0000-0000-0000-000000000009", "auto", {**body.model_dump(), "conversationId": conv_id})
    return {"success": True, "classification": result.data}

@contacts_router.get("/unsubscribe")
def unsubscribe(token: str):
    decoded = base64.urlsafe_b64decode(token + "=" * (-len(token) % 4)).decode()
    company_id, email = decoded.split(":", 1)
    db = SessionLocal()
    try:
        db.execute(text('INSERT INTO "email_suppressions" (id, company_id, email, reason, created_at) VALUES (:id, :c, :e, \'unsubscribe\', NOW())'), {"id": str(uuid.uuid4()), "c": company_id, "e": email})
        db.execute(text('UPDATE "contacts" SET unsubscribed = true WHERE company_id = :c AND lower(email) = lower(:e)'), {"c": company_id, "e": email})
        db.commit()
        return {"success": True, "unsubscribed": email}
    finally:
        db.close()

