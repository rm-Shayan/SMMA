import uuid
from sqlalchemy import text

from ...core.base_agent import BaseAgent
from ...core.db import SessionLocal
from ...core.llm import generate_text
from ...core.types import AgentContext, RunResult

DEFAULT_VOICE = "Insightful take on the market! Product-led growth combined with autonomous operations is definitely the way forward."


def craft_competitor_comment(post_text: str | None, competitor: str | None, platform: str) -> str:
    topic_str = post_text or competitor or "SaaS growth and business automation"
    prompt = (
        f"You are a B2B brand strategist commenting on a competitor's {platform} post about: '{topic_str[:250]}'. "
        "Write a concise, insightful thought-leadership comment (1-2 sentences). "
        "Compliment their insight while adding a smart operational nuance. Be polite, authentic, and non-promotional."
    )
    reply = generate_text(prompt, max_tokens=70)
    if reply and len(reply.strip()) > 10:
        return reply.strip().strip('"')
    return DEFAULT_VOICE


class CompetitorEngagerAgent(BaseAgent):
    id, code, name, default_mode = 7, "competitor-engager", "Competitor Engager", "draft"

    def plan(self, context: AgentContext, input_data: dict) -> list[str]:
        return ["Craft context-aware thought-leadership comment", "Enforce PRD Assisted Mode", "Submit to human approval queue"]

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        db = SessionLocal()
        try:
            platform = input_data.get("platform", "linkedin")
            post_ref = input_data.get("competitorPostRef", "post_ref")
            post_text = input_data.get("postText") or input_data.get("topic")
            comp_name = input_data.get("competitorName")

            comment_body = craft_competitor_comment(post_text, comp_name, platform)
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
                    "id": comment_id, "c": context.company_id, "run": run_id, "platform": platform,
                    "ref": post_ref, "external": f"comp_{post_ref}", "thread": f"comp_{post_ref}", "body": comment_body,
                },
            )
            db.execute(text('INSERT INTO "approvals" (id, agent_run_id, status) VALUES (:id, :run, \'pending\')'), {"id": approval_id, "run": run_id})
            db.commit()
            return RunResult({"commentId": comment_id, "approvalId": approval_id, "status": "pending_human_approval", "body": comment_body}, 1, 0.001)
        finally:
            db.close()
