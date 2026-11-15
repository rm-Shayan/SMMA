import json
import uuid
from sqlalchemy import text
from ...core.db import SessionLocal
from ...core.security import create_token, hash_password, verify_password


def login(email: str, password: str | None = None) -> dict:
    if not email or not password:
        raise ValueError("Email and password are required")
    db = SessionLocal()
    try:
        row = db.execute(
            text('SELECT id, company_id, email, name, role, password_hash, status FROM "users" WHERE lower(email) = lower(:email)'),
            {"email": email.strip()},
        ).first()
        if not row:
            raise ValueError("Invalid credentials")
        user = dict(row._mapping)
        if user.get("status") and user["status"] != "active":
            raise ValueError("Account is suspended or deactivated")
        if not verify_password(password, user.get("password_hash")):
            raise ValueError("Invalid credentials")

        user_clean = {k: v for k, v in user.items() if k not in ("password_hash", "status")}
        token = create_token(user_clean)
        db.execute(
            text(
                'INSERT INTO "audit_logs" (id, company_id, user_id, action, entity, entity_id, meta, created_at) '
                "VALUES (:id, :c, :u, 'login', 'users', :u, :meta, NOW())"
            ),
            {"id": uuid.uuid4().hex, "c": user_clean["company_id"], "u": user_clean["id"], "meta": json.dumps({"email": email})},
        )
        db.commit()
        return {"token": token, "user": user_clean}
    finally:
        db.close()


def register_user(company_id: str, email: str, name: str, role: str, password: str | None = None) -> dict:
    if not password or len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    user_id = str(uuid.uuid4())
    p_hash = hash_password(password)
    db = SessionLocal()
    try:
        db.execute(
            text(
                'INSERT INTO "users" (id, company_id, email, name, role, password_hash, status, created_at) '
                "VALUES (:id, :c, :email, :name, :role, :phash, 'active', NOW())"
            ),
            {"id": user_id, "c": company_id, "email": email.strip().lower(), "name": name.strip(), "role": role, "phash": p_hash},
        )
        db.commit()
        return {"id": user_id, "company_id": company_id, "email": email, "name": name, "role": role}
    finally:
        db.close()
