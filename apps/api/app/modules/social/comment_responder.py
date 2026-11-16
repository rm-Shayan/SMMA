import re
import uuid
from sqlalchemy import text

from ...core.base_agent import BaseAgent
from ...core.db import SessionLocal
from ...core.llm import generate_text
from ...core.types import AgentContext, RunResult


def triage(comment: str) -> dict:
    lower = comment.lower()
    if re.search(r"price|cost|expensive|refund|lawyer|legal|scam|fraud", lower):
        return {"category": "pricing_dispute", "sentiment": "dispute"}
    if re.search(r"great|awesome|love|brilliant|excellent|kamaal|zabardast|nice", lower):
        return {"category": "compliment", "sentiment": "positive"}
    if re.search(r"bug|broken|error|fail|outage|issue|kharab|masla", lower):
        return {"category": "support_issue", "sentiment": "negative"}
    return {"category": "inquiry", "sentiment": "neutral"}


def craft_comment_reply(comment: str, category: str, platform: str) -> str:
    prompt = f"You are a friendly brand social media manager on {platform}. Reply warmly and concisely (1-2 sentences) to this user comment: '{comment}'. Category: {category}. Keep it natural, genuine, and professional."
    reply = generate_text(prompt, max_tokens=60)
    if reply and len(reply.strip()) > 3:
        return reply.strip().strip('"')
    return "Thank you so much! Feel free to DM us if you have any questions." if category == "compliment" else "Thanks for asking! Check out our bio link or DM us for full details."


class CommentResponderAgent(BaseAgent):
    id, code, name, default_mode = 3, "comment-responder", "Comment Responder", "auto"

    def plan(self, context: AgentContext, input_data: dict) -> list[str]:
        return ["Triage inbound comment", "Generate personalized brand response", "Queue reply or escalate high-friction cases"]

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        db = SessionLocal()
        try:
            platform = input_data.get("platform", "instagram")
            comment_text = input_data.get("commentText", "")
            ext_id = input_data.get("commentExternalId", str(uuid.uuid4())[:8])
            thread_key = f"post_{ext_id}"

            classification = triage(comment_text)
            comment_id, approval_id, outbox_id = str(uuid.uuid4()), None, None

            db.execute(
                text(
                    """
                    INSERT INTO "social_comments"
                    (id, company_id, post_id, agent_run_id, platform, target_type, external_id, thread_key, body, sentiment, direction, created_at)
                    VALUES (:id, :c, NULL, :run, :platform, 'post_comment', :external, :thread, :body, :sentiment, 'inbound', NOW())
                    ON CONFLICT (external_id) DO NOTHING
                    """
                ),
                {"id": comment_id, "c": context.company_id, "run": run_id, "platform": platform, "external": ext_id, "thread": thread_key, "body": comment_text, "sentiment": classification["sentiment"]},
            )

            if classification["category"] in ("pricing_dispute", "support_issue"):
                action = "escalated_for_approval"
                approval_id = str(uuid.uuid4())
                db.execute(text('INSERT INTO "approvals" (id, agent_run_id, status) VALUES (:id, :run, \'pending\')'), {"id": approval_id, "run": run_id})
            else:
                reply_body = craft_comment_reply(comment_text, classification["category"], platform)
                action = "auto_replied"
                reply_comm_id = str(uuid.uuid4())
                db.execute(
                    text(
                        """
                        INSERT INTO "social_comments"
                        (id, company_id, agent_run_id, platform, target_type, external_id, thread_key, body, sentiment, direction, created_at)
                        VALUES (:id, :c, :run, :platform, 'post_comment', :external, :thread, :body, 'positive', 'outbound', NOW())
                        """
                    ),
                    {"id": reply_comm_id, "c": context.company_id, "run": run_id, "platform": platform, "external": f"reply_{ext_id}", "thread": thread_key, "body": reply_body},
                )
                account_id = input_data.get("connectedAccountId")
                if not account_id:
                    acc_row = db.execute(text('SELECT id FROM "connected_accounts" WHERE provider = :p AND company_id = :c AND status NOT IN (\'disconnected\', \'error\') LIMIT 1'), {"p": platform, "c": context.company_id}).first()
                    account_id = acc_row[0] if acc_row else None
                if account_id:
                    outbox_id = str(uuid.uuid4())
                    db.execute(
                        text('INSERT INTO "outbox_jobs" (id, connected_account_id, agent_run_id, priority, status, reply_text, thread_key, target_type, not_before, expires_at) VALUES (:id, :ca, :run, 1, \'queued\', :txt, :tk, \'social_reply\', NOW() + INTERVAL \'2 minutes\', NOW() + INTERVAL \'24 hours\')'),
                        {"id": outbox_id, "ca": account_id, "run": run_id, "txt": reply_body, "tk": thread_key},
                    )

            db.commit()
            return RunResult({"commentId": comment_id, "category": classification["category"], "sentiment": classification["sentiment"], "actionTaken": action, "approvalId": approval_id, "outboxJobId": outbox_id}, 1, 0.001)
        finally:
            db.close()
