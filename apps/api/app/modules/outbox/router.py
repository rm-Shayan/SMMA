from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant, require_roles

router = APIRouter()


@router.get("")
def list_jobs(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(
        text(
            """
            SELECT oj.*, ca.provider, ca.display_name FROM "outbox_jobs" oj
            JOIN "connected_accounts" ca ON oj.connected_account_id = ca.id
            WHERE ca.company_id = :c ORDER BY oj.not_before ASC NULLS FIRST LIMIT :limit
            """
        ),
        {"c": tenant.company_id, "limit": limit},
    ).all()
    return {"success": True, "jobs": [dict(row._mapping) for row in rows]}


@router.get("/stats")
def stats(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text(
            """
            SELECT oj.status, count(*)::int AS count FROM "outbox_jobs" oj
            JOIN "connected_accounts" ca ON oj.connected_account_id = ca.id
            WHERE ca.company_id = :c GROUP BY oj.status
            """
        ),
        {"c": tenant.company_id},
    ).all()
    return {"success": True, "stats": {row[0]: int(row[1]) for row in rows}}


@router.post("/{job_id}/retry")
def retry(job_id: str, tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    row = db.execute(
        text(
            """
            SELECT oj.id FROM "outbox_jobs" oj JOIN "connected_accounts" ca ON oj.connected_account_id = ca.id
            WHERE oj.id = :id AND ca.company_id = :c
            """
        ),
        {"id": job_id, "c": tenant.company_id},
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")
    db.execute(text('UPDATE "outbox_jobs" SET status = \'queued\', not_before = NOW() WHERE id = :id'), {"id": job_id})
    db.commit()
    return {"success": True, "jobId": job_id, "status": "queued"}


@router.post("/{job_id}/pause")
def pause(job_id: str, tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    row = db.execute(
        text(
            """
            SELECT oj.id FROM "outbox_jobs" oj JOIN "connected_accounts" ca ON oj.connected_account_id = ca.id
            WHERE oj.id = :id AND ca.company_id = :c
            """
        ),
        {"id": job_id, "c": tenant.company_id},
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")
    db.execute(text('UPDATE "outbox_jobs" SET status = \'paused\' WHERE id = :id'), {"id": job_id})
    db.commit()
    return {"success": True, "jobId": job_id, "status": "paused"}