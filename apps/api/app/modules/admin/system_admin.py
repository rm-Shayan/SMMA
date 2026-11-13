import os
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, require_roles
from ...core.pubsub import publish_event_sync

router = APIRouter(prefix="/system", tags=["admin-system"])

class MaintenanceBody(BaseModel):
    enabled: bool
    reason: str = "Scheduled maintenance"

@router.get("/health-deep")
def deep_health_check(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    db_ok = bool(db.execute(text("SELECT 1")).scalar())
    from ...core.storage import storage_driver
    return {
        "success": True,
        "database": "connected" if db_ok else "unreachable",
        "storage": storage_driver.__class__.__name__,
        "environment": os.getenv("ENV", "production"),
    }

@router.get("/queues")
def queue_status(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    queued = db.execute(text('SELECT count(*)::int FROM "outbox_jobs" WHERE status = \'queued\'')).scalar()
    sending = db.execute(text('SELECT count(*)::int FROM "outbox_jobs" WHERE status = \'sending\'')).scalar()
    failed = db.execute(text('SELECT count(*)::int FROM "outbox_jobs" WHERE status = \'failed\'')).scalar()
    return {"success": True, "queues": {"queued": queued, "sending": sending, "failed": failed}}

@router.post("/queues/retry-failed")
def retry_failed_jobs(tenant: Tenant = Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    updated = db.execute(text('UPDATE "outbox_jobs" SET status = \'queued\', not_before = NOW() WHERE status = \'failed\'')).rowcount
    db.commit()
    return {"success": True, "requeued": updated}

@router.post("/maintenance-mode")
def toggle_maintenance(body: MaintenanceBody, tenant: Tenant = Depends(require_roles("super_admin"))):
    return {"success": True, "maintenance": body.enabled, "reason": body.reason}

