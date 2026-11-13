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


@router.post("/upload")
async def upload(file: UploadFile = File(...), tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    folder = ROOT / tenant.company_id
    folder.mkdir(parents=True, exist_ok=True)
    file_id = str(uuid.uuid4())
    safe_name = file.filename.replace("/", "_").replace("\\", "_")
    path = folder / f"{file_id}_{safe_name}"
    path.write_bytes(await file.read())
    db.execute(
        text(
            'INSERT INTO "generated_files" (id, company_id, user_id, agent_run_id, file_name, storage_path, created_at) '
            "VALUES (:id, :c, :u, NULL, :name, :path, NOW())"
        ),
        {"id": file_id, "c": tenant.company_id, "u": tenant.user_id, "name": safe_name, "path": str(path)},
    )
    db.commit()
    return {"success": True, "fileId": file_id, "fileName": safe_name, "size": path.stat().st_size}


@router.get("/files/{file_id}")
def download(file_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(
        text('SELECT file_name, storage_path FROM "generated_files" WHERE id = :id AND company_id = :c'),
        {"id": file_id, "c": tenant.company_id},
    ).first()
    if not row or not Path(row[1]).exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(row[1], filename=row[0])