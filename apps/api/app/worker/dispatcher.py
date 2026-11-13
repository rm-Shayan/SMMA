import json
import os
import smtplib
import uuid
from datetime import datetime, timedelta
from email.message import EmailMessage

from sqlalchemy import text
from ..core.audit import record


def backoff_delay(level: int | None) -> timedelta:
    return timedelta(minutes=min(120, 30 * (2 ** (level or 0))))


def _send_email(job: dict, account: dict) -> dict:
    payload = json.loads(job["reply_text"] or "{}")
    to = payload.get("to")
    if not to:
        return {"ok": False, "error": "Missing recipient email"}
    host = os.getenv("SMTP_HOST")
    user = os.getenv("SMTP_MAIL")
    if not host or not user:
        return {"ok": False, "error": "SMTP not configured"}

    msg = EmailMessage()
    msg["To"], msg["From"], msg["Subject"] = to, os.getenv("SMTP_FROM") or user, payload.get("subject") or "Message"
    if payload.get("unsubscribeUrl"):
        msg["List-Unsubscribe"] = f"<{payload['unsubscribeUrl']}>"
    msg.set_content(payload.get("body") or "")

    try:
        with smtplib.SMTP(host, int(os.getenv("SMTP_PORT", "587")), timeout=15) as s:
            s.starttls()
            pwd = os.getenv("SMTP_PASS")
            if pwd:
                s.login(user, pwd)
            s.send_message(msg)
        return {"ok": True, "externalId": f"smtp_{uuid.uuid4().hex[:10]}"}
    except Exception as exc:
        return {"ok": False, "error": str(exc), "rateLimited": "429" in str(exc) or "rate limit" in str(exc).lower()}


def _send_social(job: dict, account: dict) -> dict:
    return {"ok": True, "externalId": f"sim_{uuid.uuid4().hex[:10]}"}


def dispatch(job: dict, account: dict) -> dict:
    if job["target_type"] in ("cold_email", "email_reply"):
        return _send_email(job, account)
    if job["target_type"] in ("social_comment", "comment_reply"):
        return _send_social(job, account)
    return {"ok": False, "error": f"Unsupported target type: {job['target_type']}"}


def schedule_follow_up(db, job: dict) -> None:
    payload = json.loads(job["reply_text"] or "{}")
    next_stage = int(payload.get("stage", 1)) + 1
    if next_stage > int(payload.get("sequenceLength", 1)):
        return
    wait_days = [3, 4][next_stage - 2] if next_stage - 2 < 2 else 3
    db.execute(
        text(
            """
            INSERT INTO "outbox_jobs"
            (id, connected_account_id, agent_run_id, thread_key, target_type, target_post_id, priority, reply_text, status, not_before, expires_at, idempotency_key)
            VALUES (:id, :account, :run, :thread, 'cold_email', :contact, 2, :payload, 'queued',
                    NOW() + make_interval(days => :days), NOW() + INTERVAL '14 days', :key)
            """
        ),
        {
            "id": str(uuid.uuid4()), "account": job["connected_account_id"], "run": job["agent_run_id"],
            "thread": job["thread_key"], "contact": job["target_post_id"],
            "payload": json.dumps({**payload, "stage": next_stage, "waitDays": wait_days}),
            "days": wait_days, "key": f"{job['idempotency_key']}_s{next_stage}",
        },
    )
    db.execute(text('UPDATE "campaign_recipients" SET followups_sent = followups_sent + 1 WHERE contact_id = :id'), {"id": payload.get("contactId")})
    db.commit()


def mark_rate_limited(db, account_id: str, job_id: str, load_limits_fn) -> None:
    limits = load_limits_fn(db, account_id)
    level = ((limits or {}).get("backoff_level") or 0) + 1
    until = datetime.now() + backoff_delay(level)
    db.execute(
        text(
            """
            INSERT INTO "account_limits" (connected_account_id, paused_until, backoff_level, min_gap_sec, max_gap_sec, per_day, work_hours)
            VALUES (:id, :until, :level, 45, 180, 50, '09:00-22:00')
            ON CONFLICT (connected_account_id) DO UPDATE SET paused_until = :until, backoff_level = :level
            """
        ),
        {"id": account_id, "until": until, "level": level},
    )
    db.execute(text('UPDATE "outbox_jobs" SET not_before = :until WHERE id = :id'), {"until": until, "id": job_id})
    db.commit()
    record(db, None, None, "connector", "account_limits", account_id, {"event": "rate_limited", "backoffLevel": level})
