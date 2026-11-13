from sqlalchemy import text

from ..core.audit import record
from ..core.db import SessionLocal

LOW_BALANCE_THRESHOLD = 20


def check_low_credit_wallets() -> int:
    db = SessionLocal()
    alerted = 0
    try:
        low_wallets = db.execute(
            text(
                """
                SELECT cw.id, cw.company_id, cw.balance, cw.reserved, c.name
                FROM "credit_wallets" cw
                JOIN "companies" c ON cw.company_id = c.id
                WHERE cw.user_id IS NULL AND (cw.balance - cw.reserved) <= :threshold
                """
            ),
            {"threshold": LOW_BALANCE_THRESHOLD},
        ).all()

        for row in low_wallets:
            w = dict(row._mapping)
            avail = w["balance"] - w["reserved"]
            record(
                db, w["company_id"], None, "low_balance_alert", "credit_wallets", w["id"],
                {"availableCredits": avail, "threshold": LOW_BALANCE_THRESHOLD, "companyName": w.get("name")},
            )
            alerted += 1
    finally:
        db.close()
    return alerted


def cleanup_stale_jobs() -> dict:
    db = SessionLocal()
    try:
        # Reset jobs stuck in sending for more than 15 minutes
        recovered = db.execute(
            text(
                """
                UPDATE "outbox_jobs" SET status = 'queued', not_before = NOW() + INTERVAL '1 minute'
                WHERE status = 'sending' AND not_before <= NOW() - INTERVAL '15 minutes'
                """
            )
        ).rowcount

        # Mark expired queued jobs as failed
        expired = db.execute(
            text(
                """
                UPDATE "outbox_jobs" SET status = 'failed'
                WHERE status = 'queued' AND expires_at IS NOT NULL AND expires_at <= NOW()
                """
            )
        ).rowcount
        db.commit()
        return {"recovered": recovered, "expired": expired}
    finally:
        db.close()

