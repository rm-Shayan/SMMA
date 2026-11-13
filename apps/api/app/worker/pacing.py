from datetime import datetime
from sqlalchemy import text

from ..core.audit import record
from ..core.db import SessionLocal
from .dispatcher import backoff_delay, dispatch, mark_rate_limited as _mark_rl, schedule_follow_up

WARMUP_DAYS = 14
WARMUP_CAP = 50


def load_limits(db, account_id: str):
    row = db.execute(text('SELECT * FROM "account_limits" WHERE connected_account_id = :id'), {"id": account_id}).first()
    return dict(row._mapping) if row else None


def mark_rate_limited(db, account_id: str, job_id: str) -> None:
    _mark_rl(db, account_id, job_id, load_limits)


def account_age_days(db, account_id: str) -> float:
    row = db.execute(
        text('SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400 AS age FROM "connected_accounts" WHERE id = :id'),
        {"id": account_id},
    ).first()
    return float(row[0] or 999)


def within_work_hours(work_hours: str | None) -> bool:
    if not work_hours:
        return True
    start_raw, end_raw = work_hours.split("-")
    return int(start_raw.split(":")[0]) <= datetime.now().hour < int(end_raw.split(":")[0])


def daily_cap(db, limits, account_id: str) -> int:
    age = account_age_days(db, account_id)
    if age <= WARMUP_DAYS:
        return min((limits or {}).get("per_day") or WARMUP_CAP, WARMUP_CAP)
    return (limits or {}).get("per_day") or WARMUP_CAP


def process_outbox(limit: int = 10, account_id: str | None = None) -> int:
    db = SessionLocal()
    dispatched = 0
    try:
        due = db.execute(
            text(
                """
                SELECT * FROM "outbox_jobs"
                WHERE status = 'queued' AND (not_before IS NULL OR not_before <= NOW()) AND (expires_at IS NULL OR expires_at > NOW())
                  AND (CAST(:account AS uuid) IS NULL OR connected_account_id = CAST(:account AS uuid))
                ORDER BY priority ASC, not_before ASC LIMIT :limit FOR UPDATE SKIP LOCKED
                """
            ),
            {"limit": limit, "account": account_id},
        ).all()
        seen = set()
        for row in due:
            job = dict(row._mapping)
            account_id = job["connected_account_id"]
            if account_id in seen:
                continue
            seen.add(account_id)

            limits = load_limits(db, account_id)
            if limits and limits.get("paused_until") and limits["paused_until"] > datetime.now():
                db.execute(text('UPDATE "outbox_jobs" SET not_before = :until WHERE id = :id'), {"until": limits["paused_until"], "id": job["id"]})
                db.commit()
                continue
            if not within_work_hours((limits or {}).get("work_hours")):
                db.execute(text('UPDATE "outbox_jobs" SET not_before = NOW() + INTERVAL \'1 hour\' WHERE id = :id'), {"id": job["id"]})
                db.commit()
                continue

            sent_today = db.execute(
                text('SELECT count(*)::int FROM "outbox_jobs" WHERE connected_account_id = :id AND status = \'sent\' AND not_before >= CURRENT_DATE'),
                {"id": account_id},
            ).scalar()
            if sent_today >= daily_cap(db, limits, account_id):
                db.execute(text('UPDATE "outbox_jobs" SET not_before = CURRENT_DATE + INTERVAL \'1 day\' WHERE id = :id'), {"id": job["id"]})
                db.commit()
                continue

            account_row = db.execute(text('SELECT id, provider, token_enc, company_id FROM "connected_accounts" WHERE id = :id'), {"id": account_id}).first()
            if not account_row:
                db.execute(text('UPDATE "outbox_jobs" SET status = \'failed\' WHERE id = :id'), {"id": job["id"]})
                db.commit()
                continue
            account = dict(account_row._mapping)

            db.execute(text('UPDATE "outbox_jobs" SET status = \'sending\' WHERE id = :id'), {"id": job["id"]})
            db.commit()

            result = dispatch(job, account)
            if result["ok"]:
                db.execute(text('UPDATE "outbox_jobs" SET status = \'sent\' WHERE id = :id'), {"id": job["id"]})
                db.commit()
                if job["target_type"] == "cold_email":
                    schedule_follow_up(db, job)
                record(db, account["company_id"], None, "connector", "outbox_jobs", job["id"], {"targetType": job["target_type"], "externalId": result.get("externalId")})
                dispatched += 1
            elif result.get("rateLimited"):
                mark_rate_limited(db, account_id, job["id"])
            else:
                db.execute(text('UPDATE "outbox_jobs" SET status = \'queued\', not_before = NOW() + INTERVAL \'5 minutes\' WHERE id = :id'), {"id": job["id"]})
                db.commit()
    finally:
        db.close()
    return dispatched
