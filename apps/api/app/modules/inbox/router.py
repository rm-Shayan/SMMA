import json
import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ...core.pubsub import publish_event_sync
from ...core.runner import run_agent

router = APIRouter(prefix="/inbox", tags=["inbox"])

class SendReplyBody(BaseModel):
    message: str = Field(min_length=1)
    autoApprove: bool = True

class AIReplyRequest(BaseModel):
    tone: str = "professional"
    language: str = "roman_urdu"

@router.get("/threads")
def list_threads(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(
        text(
            'SELECT c.id, c.channel, c.thread_key, c.external_sender_id, c.status, c.last_message_at, '
            'ct.name AS contact_name, ct.email AS contact_email '
            'FROM "conversations" c '
            'LEFT JOIN "contacts" ct ON c.contact_id = ct.id '
            'WHERE c.company_id = :comp ORDER BY c.last_message_at DESC NULLS LAST LIMIT :limit'
        ),
        {"comp": tenant.company_id, "limit": limit},
    ).all()
    return {"success": True, "threads": [dict(r._mapping) for r in rows]}

@router.get("/threads/{thread_id}/messages")
def get_thread_messages(thread_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT * FROM "conversation_messages" WHERE conversation_id = :id ORDER BY created_at ASC'),
        {"id": thread_id},
    ).all()
    return {"success": True, "threadId": thread_id, "messages": [dict(r._mapping) for r in rows]}

@router.post("/threads/{thread_id}/ai-reply")
def generate_ai_reply(thread_id: str, body: AIReplyRequest, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    conv = db.execute(text('SELECT * FROM "conversations" WHERE id = :id AND company_id = :comp'), {"id": thread_id, "comp": tenant.company_id}).first()
    if not conv:
        return {"success": False, "error": "Conversation not found"}
    result = run_agent(tenant, "inbox_responder", 9, "a0000000-0000-0000-0000-000000000009", "draft", {"conversationId": thread_id, "tone": body.tone, "lang": body.language})
    publish_event_sync(tenant.company_id, "ai_reply_generated", {"threadId": thread_id, "data": result.data}, "copilot")
    return {"success": True, "suggestion": result.data}

@router.post("/threads/{thread_id}/reply")
def send_reply(thread_id: str, body: SendReplyBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    conv = db.execute(text('SELECT * FROM "conversations" WHERE id = :id AND company_id = :comp'), {"id": thread_id, "comp": tenant.company_id}).first()
    if not conv:
        return {"success": False, "error": "Conversation not found"}
    c = dict(conv._mapping)
    mid = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "conversation_messages" (id, conversation_id, direction, sender, body, created_at) VALUES (:id, :cid, \'outbound\', :sender, :body, NOW())'),
        {"id": mid, "cid": thread_id, "sender": tenant.user_id, "body": body.message},
    )
    job_id = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "outbox_jobs" (id, connected_account_id, thread_key, target_type, priority, reply_text, status, not_before, idempotency_key) VALUES (:id, :account, :thread, :target, 1, :body, \'queued\', NOW(), :key)'),
        {"id": job_id, "account": c.get("connected_account_id"), "thread": c["thread_key"], "target": f"{c['channel']}_reply", "body": body.message, "key": f"reply_{mid}"},
    )
    db.commit()
    publish_event_sync(tenant.company_id, "message_sent", {"threadId": thread_id, "messageId": mid}, "notifications")
    return {"success": True, "messageId": mid, "outboxJobId": job_id}

