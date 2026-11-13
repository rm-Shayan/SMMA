from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ...core.runner import run_agent
from .embedding import embed_text
from .service import create_sop, ingest_text, search_similar

router = APIRouter()


class RagBody(BaseModel):
    query: str = Field(min_length=3)
    department: str | None = None


class IngestBody(BaseModel):
    title: str = Field(min_length=2)
    text: str = Field(min_length=20)
    source: str = "upload"
    createSop: bool = False


class SearchBody(BaseModel):
    query: str = Field(min_length=3)
    limit: int = 5


class SopBody(BaseModel):
    sopId: str
    moduleNo: int
    question: str
    traineeAnswer: str


@router.get("/documents")
def list_documents(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(
        text('SELECT id, title, source, storage_path FROM "knowledge_documents" WHERE company_id = :c ORDER BY title LIMIT :limit'),
        {"c": tenant.company_id, "limit": limit},
    ).all()
    return {"success": True, "documents": [dict(row._mapping) for row in rows]}


@router.get("/sops")
def list_sops(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, title, modules FROM "sops" WHERE company_id = :c ORDER BY title'),
        {"c": tenant.company_id},
    ).all()
    return {"success": True, "sops": [dict(row._mapping) for row in rows]}


@router.post("/rag")
def rag(body: RagBody, tenant: Tenant = Depends(get_tenant)):
    result = run_agent(tenant, "company-ops", 11, "a0000000-0000-0000-0000-000000000011", "auto", body.model_dump())
    return {"success": result.success, "data": result.data, "runId": result.run_id}


@router.post("/documents")
def ingest(body: IngestBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    document = ingest_text(db, tenant.company_id, body.title, body.text, body.source)
    if body.createSop:
        document["sop"] = create_sop(db, tenant.company_id, document["documentId"], body.title, body.text)
    return {"success": True, **document}


@router.post("/search")
def search(body: SearchBody, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    chunks = search_similar(db, tenant.company_id, embed_text(body.query), body.limit)
    return {"success": True, "chunks": chunks}


@router.post("/sop/evaluate")
def evaluate(body: SopBody, tenant: Tenant = Depends(get_tenant)):
    result = run_agent(
        tenant, "trainee-sop", 10, "a0000000-0000-0000-0000-000000000010", "auto",
        {**body.model_dump(), "traineeUserId": tenant.user_id},
    )
    return {"success": result.success, "data": result.data, "runId": result.run_id}



@router.get("/documents/{document_id}")
def get_document(document_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(
        text('SELECT id, title, source, storage_path FROM "knowledge_documents" WHERE id = :id AND company_id = :c'),
        {"id": document_id, "c": tenant.company_id},
    ).first()
    if not row:
        return {"success": False, "error": "Document not found"}
    chunks = db.execute(text('SELECT count(*)::int FROM "document_chunks" WHERE document_id = :id'), {"id": document_id}).scalar()
    return {"success": True, "document": {**dict(row._mapping), "chunks": chunks}}


@router.delete("/documents/{document_id}")
def delete_document(document_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    db.execute(text('DELETE FROM "document_chunks" WHERE document_id = :id AND company_id = :c'), {"id": document_id, "c": tenant.company_id})
    db.execute(text('DELETE FROM "knowledge_documents" WHERE id = :id AND company_id = :c'), {"id": document_id, "c": tenant.company_id})
    db.commit()
    return {"success": True, "documentId": document_id}


@router.get("/sops/{sop_id}")
def get_sop_detail(sop_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id, title, modules FROM "sops" WHERE id = :id AND company_id = :c'), {"id": sop_id, "c": tenant.company_id}).first()
    if not row:
        return {"success": False, "error": "SOP not found"}
    return {"success": True, "sop": dict(row._mapping)}


@router.get("/training-progress")
def training_progress(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 100):
    rows = db.execute(
        text('SELECT tp.*, u.name AS trainee FROM "training_progress" tp JOIN "sops" s ON tp.sop_id = s.id LEFT JOIN "users" u ON tp.user_id = u.id WHERE s.company_id = :c ORDER BY tp.updated_at DESC LIMIT :limit'),
        {"c": tenant.company_id, "limit": limit},
    ).all()
    return {"success": True, "progress": [dict(row._mapping) for row in rows]}


@router.get("/generated-files")
def generated_files(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(
        text('SELECT id, file_name, storage_path, created_at FROM "generated_files" WHERE company_id = :c ORDER BY created_at DESC LIMIT :limit'),
        {"c": tenant.company_id, "limit": limit},
    ).all()
    return {"success": True, "files": [dict(row._mapping) for row in rows]}
