import uuid
from sqlalchemy import text

from ...core.base_agent import BaseAgent
from ...core.db import SessionLocal
from ...core.types import AgentContext, RunResult
from ..campaigns.audio_engine import synthesize_human_voice
from .image_engine import generate_social_image
from .style_engine import craft_social_post
from .video_engine import render_social_video, should_create_video


class PublisherAgent(BaseAgent):
    id = 8
    code = "publisher"
    name = "Publisher & Content Distributor"
    default_mode = "draft"

    def estimate_credits(self, input_data: dict) -> int:
        return 3 if should_create_video(input_data.get("format"), input_data.get("topic")) else 2

    def plan(self, context: AgentContext, input_data: dict) -> list[str]:
        return ["Reason psychological hook & content", "Synthesize graphic or motion video", "Route to approval or publish"]

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        db = SessionLocal()
        try:
            post_id = str(uuid.uuid4())
            is_draft = context.mode == "draft" and not input_data.get("autoApprove")
            approval_id, external_id = None, None
            status = "draft" if is_draft else "scheduled"

            platform = input_data.get("platform", "linkedin")
            topic = input_data.get("topic", "business automation")
            tone = input_data.get("tone", "professional")
            crafted = craft_social_post(platform, topic, tone)

            content = input_data.get("content") or crafted["content"]
            prompt = input_data.get("imagePrompt") or crafted["imagePrompt"]
            image_file = generate_social_image(prompt, post_id, platform=platform)

            video_file = None
            if should_create_video(input_data.get("format"), topic):
                audio_file = synthesize_human_voice(content[:300], lang=input_data.get("language", "en"))
                video_file = render_social_video(image_file, audio_file, post_id)

            if is_draft:
                approval_id = str(uuid.uuid4())
                db.execute(text('INSERT INTO "approvals" (id, agent_run_id, status) VALUES (:id, :run, \'pending\')'), {"id": approval_id, "run": run_id})
            elif not input_data.get("scheduledAt"):
                status = "published"
                external_id = f"{platform}_ext_{run_id[:8]}"

            db.execute(
                text(
                    """
                    INSERT INTO "social_posts"
                    (id, company_id, connected_account_id, created_by_run, platform, external_id, content, image_prompt, status, scheduled_at, published_at)
                    VALUES (:id, :company, :account, :run, :platform, :external, :content, :prompt, :status, :scheduled, :published)
                    """
                ),
                {
                    "id": post_id, "company": context.company_id, "account": input_data.get("connectedAccountId"),
                    "run": run_id, "platform": platform, "external": external_id,
                    "content": content, "prompt": f"{prompt} | video:{video_file}" if video_file else prompt,
                    "status": status, "scheduled": input_data.get("scheduledAt"), "published": "NOW()" if status == "published" else None,
                },
            )
            db.commit()
            return RunResult({"postId": post_id, "platform": platform, "content": content, "imageUrl": image_file, "videoUrl": video_file, "status": status, "approvalId": approval_id, "externalId": external_id}, 3 if video_file else 2, 0.003 if video_file else 0.002)
        finally:
            db.close()
