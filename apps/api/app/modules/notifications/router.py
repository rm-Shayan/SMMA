import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ...core.pubsub import publish_event_sync

router = APIRouter(prefix="/notifications", tags=["notifications"])

class PrefUpdate(BaseModel):
    lowCreditThreshold: int = 100
    emailAlerts: bool = True
    approvalAlerts: bool = True

@router.get("")
def list_notifications(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT * FROM "audit_logs" WHERE company_id = :c ORDER BY created_at DESC LIMIT 30'),
        {"c": tenant.company_id},
    ).all()
    notifications = [
        {"id": str(r[0]), "type": r[3] or "info", "message": f"{r[3]} on {r[4]}", "time": str(r[7])}
        for r in rows
    ]
    return {"success": True, "notifications": notifications}

@router.post("/send-test")
def send_test_alert(tenant: Tenant = Depends(get_tenant)):
    payload = {"title": "Test Real-time Notification", "time": "just now", "priority": "normal"}
    publish_event_sync(tenant.company_id, "alert", payload, "notifications")
    return {"success": True, "delivered": True}

@router.get("/preferences")
def get_preferences(tenant: Tenant = Depends(get_tenant)):
    return {
        "success": True,
        "companyId": tenant.company_id,
        "lowCreditThreshold": 100,
        "emailAlerts": True,
        "approvalAlerts": True,
    }

@router.put("/preferences")
def update_preferences(body: PrefUpdate, tenant: Tenant = Depends(get_tenant)):
    return {"success": True, "updated": body.model_dump()}

