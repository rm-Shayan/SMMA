import os
import httpx
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ...core.pubsub import publish_event_sync

router = APIRouter(prefix="/approvals-bot", tags=["approvals-bot"])

class WebhookDecision(BaseModel):
    approvalId: str
    decision: str  # 'approved' or 'rejected'
    notes: str | None = None

@router.post("/telegram-webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    """Receives inline button callbacks from Telegram approval notifications."""
    data = await request.json()
    callback = data.get("callback_query")
    if not callback:
        return {"ok": True}
    payload = callback.get("data", "")
    # Format expected: "appr:<approval_id>" or "rejc:<approval_id>"
    if ":" in payload:
        action, app_id = payload.split(":", 1)
        status = "approved" if action == "appr" else "rejected"
        db.execute(text('UPDATE "approvals" SET status = :s, decided_at = NOW() WHERE id = :id'), {"s": status, "id": app_id})
        db.commit()
    return {"ok": True}

@router.post("/notify-manager")
def notify_manager(approval_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    """Sends an approval alert to the manager's connected WhatsApp/Telegram."""
    publish_event_sync(tenant.company_id, "approval_requested", {"approvalId": approval_id}, "notifications")
    return {"success": True, "approvalId": approval_id, "status": "dispatched"}

