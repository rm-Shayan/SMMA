import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant

router = APIRouter()


@router.get("/analytics/snapshots")
def snapshots(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 30):
    rows = db.execute(
        text('SELECT * FROM "analytics_snapshots" WHERE company_id = :c ORDER BY created_at DESC LIMIT :limit'),
        {"c": tenant.company_id, "limit": limit},
    ).all()
    return {"success": True, "snapshots": [dict(row._mapping) for row in rows]}


@router.get("/analytics/export")
def export(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT scope, period, metrics, ai_summary, created_at FROM "analytics_snapshots" WHERE company_id = :c ORDER BY created_at DESC'),
        {"c": tenant.company_id},
    ).all()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["scope", "period", "metrics", "summary", "created_at"])
    for row in rows:
        writer.writerow([row[0], row[1], row[2], row[3], row[4]])
    return Response(content=buffer.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=analytics.csv"})


@router.get("/daily-briefs/{brief_date}")
def brief_by_date(brief_date: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(
        text('SELECT id, brief_date, items FROM "daily_briefs" WHERE company_id = :c AND brief_date = :d'),
        {"c": tenant.company_id, "d": brief_date},
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Brief not found")
    return {"success": True, "brief": dict(row._mapping)}