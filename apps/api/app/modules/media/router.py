import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from ...core.deps import Tenant, get_tenant
from ...core.pubsub import publish_event_sync
from ..campaigns.audio_engine import synthesize_human_voice
from ..social.image_engine import generate_social_image
from ..social.video_engine import render_social_video

router = APIRouter(prefix="/media", tags=["media"])

class ImageReq(BaseModel):
    prompt: str = Field(min_length=3)
    platform: str = "linkedin"

class AudioReq(BaseModel):
    text: str = Field(min_length=3)
    lang: str = "en"

class VideoReq(BaseModel):
    prompt: str = Field(min_length=3)
    script: str = Field(min_length=5)
    lang: str = "en"

@router.post("/image")
def create_image(body: ImageReq, tenant: Tenant = Depends(get_tenant)):
    pid = str(uuid.uuid4())
    path = generate_social_image(body.prompt, pid, body.platform)
    publish_event_sync(tenant.company_id, "media_generated", {"type": "image", "path": path}, "media")
    return {"success": True, "path": path, "type": "image"}

@router.post("/voiceover")
def create_voiceover(body: AudioReq, tenant: Tenant = Depends(get_tenant)):
    path = synthesize_human_voice(body.text, body.lang)
    publish_event_sync(tenant.company_id, "media_generated", {"type": "audio", "path": path}, "media")
    return {"success": True, "path": path, "type": "audio"}

@router.post("/video")
def create_video(body: VideoReq, tenant: Tenant = Depends(get_tenant)):
    pid = str(uuid.uuid4())
    img = generate_social_image(body.prompt, pid, "linkedin")
    aud = synthesize_human_voice(body.script, body.lang)
    vid = render_social_video(img, aud, pid)
    publish_event_sync(tenant.company_id, "media_generated", {"type": "video", "path": vid}, "media")
    return {"success": True, "video": vid, "audio": aud, "image": img}

@router.get("/assets")
def list_assets(tenant: Tenant = Depends(get_tenant)):
    from ...core.storage import storage_driver
    return {"success": True, "driver": storage_driver.__class__.__name__, "companyId": tenant.company_id}
