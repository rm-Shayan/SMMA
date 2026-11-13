import uuid
from sqlalchemy import text

from ...core.base_agent import BaseAgent
from ...core.db import SessionLocal
from ...core.types import AgentContext, RunResult

VOICE = "We have been following your journey in the space and appreciate the focus on product-led growth."


class CompetitorEngagerAgent(BaseAgent):
    id = 7
    code = "competitor-engager"
    name = "Competitor Engager"
    default_mode = "draft"

    def plan(self, context: AgentContext, input_data: dict) -> list[str]:
        return ["Verify Assisted Mode guardrail", "Submit comment for human approval"]

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        db = SessionLocal()
        try:
            comment_id = str(uuid.uuid4())
            approval_id = str(uuid.uuid4())
            db.execute(
                text(
                    """
                    INSERT INTO "social_comments"
                    (id, company_id, agent_run_id, platform, target_type, competitor_post_ref, external_id, thread_key, body, sentiment, direction, created_at)
                    VALUES (:id, :c, :run, :platform, 'competitor_post', :ref, :external, :thread, :body, 'neutral', 'outbound', NOW())
                    """
                ),
                {
                    "id": comment_id, "c": context.company_id, "run": run_id, "platform": input_data.get("platform", "linkedin"),
                    "ref": input_data["competitorPostRef"], "external": f"comp_{input_data['competitorPostRef']}", "thread": f"comp_{input_data['competitorPostRef']}", "body": VOICE,
                },
            )
            db.execute(text('INSERT INTO "approvals" (id, agent_run_id, status) VALUES (:id, :run, \'pending\')'), {"id": approval_id, "run": run_id})
            db.commit()
            return RunResult({"commentId": comment_id, "approvalId": approval_id, "status": "pending_human_approval", "body": VOICE}, 1, 0.001)
        finally:
            db.close()

