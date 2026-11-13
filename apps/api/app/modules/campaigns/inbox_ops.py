import json
import random
import uuid

from sqlalchemy import text
from sqlalchemy.orm import Session


def insert_message(db: Session, conversation_id: str, direction: str, body: str, run_id: str, status: str) -> None:
    db.execute(
        text(
            """
            INSERT INTO "messages" (id, conversation_id, direction, body, agent_run_id, status, sent_at)
            VALUES (:id, :conversation, :direction, :body, :run, :status, NOW())
            """
        ),
        {"id": str(uuid.uuid4()), "conversation": conversation_id, "direction": direction, "body": body, "run": run_id, "status": status},
    )
    db.commit()


def resolve_contact(db: Session, company_id: str, email: str) -> str:
    row = db.execute(
        text('SELECT id FROM "contacts" WHERE company_id = :c AND lower(email) = lower(:e) LIMIT 1'),
        {"c": company_id, "e": email},
    ).first()
    if row:
        return str(row[0])
    contact_id = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "contacts" (id, company_id, email, name, created_at) VALUES (:id, :c, :e, :n, NOW())'),
        {"id": contact_id, "c": company_id, "e": email, "n": email.split("@")[0]},
    )
    db.commit()
    return contact_id


def upsert_deal(db: Session, company_id: str, contact_id: str | None, email: str | None, stage: str) -> None:
    if not contact_id and email:
        contact_id = resolve_contact(db, company_id, email)
    if not contact_id:
        return
    db.execute(
        text('INSERT INTO "deals" (id, company_id, contact_id, stage, updated_at) VALUES (:id, :c, :contact, :stage, NOW())'),
        {"id": str(uuid.uuid4()), "c": company_id, "contact": contact_id, "stage": stage},
    )
    db.commit()


def suppress_email(db: Session, company_id: str, email: str) -> None:
    db.execute(
        text('INSERT INTO "email_suppressions" (id, company_id, email, reason, created_at) VALUES (:id, :c, :e, \'unsubscribe\', NOW())'),
        {"id": str(uuid.uuid4()), "c": company_id, "e": email},
    )
    db.execute(text('UPDATE "contacts" SET unsubscribed = true WHERE company_id = :c AND lower(email) = lower(:e)'), {"c": company_id, "e": email})
    db.commit()


def queue_reply(db: Session, conversation_id: str, account_id: str | None, thread_key: str | None, sender_email: str | None, body: str, run_id: str) -> str:
    job_id = str(uuid.uuid4())
    jitter = random.randint(45, 180)
    db.execute(
        text(
            """
            INSERT INTO "outbox_jobs"
            (id, connected_account_id, agent_run_id, thread_key, target_type, priority, reply_text, status, not_before, expires_at, idempotency_key)
            VALUES (:id, :account, :run, :thread, 'email_reply', 1, :payload, 'queued',
                    NOW() + make_interval(secs => :jitter), NOW() + INTERVAL '3 days', :key)
            """
        ),
        {
            "id": job_id, "account": account_id or "00000000-0000-0000-0000-000000000000",
            "run": run_id, "thread": thread_key or f"conv_{conversation_id}",
            "payload": json.dumps({"to": sender_email, "subject": "Re: your message", "body": body, "conversationId": conversation_id}),
            "jitter": jitter, "key": f"reply_{conversation_id}_{run_id}",
        },
    )
    db.commit()
    return job_id


def conversation_for_thread(db: Session, company_id: str, account_id: str, thread_key: str, channel: str) -> str:
    row = db.execute(
        text('SELECT id FROM "conversations" WHERE company_id = :c AND external_thread_id = :t LIMIT 1'),
        {"c": company_id, "t": thread_key},
    ).first()
    if row:
        return str(row[0])
    conversation_id = str(uuid.uuid4())
    db.execute(
        text(
            """
            INSERT INTO "conversations" (id, company_id, connected_account_id, channel, external_thread_id, intent)
            VALUES (:id, :c, :account, :channel, :thread, 'lead')
            """
        ),
        {"id": conversation_id, "c": company_id, "account": account_id, "channel": channel, "thread": thread_key},
    )
    db.commit()
    return conversation_id

