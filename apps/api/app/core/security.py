import hashlib
from datetime import datetime, timedelta

import jwt

from .config import settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    salt = settings["jwt_secret"][:16]
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password


def create_token(
    user_id: str,
    company_id: str,
    role: str,
    expires_in_hours: int = 24,
) -> str:
    payload = {
        "sub": user_id,
        "company_id": company_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=expires_in_hours),
    }
    return jwt.encode(payload, settings["jwt_secret"], algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings["jwt_secret"], algorithms=[ALGORITHM])
    except Exception as exc:
        raise ValueError("Invalid or expired token") from exc

