import json
import uuid
from sqlalchemy import text

from ...core.base_agent import BaseAgent
from ...core.db import SessionLocal
from ...core.types import AgentContext, RunResult


def build_brief(db, company_id: str) -> list[dict]:
    items = []
    approvals = db.execute(
        text('SELECT count(*)::int FROM "approvals" a JOIN "agent_runs" ar ON a.agent_run_id = ar.id WHERE ar.company_id = :c AND a.status = \'pending\''),
        {"c": company_id},
    ).first()
    if int(approvals[0]) > 0:
        items.append({"priority": "high", "title": f"Clear {int(approvals[0])} pending approval(s)", "description": "Drafts are waiting for sign-off.", "suggestedAgentId": 8})

    deals = db.execute(text('SELECT count(*)::int FROM "deals" WHERE company_id = :c AND lower(stage) = \'interested\''), {"c": company_id}).first()
    if int(deals[0]) > 0:
        items.append({"priority": "high", "title": f"Follow up with {int(deals[0])} interested lead(s)", "description": "Agent #9 classified replies as interested.", "suggestedAgentId": 9})

    outbox = db.execute(
        text('SELECT count(*)::int FROM "outbox_jobs" oj JOIN "connected_accounts" ca ON oj.connected_account_id = ca.id WHERE ca.company_id = :c AND oj.status = \'queued\''),
        {"c": company_id},
    ).first()
    if int(outbox[0]) > 0:
        items.append({"priority": "medium", "title": f"{int(outbox[0])} paced message(s) queued", "description": "Anti-ban pacing worker will dispatch in operating hours.", "suggestedAgentId": 6})

    insights = db.execute(
        text('SELECT count(*)::int FROM "competitor_insights" ci JOIN "competitors" c ON ci.competitor_id = c.id WHERE c.company_id = :c'),
        {"c": company_id},
    ).first()
    if int(insights[0]) > 0:
        items.append({"priority": "low", "title": f"{int(insights[0])} competitor insight(s)", "description": "Review positioning gaps before the next content sprint.", "suggestedAgentId": 2})

    if not items:
        items.append({"priority": "low", "title": "No blocking work", "description": "Pipeline is clear; consider proactive research.", "suggestedAgentId": 12})
    return items


class DailyBriefAgent(BaseAgent):
    id = 5
    code = "daily-brief"
    name = "Daily Brief"
    default_mode = "auto"

    def plan(self, context: AgentContext, input_data: dict) -> list[str]:
        return ["Scan approvals, deals, outbox and insights", "Rank executive agenda", "Persist daily_briefs"]

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        db = SessionLocal()
        try:
            items = build_brief(db, context.company_id)
            for item in items:
                item["id"] = str(uuid.uuid4())
            brief_id = str(uuid.uuid4())
            db.execute(
                text('INSERT INTO "daily_briefs" (id, company_id, user_id, agent_run_id, brief_date, items) VALUES (:id, :c, :u, :run, CURRENT_DATE, :items)'),
                {"id": brief_id, "c": context.company_id, "u": context.user_id, "run": run_id, "items": json.dumps(items)},
            )
            db.commit()
            return RunResult({"briefId": brief_id, "items": items}, 1, 0.001)
        finally:
            db.close()

