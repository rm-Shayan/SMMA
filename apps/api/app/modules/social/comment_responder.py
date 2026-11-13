import re
import uuid
from sqlalchemy import text

from ...core.base_agent import BaseAgent
from ...core.db import SessionLocal
from ...core.types import AgentContext, RunResult


def triage(comment: str) -> dict:
    lower = comment.lower()
    if re.search(r"price|cost|expensive|refund", lower):
        return {"category": "pricing_dispute", "sentiment": "dispute"}
    if re.search(r"great|awesome|love|brilliant|excellent", lower):
        return {"category": "compliment", "sentiment": "positive"}
    if re.search(r"bug|broken|error|fail|outage", lower):
        return {"category": "support_issue", "sentiment": "negative"}
    return {"category": "inquiry", "sentiment": "neutral"}


class CommentResponderAgent(BaseAgent):
    id = 3
    code = "comment-responder"
    name = "Comment Responder"
    default_mode = "auto"

    def plan(self, context: AgentContext, input_data: dict) -> list[str]:
        return ["Triage inbound comment", "Reply or escalate pricing disputes to approval"]

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        db = SessionLocal()
        try:
            thread_key = f"post_{input_data['commentExternalId']}"
            classification = triage(input_data["commentText"])
            comment_id = str(uuid.uuid4())
            db.execute(
                text(
                    """
                    INSERT INTO "social_comments"
                    (id, company_id, post_id, agent_run_id, platform, target_type, external_id, thread_key, body, sentiment, direction, created_at)
                    VALUES (:id, :c, NULL, :run, :platform, 'competitor_post', :external, :thread, :body, :sentiment, 'inbound', NOW())
                    ON CONFLICT (external_id) DO NOTHING
                    """
                ),
                {"id": comment_id, "c": context.company_id, "run": run_id, "platform": input_data["platform"], "external": input_data["commentExternalId"], "thread": thread_key, "body": input_data["commentText"], "sentiment": classification["sentiment"]},
            )

            action = "logged_only"
            approval_id = None
            if classification["category"] in ("pricing_dispute", "support_issue"):
                action = "escalated_for_approval"
                approval_id = str(uuid.uuid4())
                db.execute(text('INSERT INTO "approvals" (id, agent_run_id, status) VALUES (:id, :run, \'pending\')'), {"id": approval_id, "run": run_id})
            elif classification["category"] == "compliment":
                action = "thanked_and_liked"
                db.execute(
                    text(
                        """
                        INSERT INTO "social_comments"
                        (id, company_id, agent_run_id, platform, target_type, external_id, thread_key, body, sentiment, direction, created_at)
                        VALUES (:id, :c, :run, :platform, 'competitor_post', :external, :thread, :body, 'positive', 'outbound', NOW())
                        """
                    ),
                    {"id": str(uuid.uuid4()), "c": context.company_id, "run": run_id, "platform": input_data["platform"], "external": f"reply_{input_data['commentExternalId']}", "thread": thread_key, "body": "Thank you for the kind words!"},
                )
            db.commit()
            return RunResult({"commentId": comment_id, "category": classification["category"], "sentiment": classification["sentiment"], "actionTaken": action, "approvalId": approval_id}, 1, 0.001)
        finally:
            db.close()

