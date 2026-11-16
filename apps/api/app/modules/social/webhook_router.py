import hashlib
import hmac
import json
import os
from fastapi import APIRouter, Depends, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant
from ...core.runner import run_agent

router = APIRouter()


@router.get("/webhook")
def meta_webhook_verify(request: Request):
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    expected = os.getenv("META_VERIFY_TOKEN", "styre_bot_verify_token")
    if request.query_params.get("hub.mode") == "subscribe" and token == expected and challenge:
        return PlainTextResponse(content=challenge, status_code=200)
    return {"status": "error", "message": "Verification failed"}


@router.post("/webhook")
async def webhook(request: Request, db: Session = Depends(get_db)):
    raw = await request.body()
    secret = os.getenv("META_APP_SECRET")
    signature = request.headers.get("x-hub-signature-256", "")
    if secret and signature.startswith("sha256="):
        digest = hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(digest, signature.split("=", 1)[1]):
            return {"success": False, "error": "Invalid signature"}
    payload = json.loads(raw or b"{}")
    tenant_id = request.headers.get("x-tenant-id")
    for item in payload.get("entry", []):
        for ch in item.get("changes", []):
            if ch.get("field") == "feed" and ch.get("value", {}).get("item") == "comment" and tenant_id:
                val = ch["value"]
                run_agent(Tenant(tenant_id, None, None), "comment-responder", 3, "a0000000-0000-0000-0000-000000000003", "auto", {"commentExternalId": str(val.get("comment_id") or val.get("id")), "platform": "facebook", "commentText": val.get("message", ""), "authorName": (val.get("from") or {}).get("name")})
    return {"success": True}
