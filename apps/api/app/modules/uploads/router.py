import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant

router = APIRouter()
ROOT = Path(__file__).resolve().parents[3] / "storage"

MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB
ALLOWED_EXTENSIONS = {
    ".pdf", ".png", ".jpg", ".jpeg", ".webp",
    ".csv", ".docx", ".xlsx", ".json", ".txt",
    ".mp4", ".mp3", ".wav",
}


@router.post("/upload")
async def upload(file: UploadFile = File(...), tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    safe_name = file.filename.replace("/", "_").replace("\\", "_")
    ext = Path(safe_name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Allowed: {sorted(list(ALLOWED_EXTENSIONS))}")

    # Stream read with size limit enforcement
    content = bytearray()
    chunk_size = 1024 * 1024  # 1MB chunks
    while chunk := await file.read(chunk_size):
        content.extend(chunk)
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File size exceeds maximum allowed limit of 15MB")

    folder = ROOT / tenant.company_id
    folder.mkdir(parents=True, exist_ok=True)
    file_id = str(uuid.uuid4())
    path = folder / f"{file_id}_{safe_name}"
    path.write_bytes(content)

    db.execute(
        text(
            'INSERT INTO "generated_files" (id, company_id, user_id, agent_run_id, file_name, storage_path, created_at) '
            "VALUES (:id, :c, :u, NULL, :name, :path, NOW())"
        ),
        {"id": file_id, "c": tenant.company_id, "u": tenant.user_id, "name": safe_name, "path": str(path)},
    )
    db.commit()
    return {"success": True, "fileId": file_id, "fileName": safe_name, "size": len(content)}


@router.get("/files/{file_id}")
def download(file_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(
        text('SELECT file_name, storage_path FROM "generated_files" WHERE id = :id AND company_id = :c'),
        {"id": file_id, "c": tenant.company_id},
    ).first()
    if not row or not Path(row[1]).exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(row[1], filename=row[0])
