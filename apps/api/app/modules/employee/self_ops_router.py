import json
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ..knowledge.service import search_similar
from ..knowledge.embedding import embed_text

router = APIRouter(tags=["employee-self"])


class AvatarBody(BaseModel):
    imageBase64: str


class SearchBody(BaseModel):
    query: str
    limit: int = 5


class RespondBody(BaseModel):
    status: str


@router.put("/profile/avatar")
def set_avatar(body: AvatarBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    import base64

    folder = Path(__file__).resolve().parents[3] / "storage" / "avatars"
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / f"{tenant.user_id}.png"
    path.write_bytes(base64.b64decode(body.imageBase64.split(",")[-1]))
    return {"success": True, "avatar": f"/storage/avatars/{path.name}"}


@router.get("/wallet/requests")
def credit_requests(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, meta, created_at FROM "audit_logs" WHERE user_id = :u AND action = \'credit_request\' ORDER BY created_at DESC LIMIT 50'),
        {"u": tenant.user_id},
    ).all()
    return {"success": True, "requests": [dict(row._mapping) for row in rows]}


@router.get("/runs/{run_id}/logs")
def run_logs(run_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT output, status, error FROM "agent_runs" WHERE id = :id AND company_id = :c AND user_id = :u'), {"id": run_id, "c": tenant.company_id, "u": tenant.user_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"success": True, "logs": {"status": row[1], "output": row[0], "error": row[2]}}


@router.post("/runs/{run_id}/cancel")
def cancel_run(run_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    db.execute(text('UPDATE "agent_runs" SET status = \'cancelled\', finished_at = NOW() WHERE id = :id AND company_id = :c AND user_id = :u AND status = \'queued\''), {"id": run_id, "c": tenant.company_id, "u": tenant.user_id})
    db.commit()
    return {"success": True, "runId": run_id}


@router.get("/tasks/{task_id}")
def task_detail(task_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT * FROM "tasks" WHERE id = :id AND company_id = :c AND user_id = :u'), {"id": task_id, "c": tenant.company_id, "u": tenant.user_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"success": True, "task": dict(row._mapping)}


@router.post("/tasks/{task_id}/cancel")
def cancel_task(task_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    db.execute(text('UPDATE "tasks" SET status = \'cancelled\' WHERE id = :id AND company_id = :c AND user_id = :u'), {"id": task_id, "c": tenant.company_id, "u": tenant.user_id})
    db.commit()
    return {"success": True, "taskId": task_id}


@router.post("/approvals/{approval_id}/respond")
def respond_approval(approval_id: str, body: RespondBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    if body.status not in ("approved", "rejected"):
        return {"success": False, "error": "Invalid status"}
    db.execute(
        text('UPDATE "approvals" SET status = :status, approver_id = :u, decided_at = NOW() WHERE id = :id AND agent_run_id IN (SELECT id FROM "agent_runs" WHERE company_id = :c AND user_id = :u)'),
        {"status": body.status, "approver": tenant.user_id, "id": approval_id, "c": tenant.company_id},
    )
    db.commit()
    return {"success": True, "approvalId": approval_id, "status": body.status}


@router.post("/outbox/{job_id}/retry")
def retry_job(job_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    db.execute(
        text('UPDATE "outbox_jobs" SET status = \'queued\', not_before = NOW() WHERE id = :id AND agent_run_id IN (SELECT id FROM "agent_runs" WHERE company_id = :c AND user_id = :u)'),
        {"id": job_id, "c": tenant.company_id, "u": tenant.user_id},
    )
    db.commit()
    return {"success": True, "jobId": job_id}


@router.post("/outbox/{job_id}/cancel")
def cancel_job(job_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    db.execute(
        text('UPDATE "outbox_jobs" SET status = \'paused\' WHERE id = :id AND agent_run_id IN (SELECT id FROM "agent_runs" WHERE company_id = :c AND user_id = :u)'),
        {"id": job_id, "c": tenant.company_id, "u": tenant.user_id},
    )
    db.commit()
    return {"success": True, "jobId": job_id}


@router.post("/knowledge/search")
def search(body: SearchBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    return {"success": True, "chunks": search_similar(db, tenant.company_id, embed_text(body.query), body.limit)}


@router.get("/usage/cost")
def usage_cost(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT COALESCE(sum(cost_usd),0) AS cost FROM "agent_runs" WHERE company_id = :c AND user_id = :u'), {"c": tenant.company_id, "u": tenant.user_id}).first()
    return {"success": True, "costUsd": float(row[0])}