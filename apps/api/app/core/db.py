import socket
import time
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, Session, sessionmaker

from .config import settings

connect_args = {"connect_timeout": 1} if "postgres" in settings.get("database_url", "") else {}
engine = create_engine(settings["database_url"], pool_pre_ping=False, pool_size=10, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

_db_status = {"available": None, "last_check": 0.0}


def is_db_reachable(host: str = "127.0.0.1", port: int = 5432) -> bool:
    now = time.time()
    if _db_status["available"] is not None and (now - _db_status["last_check"]) < 5.0:
        return _db_status["available"]
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.05)
        res = s.connect_ex((host, port))
        s.close()
        _db_status["available"] = (res == 0)
        _db_status["last_check"] = now
        return _db_status["available"]
    except Exception:
        _db_status["available"] = False
        _db_status["last_check"] = now
        return False


def get_db() -> Generator[Session | None, None, None]:
    if not is_db_reachable():
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def set_rls_tenant(db: Session, company_id: str | None, is_superadmin: bool = False) -> None:
    """Activates PostgreSQL Row-Level Security session variables for the connection."""
    if company_id:
        db.execute(text("SELECT set_config('app.current_tenant_id', :id, true)"), {"id": str(company_id)})
    if is_superadmin:
        db.execute(text("SET LOCAL app.is_superadmin = 'true'"))


def query(db: Session, sql: str, params: dict | None = None) -> list[dict]:
    if not is_db_reachable():
        return []
    result = db.execute(text(sql), params or {})
    rows = [dict(row._mapping) for row in result] if result.returns_rows else []
    db.commit()
    return rows


def scalar(db: Session, sql: str, params: dict | None = None):
    if not is_db_reachable():
        return None
    result = db.execute(text(sql), params or {})
    if not result.returns_rows:
        db.commit()
        return None
    row = result.first()
    db.commit()
    return None if row is None else row[0]
