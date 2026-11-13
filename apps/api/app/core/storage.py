import os
import shutil
from pathlib import Path
from .config import settings

_S3_CLIENT = None


def _get_s3_client():
    global _S3_CLIENT
    if _S3_CLIENT is None:
        import boto3
        endpoint = settings["s3_endpoint_url"] or None
        _S3_CLIENT = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=settings["s3_access_key_id"],
            aws_secret_access_key=settings["s3_secret_access_key"],
            region_name=settings["s3_region"],
        )
    return _S3_CLIENT


def upload_file(local_path: str, company_id: str, category: str = "media", filename: str | None = None) -> str:
    """Uploads a file to Cloudflare R2 / AWS S3 or saves locally based on STORAGE_DRIVER."""
    name = filename or Path(local_path).name
    key = f"{company_id}/{category}/{name}"
    driver = settings["storage_driver"]

    if driver in ("s3", "r2") and settings["s3_access_key_id"]:
        try:
            client = _get_s3_client()
            client.upload_file(local_path, settings["s3_bucket_name"], key)
            if settings["s3_public_url_prefix"]:
                return f"{settings['s3_public_url_prefix'].rstrip('/')}/{key}"
            return f"s3://{settings['s3_bucket_name']}/{key}"
        except Exception:
            pass

    local_dest = Path("storage") / company_id / category / name
    local_dest.parent.mkdir(parents=True, exist_ok=True)
    if os.path.abspath(local_path) != os.path.abspath(local_dest):
        shutil.copy2(local_path, local_dest)
    return f"/storage/{company_id}/{category}/{name}"


def upload_bytes(data: bytes, company_id: str, category: str = "media", filename: str = "file.bin", content_type: str = "application/octet-stream") -> str:
    """Uploads raw binary bytes to Cloudflare R2 / AWS S3 or saves locally."""
    key = f"{company_id}/{category}/{filename}"
    driver = settings["storage_driver"]

    if driver in ("s3", "r2") and settings["s3_access_key_id"]:
        try:
            client = _get_s3_client()
            client.put_object(Bucket=settings["s3_bucket_name"], Key=key, Body=data, ContentType=content_type)
            if settings["s3_public_url_prefix"]:
                return f"{settings['s3_public_url_prefix'].rstrip('/')}/{key}"
            return f"s3://{settings['s3_bucket_name']}/{key}"
        except Exception:
            pass

    local_dest = Path("storage") / company_id / category / filename
    local_dest.parent.mkdir(parents=True, exist_ok=True)
    with open(local_dest, "wb") as f:
        f.write(data)
    return f"/storage/{company_id}/{category}/{filename}"


def stream_file_upload(file_obj, company_id: str, category: str, filename: str) -> str:
    """Streams a file directly into R2 / S3 or disk in memory-efficient chunks."""
    key = f"{company_id}/{category}/{filename}"
    driver = settings["storage_driver"]
    if driver in ("s3", "r2") and settings["s3_access_key_id"]:
        try:
            client = _get_s3_client()
            client.upload_fileobj(file_obj, settings["s3_bucket_name"], key)
            if settings["s3_public_url_prefix"]:
                return f"{settings['s3_public_url_prefix'].rstrip('/')}/{key}"
            return f"s3://{settings['s3_bucket_name']}/{key}"
        except Exception:
            pass

    local_dest = Path("storage") / company_id / category / filename
    local_dest.parent.mkdir(parents=True, exist_ok=True)
    with open(local_dest, "wb") as buffer:
        shutil.copyfileobj(file_obj, buffer, length=64 * 1024)
    return f"/storage/{company_id}/{category}/{filename}"


def stream_file_chunks(local_path: str, chunk_size: int = 64 * 1024):
    """Yields binary chunks from disk for streaming HTTP download responses."""
    if os.path.exists(local_path):
        with open(local_path, "rb") as f:
            while chunk := f.read(chunk_size):
                yield chunk
