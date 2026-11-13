import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

ROOT_ENV = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(ROOT_ENV)
load_dotenv()


@lru_cache
def get_settings() -> dict:
    return {
        "database_url": os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/styre_db"),
        "jwt_secret": os.getenv("JWT_SECRET", "styre_secret_key_2026"),
        "groq_api_key": os.getenv("GROQ_API_KEY"),
        "groq_model": os.getenv("GROQ_MODEL", "qwen-2.5-32b"),
        "use_local_llm": os.getenv("USE_LOCAL_LLM", "false").lower() == "true",
        "local_llm_url": os.getenv("LOCAL_LLM_URL", "http://localhost:11434/v1"),
        "local_llm_model": os.getenv("LOCAL_LLM_MODEL", "qwen2.5:7b"),
        "enable_stripe": os.getenv("ENABLE_STRIPE", "false").lower() == "true",
        "stripe_secret_key": os.getenv("STRIPE_SECRET_KEY", ""),
        "stripe_webhook_secret": os.getenv("STRIPE_WEBHOOK_SECRET", ""),
        "stripe_success_url": os.getenv("STRIPE_SUCCESS_URL", "http://localhost:3000/billing?status=success"),
        "stripe_cancel_url": os.getenv("STRIPE_CANCEL_URL", "http://localhost:3000/billing?status=cancelled"),
        "smtp_host": os.getenv("SMTP_HOST"),
        "smtp_port": int(os.getenv("SMTP_PORT", "587")),
        "smtp_user": os.getenv("SMTP_MAIL"),
        "smtp_pass": os.getenv("SMTP_PASS"),
        "smtp_from": os.getenv("SMTP_FROM"),
        "storage_driver": os.getenv("STORAGE_DRIVER", "local").lower(),
        "s3_endpoint_url": os.getenv("S3_ENDPOINT_URL", ""),
        "s3_bucket_name": os.getenv("S3_BUCKET_NAME", "styre-storage"),
        "s3_access_key_id": os.getenv("S3_ACCESS_KEY_ID", ""),
        "s3_secret_access_key": os.getenv("S3_SECRET_ACCESS_KEY", ""),
        "s3_public_url_prefix": os.getenv("S3_PUBLIC_URL_PREFIX", ""),
        "s3_region": os.getenv("S3_REGION", "auto"),
        "report_dir": os.getenv("REPORT_DIR", "generated"),
        "rag_threshold": float(os.getenv("RAG_CONFIDENCE_THRESHOLD", "0.2")),
        "redis_url": os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    }


settings = get_settings()
