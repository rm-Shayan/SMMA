import json
import uuid
from datetime import datetime, timedelta, timezone
import jwt
from sqlalchemy import text

from ...core.config import settings
from ...core.db import SessionLocal


def create_token(user: dict) -> str:
    payload = {
        "userId": user["id"],
        "companyId": user.get("company_id"),
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, settings["jwt_secret"], algorithm="HS256")


def login(email: str) -> dict:
    db = SessionLocal()
    try:
        row = db.execute(
            text('SELECT id, company_id, email, name, role FROM "users" WHERE email = :email'),
            {"email": email},
        ).first()
        if not row:
            raise ValueError("Invalid credentials")
        user = dict(row._mapping)
        token = create_token(user)
        db.execute(
            text(
                """
                INSERT INTO "audit_logs" (id, company_id, user_id, action, entity, entity_id, meta, created_at)
                VALUES (:id, :c, :u, 'login', 'users', :u, :meta, NOW())
                """
            ),
            {"id": uuid.uuid4().hex, "c": user["company_id"], "u": user["id"], "meta": json.dumps({"email": email})},
        )
        db.commit()
        return {"token": token, "user": user}
    finally:
        db.close()


def register_user(company_id: str, email: str, name: str, role: str) -> dict:
    user_id = str(uuid.uuid4())
    db = SessionLocal()
    try:
        db.execute(
            text(
                """
                INSERT INTO "users" (id, company_id, email, name, role, status, created_at)
                VALUES (:id, :c, :email, :name, :role, 'active', NOW())
                """
            ),
            {"id": user_id, "c": company_id, "email": email, "name": name, "role": role},
        )
        db.commit()
        return {"id": user_id, "company_id": company_id, "email": email, "name": name, "role": role}
    finally:
        db.close()

