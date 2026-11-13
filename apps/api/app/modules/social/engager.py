import random
import uuid
from sqlalchemy import text

from ...core.base_agent import BaseAgent
from ...core.db import SessionLocal
from ...core.types import AgentContext, RunResult

CTA = {
    "question": "What is your team's biggest operational bottleneck this quarter?",
    "resource_link": "We published a short teardown of this workflow — link in comments.",
    "poll_hook": "Quick poll: which part of this workflow slows your team down most?",
}


class OwnPostEngagerAgent(BaseAgent):
    id = 1
    code = "own-post-engager"
    name = "Own Post Engager"
    default_mode = "auto"

    def plan(self, context: AgentContext, input_data: dict) -> list[str]:
        return ["Generate 1-3 starter comments", "Queue through anti-detection pacing"]

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        db = SessionLocal()
        try:
            post_id = input_data["postId"]
            has_post = bool(post_id) and not post_id.startswith("00000000")
            post = None
            if has_post:
                post = db.execute(
                    text('SELECT content, platform, connected_account_id FROM "social_posts" WHERE id = :id AND company_id = :c'),
                    {"id": post_id, "c": context.company_id},
                ).first()
            content = input_data.get("postContent") or (post[0] if post else "Operational automation milestone")
            platform = input_data.get("platform") or (post[1] if post else "linkedin")
            account_id = (post[2] if post else None) or input_data.get("connectedAccountId")

            comments = []
            for _ in range(input_data.get("commentCount", 1)):
                comment_id = str(uuid.uuid4())
                body = f"Strong point. {CTA[input_data.get('ctaType', 'question')]}"
                db.execute(
                    text(
                        """
                        INSERT INTO "social_comments"
                        (id, company_id, post_id, agent_run_id, platform, target_type, external_id, parent_external_id, thread_key, body, sentiment, direction, created_at)
                        VALUES (:id, :c, :post, :run, :platform, 'own_post', :external, :parent, :thread, :body, 'positive', 'outbound', NOW())
                        """
                    ),
                    {"id": comment_id, "c": context.company_id, "post": post_id if has_post else None, "run": run_id, "platform": platform, "external": f"cmt_{comment_id[:8]}", "parent": f"post_{post_id}", "thread": f"post_{post_id}", "body": body},
                )

                job_id = None
                if context.mode == "auto" and account_id:
                    job_id = str(uuid.uuid4())
                    jitter = random.randint(45, 180)
                    db.execute(
                        text(
                            """
                            INSERT INTO "outbox_jobs"
                            (id, connected_account_id, agent_run_id, thread_key, target_type, target_post_id, priority, reply_text, status, not_before, expires_at, idempotency_key)
                            VALUES (:id, :account, :run, :thread, 'social_comment', :post, 3, :body, 'queued',
                                    NOW() + make_interval(secs => :jitter), NOW() + INTERVAL '7 days', :key)
                            """
                        ),
                        {"id": job_id, "account": account_id, "run": run_id, "thread": f"post_{post_id}", "post": post_id, "body": body, "jitter": jitter, "key": f"own_{comment_id}"},
                    )
                db.commit()
                comments.append({"commentId": comment_id, "postId": post_id, "body": body, "outboxJobId": job_id, "status": "queued" if job_id else "drafted"})

            return RunResult({"postId": post_id, "comments": comments}, len(comments), 0.001 * len(comments))
        finally:
            db.close()

