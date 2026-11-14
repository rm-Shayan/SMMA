from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from .style_engine import refine_social_post

router = APIRouter()


class RegenerateBody(BaseModel):
    feedback: str = "Make it more engaging, punchy, and include a call to action."


@router.post("/posts/{post_id}/regenerate")
def regenerate_post(post_id: str, body: RegenerateBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(
        text('SELECT id, platform, content, status FROM "social_posts" WHERE id = :id AND company_id = :c'),
        {"id": post_id, "c": tenant.company_id},
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Post not found")
    if row[3] == "published":
        raise HTTPException(status_code=400, detail="Cannot regenerate an already published post")

    platform = row[1] or "facebook"
    current_content = row[2] or ""
    refined = refine_social_post(current_content, body.feedback, platform)

    new_content = refined.get("content") or current_content
    new_prompt = refined.get("imagePrompt") or ""

    db.execute(
        text('UPDATE "social_posts" SET content = :content, image_prompt = :prompt WHERE id = :id'),
        {"content": new_content, "prompt": new_prompt, "id": post_id},
    )
    db.commit()
    return {
        "success": True,
        "postId": post_id,
        "platform": platform,
        "content": new_content,
        "imagePrompt": new_prompt,
        "status": row[3],
        "message": "Post successfully refined and regenerated with AI based on your thoughts!"
    }
