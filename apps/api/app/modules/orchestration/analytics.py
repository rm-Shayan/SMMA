import json
import uuid
from sqlalchemy import text

from ...core.base_agent import BaseAgent
from ...core.db import SessionLocal
from ...core.types import AgentContext, RunResult


def collect_metrics(db, company_id: str) -> dict:
    runs = db.execute(
        text(
            """
            SELECT count(*)::int AS total_runs,
                   count(*) FILTER (WHERE status = 'completed')::int AS completed_runs,
                   count(*) FILTER (WHERE status = 'failed')::int AS failed_runs,
                   COALESCE(sum(credits_used), 0)::int AS credits_burned,
                   COALESCE(sum(cost_usd), 0) AS cost_usd
            FROM "agent_runs" WHERE company_id = :c
            """
        ),
        {"c": company_id},
    ).first()
    posts = db.execute(text('SELECT count(*) FILTER (WHERE status = \'published\')::int AS published FROM "social_posts" WHERE company_id = :c'), {"c": company_id}).first()
    comments = db.execute(text('SELECT count(*)::int AS total FROM "social_comments" WHERE company_id = :c'), {"c": company_id}).first()
    outbox = db.execute(
        text(
            """
            SELECT count(*) FILTER (WHERE oj.status = 'sent')::int AS sent,
                   count(*) FILTER (WHERE oj.status = 'queued')::int AS queued
            FROM "outbox_jobs" oj JOIN "connected_accounts" ca ON oj.connected_account_id = ca.id
            WHERE ca.company_id = :c
            """
        ),
        {"c": company_id},
    ).first()
    approvals = db.execute(
        text(
            """
            SELECT count(*)::int AS pending FROM "approvals" a
            JOIN "agent_runs" ar ON a.agent_run_id = ar.id
            WHERE ar.company_id = :c AND a.status = 'pending'
            """
        ),
        {"c": company_id},
    ).first()

    return {
        "totalRuns": int(runs[0]),
        "completedRuns": int(runs[1]),
        "failedRuns": int(runs[2]),
        "totalCreditsBurned": int(runs[3]),
        "outreachSent": int(outbox[0]),
        "queuedOutbox": int(outbox[1]),
        "socialPostsPublished": int(posts[0]),
        "inboundCommentsTriaged": int(comments[0]),
        "pendingApprovals": int(approvals[0]),
        "estimatedCostUsd": float(runs[4]),
    }


class AnalyticsAgent(BaseAgent):
    id = 4
    code = "analytics"
    name = "Analytics Agent"
    default_mode = "auto"

    def estimate_credits(self, input_data: dict) -> int:
        return 2

    def plan(self, context: AgentContext, input_data: dict) -> list[str]:
        return ["Aggregate runs, credits and outbox", "Compute cost per completed run", "Persist analytics snapshot"]

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        db = SessionLocal()
        try:
            metrics = collect_metrics(db, context.company_id)
            avg = metrics["estimatedCostUsd"] / metrics["completedRuns"] if metrics["completedRuns"] else 0
            summary = (
                f"{metrics['totalRuns']} runs ({metrics['completedRuns']} completed, {metrics['failedRuns']} failed). "
                f"{metrics['totalCreditsBurned']} credits at ${metrics['estimatedCostUsd']:.4f} (${avg:.5f}/completed run). "
                f"{metrics['outreachSent']} dispatched, {metrics['queuedOutbox']} queued, {metrics['pendingApprovals']} approvals pending."
            )
            snapshot_id = str(uuid.uuid4())
            db.execute(
                text(
                    """
                    INSERT INTO "analytics_snapshots" (id, company_id, user_id, scope, period, metrics, ai_summary, created_at)
                    VALUES (:id, :c, :u, :scope, :period, :metrics, :summary, NOW())
                    """
                ),
                {
                    "id": snapshot_id, "c": context.company_id, "u": context.user_id,
                    "scope": input_data.get("scope", "company_overview"), "period": input_data.get("period", "7d"),
                    "metrics": json.dumps(metrics), "summary": summary,
                },
            )
            db.commit()
            return RunResult({"snapshotId": snapshot_id, "metrics": metrics, "aiSummary": summary}, 2, 0.002)
        finally:
            db.close()

