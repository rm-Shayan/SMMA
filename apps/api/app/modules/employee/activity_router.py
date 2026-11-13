from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ..knowledge.service import ingest_text

router = APIRouter(tags=["employee-activity"])


class DocBody(BaseModel):
    title: str = Field(min_length=2)
    text: str = Field(min_length=20)


@router.get("/documents")
def my_documents(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT id, title, source FROM "knowledge_documents" WHERE company_id = :c ORDER BY title'), {"c": tenant.company_id}).all()
    return {"success": True, "documents": [dict(row._mapping) for row in rows]}


@router.post("/documents")
def upload_document(body: DocBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    return {"success": True, **ingest_text(db, tenant.company_id, body.title, body.text, "employee")}


@router.get("/files")
def my_files(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(
        text('SELECT id, file_name, created_at FROM "generated_files" WHERE company_id = :c AND user_id = :u ORDER BY created_at DESC LIMIT :limit'),
        {"c": tenant.company_id, "u": tenant.user_id, "limit": limit},
    ).all()
    return {"success": True, "files": [dict(row._mapping) for row in rows]}


@router.get("/files/{file_id}/download")
def download(file_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(
        text('SELECT file_name, storage_path FROM "generated_files" WHERE id = :id AND company_id = :c AND user_id = :u'),
        {"id": file_id, "c": tenant.company_id, "u": tenant.user_id},
    ).first()
    if not row or not Path(row[1]).exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(row[1], filename=row[0])


@router.get("/progress")
def my_progress(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT tp.* FROM "training_progress" tp JOIN "sops" s ON tp.sop_id = s.id WHERE s.company_id = :c AND tp.user_id = :u ORDER BY tp.updated_at DESC'),
        {"c": tenant.company_id, "u": tenant.user_id},
    ).all()
    return {"success": True, "progress": [dict(row._mapping) for row in rows]}


@router.get("/brief")
def my_brief(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id, brief_date, items FROM "daily_briefs" WHERE company_id = :c ORDER BY brief_date DESC LIMIT 1'), {"c": tenant.company_id}).first()
    return {"success": True, "brief": dict(row._mapping) if row else None}


@router.get("/connections")
def my_connections(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, provider, display_name, status FROM "connected_accounts" WHERE company_id = :c AND (user_id = :u OR user_id IS NULL)'),
        {"c": tenant.company_id, "u": tenant.user_id},
    ).all()
    return {"success": True, "connections": [dict(row._mapping) for row in rows]}


@router.delete("/connections/{account_id}")
def remove_connection(account_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    db.execute(text('DELETE FROM "connected_accounts" WHERE id = :id AND company_id = :c AND user_id = :u'), {"id": account_id, "c": tenant.company_id, "u": tenant.user_id})
    db.commit()
    return {"success": True, "accountId": account_id}


@router.get("/team")
def my_team(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, name, manager_id FROM "teams" WHERE company_id = :c AND (manager_id = :u OR id IN (SELECT team_id FROM "users" WHERE id = :u))'),
        {"c": tenant.company_id, "u": tenant.user_id},
    ).all()
    return {"success": True, "teams": [dict(row._mapping) for row in rows]}