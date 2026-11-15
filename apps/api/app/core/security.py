import base64
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import os
from cryptography.fernet import Fernet
import jwt
from .config import settings

ITERATIONS = 100_000


def _get_cipher() -> Fernet:
    key_bytes = hashlib.sha256(settings["jwt_secret"].encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(key_bytes))


def encrypt_token(plain_token: str | None) -> str:
    if not plain_token:
        return ""
    return _get_cipher().encrypt(plain_token.encode("utf-8")).decode("utf-8")


def decrypt_token(encrypted_or_plain: str | None) -> str:
    if not encrypted_or_plain:
        return ""
    try:
        return _get_cipher().decrypt(encrypted_or_plain.encode("utf-8")).decode("utf-8")
    except Exception:
        return encrypted_or_plain


def sign_token(data: str) -> str:
    sig = hmac.new(settings["jwt_secret"].encode("utf-8"), data.encode("utf-8"), hashlib.sha256).hexdigest()[:16]
    raw = f"{data}::{sig}".encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def verify_signed_token(token_str: str) -> str | None:
    try:
        pad = "=" * (-len(token_str) % 4)
        raw = base64.urlsafe_b64decode(f"{token_str}{pad}").decode("utf-8")
        if "::" not in raw:
            return None
        data, sig = raw.rsplit("::", 1)
        expected = hmac.new(settings["jwt_secret"].encode("utf-8"), data.encode("utf-8"), hashlib.sha256).hexdigest()[:16]
        return data if hmac.compare_digest(sig, expected) else None
    except Exception:
        return None


def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), ITERATIONS)
    return f"pbkdf2_sha256${ITERATIONS}${salt}${key.hex()}"


def verify_password(password: str | None, stored_hash: str | None) -> bool:
    if not password or not stored_hash:
        return False
    try:
        parts = stored_hash.split("$")
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        iterations, salt, expected_key = int(parts[1]), parts[2], parts[3]
        key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
        return hmac.compare_digest(key.hex(), expected_key)
    except Exception:
        return False


def create_token(user: dict) -> str:
    payload = {
        "userId": str(user["id"]),
        "companyId": str(user.get("company_id") or ""),
        "role": user.get("role", "employee"),
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, settings["jwt_secret"], algorithm="HS256")


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings["jwt_secret"], algorithms=["HS256"])
    except Exception:
        return None


decode_token = decode_access_token
