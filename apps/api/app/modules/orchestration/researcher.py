import json
import uuid
from sqlalchemy import text

from ...core.base_agent import BaseAgent
from ...core.db import SessionLocal
from ...core.types import AgentContext, RunResult
from .discovery import discover_competitor_insights


class CompetitorResearcherAgent(BaseAgent):
    id = 2
    code = "competitor-researcher"
    name = "Competitor Researcher"
    default_mode = "auto"

    def estimate_credits(self, input_data: dict) -> int:
        return 3

    def plan(self, context: AgentContext, input_data: dict) -> list[str]:
        target = input_data.get("targetCompetitor") or input_data.get("focusArea") or "Industry Landscape"
        return [f"Autonomously discover rivals in {target}", "Extract live positioning and gaps", "Persist competitor insights"]

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        db = SessionLocal()
        try:
            target_query = input_data.get("targetCompetitor") or input_data.get("focusArea") or "AI B2B SaaS"
            data = discover_competitor_insights(target_query)
            comp_name = data.get("targetCompetitor", target_query)
            comp_site = data.get("websiteUrl") or input_data.get("websiteUrl")

            row = db.execute(
                text('SELECT id FROM "competitors" WHERE company_id = :c AND lower(name) = lower(:n) LIMIT 1'),
                {"c": context.company_id, "n": comp_name},
            ).first()
            if row:
                competitor_id = str(row[0])
            else:
                competitor_id = str(uuid.uuid4())
                db.execute(
                    text(
                        'INSERT INTO "competitors" (id, company_id, name, website, social_handles, keywords) '
                        "VALUES (:id, :c, :n, :website, '[]', :keywords)"
                    ),
                    {"id": competitor_id, "c": context.company_id, "n": comp_name, "website": comp_site, "keywords": json.dumps(data.get("suggestedKeywords", []))},
                )

            db.execute(
                text(
                    'INSERT INTO "competitor_insights" (id, competitor_id, agent_run_id, type, data, captured_at) '
                    "VALUES (:id, :competitor, :run, 'report', :data, NOW())"
                ),
                {"id": str(uuid.uuid4()), "competitor": competitor_id, "run": run_id, "data": json.dumps(data)},
            )
            db.commit()
            return RunResult(data, 3, 0.003)
        finally:
            db.close()
