import json
from datetime import datetime, timedelta
from sqlalchemy import text

from ..core.audit import record
from ..core.db import SessionLocal
from ..core.registry import get as get_agent
from ..core.types import AgentContext
from ..modules.credits import ledger

AGENT_CODE_MAP = {
    1: "own-post-engager", 2: "competitor-researcher", 3: "comment-responder",
    4: "analytics", 5: "daily-brief", 6: "outreach", 7: "competitor-engager",
    8: "publisher", 9: "inbox_responder", 10: "trainee-sop", 11: "company-ops",
    12: "supervisor",
}


def compute_next_run(cron_expr: str | None) -> datetime:
    # Default interval: 24 hours if not specified
    if not cron_expr or cron_expr == "daily":
        return datetime.now() + timedelta(days=1)
    if cron_expr == "hourly":
        return datetime.now() + timedelta(hours=1)
    if cron_expr == "weekly":
        return datetime.now() + timedelta(weeks=1)
    return datetime.now() + timedelta(days=1)


def dispatch_db_schedules(limit: int = 5) -> int:
    db = SessionLocal()
    executed = 0
    try:
        due = db.execute(
            text(
                """
                SELECT id, company_id, agent_id, user_id, cron, payload, next_run_at
                FROM "schedules"
                WHERE enabled = true AND (next_run_at IS NULL OR next_run_at <= NOW())
                ORDER BY next_run_at ASC NULLS FIRST LIMIT :limit
                FOR UPDATE SKIP LOCKED
                """
            ),
            {"limit": limit},
        ).all()

        for row in due:
            item = dict(row._mapping)
            code = AGENT_CODE_MAP.get(item["agent_id"])
            if not code:
                continue

            agent = get_agent(code)
            if not agent:
                continue

            wallet = ledger.get_company_wallet(db, item["company_id"])
            if not wallet or wallet["available"] < 1:
                continue

            payload = json.loads(item["payload"]) if isinstance(item["payload"], str) else (item["payload"] or {})
            context = AgentContext(
                company_id=item["company_id"], user_id=item.get("user_id"),
                wallet_id=wallet["id"], agent_id=item["agent_id"],
                agent_action_id=f"a0000000-0000-0000-0000-{item['agent_id']:012d}",
                mode="auto",
            )
            result = agent.execute(context, payload)

            next_run = compute_next_run(item.get("cron"))
            db.execute(text('UPDATE "schedules" SET next_run_at = :next_run WHERE id = :id'), {"next_run": next_run, "id": item["id"]})
            db.commit()

            record(db, item["company_id"], item.get("user_id"), "schedule_dispatched", "schedules", item["id"], {"agentId": item["agent_id"], "success": result.success})
            executed += 1
    finally:
        db.close()
    return executed

