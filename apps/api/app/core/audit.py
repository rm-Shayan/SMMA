import json
import uuid

from sqlalchemy import text
from sqlalchemy.orm import Session


def record(
    db: Session,
    company_id: str | None,
    user_id: str | None,
    action: str,
    entity: str,
    entity_id: str | None = None,
    meta: dict | None = None,
) -> None:
    try:
        db.execute(
            text(
                """
                INSERT INTO "audit_logs" (id, company_id, user_id, action, entity, entity_id, meta, created_at)
                VALUES (:id, :company_id, :user_id, :action, :entity, :entity_id, :meta, NOW())
                """
            ),
            {
                "id": str(uuid.uuid4()),
                "company_id": company_id,
                "user_id": user_id,
                "action": action,
                "entity": entity,
                "entity_id": entity_id,
                "meta": json.dumps(meta or {}),
            },
        )
        db.commit()
    except Exception:
        db.rollback()
