from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant, require_roles

router = APIRouter()


def purge_stale_jobs(db: Session, company_id: str | None = None) -> int:
    """Expires any queued/paused jobs older than 24h or past expires_at (PRD 6.2)."""
    sql = """
        UPDATE "outbox_jobs" SET status = 'expired'
        WHERE status IN ('queued', 'paused')
        AND (
            (expires_at IS NOT NULL AND expires_at <= NOW())
            OR (not_before IS NOT NULL AND not_before < (NOW() - INTERVAL '24 hours'))
        )
    """
    params = {}
    if company_id:
        sql += ' AND connected_account_id IN (SELECT id FROM "connected_accounts" WHERE company_id = :c)'
        params["c"] = company_id
    res = db.execute(text(sql), params)
    db.commit()
    return res.rowcount


@router.get("")
def list_jobs(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    purge_stale_jobs(db, tenant.company_id)
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
    purge_stale_jobs(db, tenant.company_id)
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


@router.post("/purge-expired")
def purge_expired(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    count = purge_stale_jobs(db, tenant.company_id)
    return {"success": True, "purgedCount": count, "message": f"{count} stale outbox jobs expired (>24h TTL)."}


@router.post("/{job_id}/retry")
def retry(job_id: str, tenant: Tenant = Depends(require_roles("super_admin", "company_admin", "manager")), db: Session = Depends(get_db)):
    row = db.execute(
        text('SELECT oj.id FROM "outbox_jobs" oj JOIN "connected_accounts" ca ON oj.connected_account_id = ca.id WHERE oj.id = :id AND ca.company_id = :c'),
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
        text('SELECT oj.id FROM "outbox_jobs" oj JOIN "connected_accounts" ca ON oj.connected_account_id = ca.id WHERE oj.id = :id AND ca.company_id = :c'),
        {"id": job_id, "c": tenant.company_id},
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")
    db.execute(text('UPDATE "outbox_jobs" SET status = \'paused\' WHERE id = :id'), {"id": job_id})
    db.commit()
    return {"success": True, "jobId": job_id, "status": "paused"}
