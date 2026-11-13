from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, Session, sessionmaker

from .config import settings

engine = create_engine(settings["database_url"], pool_pre_ping=True, pool_size=10)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
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
    result = db.execute(text(sql), params or {})
    rows = [dict(row._mapping) for row in result] if result.returns_rows else []
    db.commit()
    return rows


def scalar(db: Session, sql: str, params: dict | None = None):
    result = db.execute(text(sql), params or {})
    if not result.returns_rows:
        db.commit()
        return None
    row = result.first()
    db.commit()
    return None if row is None else row[0]
