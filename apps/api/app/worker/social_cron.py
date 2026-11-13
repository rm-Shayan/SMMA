import uuid
from sqlalchemy import text
from ..core.audit import record
from ..core.db import SessionLocal
from ..core.types import AgentContext
from ..modules.social.engager import OwnPostEngagerAgent

ENGAGER = OwnPostEngagerAgent()


def publish_scheduled_posts(limit: int = 10) -> int:
    db = SessionLocal()
    published_count = 0
    try:
        due_posts = db.execute(
            text(
                """
                SELECT id, company_id, platform, connected_account_id, content
                FROM "social_posts"
                WHERE status = 'approved' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW()
                ORDER BY scheduled_at ASC LIMIT :limit
                FOR UPDATE SKIP LOCKED
                """
            ),
            {"limit": limit},
        ).all()

        for row in due_posts:
            post = dict(row._mapping)
            ext_id = f"{post['platform']}_live_{uuid.uuid4().hex[:8]}"

            db.execute(
                text('UPDATE "social_posts" SET status = \'published\', external_id = :ext, published_at = NOW() WHERE id = :id'),
                {"ext": ext_id, "id": post["id"]},
            )
            db.commit()
            published_count += 1

            record(db, post["company_id"], None, "published", "social_posts", post["id"], {"externalId": ext_id, "platform": post["platform"]})

            # Trigger starter engagement via Agent #1
            try:
                ENGAGER.execute(
                    AgentContext(post["company_id"], None, None, 1, "a0000000-0000-0000-0000-000000000001", "auto"),
                    {"postId": post["id"], "platform": post["platform"], "postContent": post["content"], "connectedAccountId": post["connected_account_id"], "commentCount": 1},
                )
            except Exception:
                db.rollback()
    finally:
        db.close()
    return published_count

