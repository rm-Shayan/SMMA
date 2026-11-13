import json
import random
import uuid

from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.base_agent import BaseAgent
from ...core.db import SessionLocal
from ...core.types import AgentContext, RunResult
from .outreach_sequence import build_sequence


def is_suppressed(db: Session, company_id: str, email: str) -> tuple[bool, str | None]:
    row = db.execute(
        text('SELECT reason FROM "email_suppressions" WHERE company_id = :c AND lower(email) = lower(:e) LIMIT 1'),
        {"c": company_id, "e": email},
    ).first()
    if row:
        return True, row[0] or "suppressed"

    contact = db.execute(
        text('SELECT unsubscribed FROM "contacts" WHERE company_id = :c AND lower(email) = lower(:e) LIMIT 1'),
        {"c": company_id, "e": email},
    ).first()
    if contact and contact[0]:
        return True, "contact_opt_out"
    return False, None


def upsert_contact(db: Session, company_id: str, prospect: dict) -> str:
    row = db.execute(
        text(
            """
            INSERT INTO "contacts" (id, company_id, name, email, company_name, topic, created_at)
            VALUES (:id, :company_id, :name, :email, :company_name, :topic, NOW())
            ON CONFLICT (company_id, email) DO UPDATE SET name = EXCLUDED.name, topic = EXCLUDED.topic
            RETURNING id
            """
        ),
        {
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "name": prospect["name"],
            "email": prospect["email"],
            "company_name": prospect.get("companyName"),
            "topic": prospect.get("topic"),
        },
    )
    db.commit()
    return str(row.first()[0])


def track_recipient(db: Session, campaign_id: str, contact_id: str, topic: str | None) -> None:
    db.execute(text('DELETE FROM "campaign_recipients" WHERE campaign_id = :c AND contact_id = :id'), {"c": campaign_id, "id": contact_id})
    db.execute(
        text(
            'INSERT INTO "campaign_recipients" (id, campaign_id, contact_id, topic, status, followups_sent) '
            "VALUES (:id, :c, :contact, :topic, 'queued', 0)"
        ),
        {"id": str(uuid.uuid4()), "c": campaign_id, "contact": contact_id, "topic": topic},
    )
    db.commit()


def queue_stage(db: Session, account_id: str, run_id: str, campaign_id: str, contact_id: str, email: str, stage_email: dict, stage: int) -> str:
    job_id = str(uuid.uuid4())
    jitter = random.randint(45, 180)
    payload = {
        "to": email,
        "subject": stage_email["subject"],
        "body": stage_email["body"],
        "stage": stage,
        "waitDays": stage_email["waitDays"],
        "campaignId": campaign_id,
        "contactId": contact_id,
        "sequenceLength": 3,
    }
    db.execute(
        text(
            """
            INSERT INTO "outbox_jobs"
            (id, connected_account_id, agent_run_id, target_type, target_post_id, priority, reply_text, status, not_before, expires_at, idempotency_key)
            VALUES (:id, :account, :run, 'cold_email', :contact, 2, :payload, 'queued',
                    NOW() + make_interval(secs => :jitter), NOW() + INTERVAL '7 days', :key)
            """
        ),
        {
            "id": job_id, "account": account_id, "run": run_id, "contact": contact_id,
            "payload": json.dumps(payload), "jitter": jitter, "key": f"email_{campaign_id}_{contact_id}_s{stage}",
        },
    )
    db.commit()
    return job_id


class OutreachAgent(BaseAgent):
    id = 6
    code = "outreach"
    name = "Outreach (DM / Email)"
    default_mode = "draft"

    def estimate_credits(self, input_data: dict) -> int:
        return max(1, len(input_data.get("prospects", [])))

    def plan(self, context: AgentContext, input_data: dict) -> list[str]:
        return [
            f"Validate suppression lists for {len(input_data.get('prospects', []))} prospects",
            "Build 3-email sequence with CAN-SPAM footer",
            "Queue stage-1 delivery into outbox_jobs",
        ]

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        db = SessionLocal()
        drafts, suppressed = [], 0
        try:
            for prospect in input_data["prospects"]:
                blocked, reason = is_suppressed(db, context.company_id, prospect["email"])
                if blocked:
                    suppressed += 1
                    drafts.append({"email": prospect["email"], "status": "suppressed", "suppressionReason": reason})
                    continue

                contact_id = upsert_contact(db, context.company_id, prospect)
                track_recipient(db, input_data["campaignId"], contact_id, prospect.get("topic"))
                sequence = build_sequence(prospect, input_data.get("goal", ""), input_data.get("tone", "professional"), context.company_id)

                job_id = None
                if context.mode == "auto":
                    job_id = queue_stage(
                        db, input_data["connectedAccountId"], run_id, input_data["campaignId"],
                        contact_id, prospect["email"], sequence[0], 1,
                    )
                drafts.append({"contactId": contact_id, "email": prospect["email"], "sequence": sequence, "outboxJobId": job_id, "status": "queued" if context.mode == "auto" else "drafted"})

            return RunResult({"campaignId": input_data["campaignId"], "totalProcessed": len(drafts), "suppressed": suppressed, "drafts": drafts}, len(drafts) - suppressed, 0.0008 * max(1, len(drafts) - suppressed))
        finally:
            db.close()

