import logging
import uuid
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.pubsub import publish_event_sync
from .transactions import get_company_wallet_record, get_wallet_by_id, record_tx

logger = logging.getLogger("credits-realtime")
get_wallet = get_wallet_by_id
get_company_wallet = get_company_wallet_record


def emit_wallet(db: Session, wallet_id: str) -> None:
    try:
        w = get_wallet(db, wallet_id)
        publish_event_sync(w["company_id"], "wallet.updated", {
            "walletId": str(w["id"]), "userId": str(w["user_id"]) if w.get("user_id") else None,
            "balance": w["balance"], "reserved": w["reserved"], "available": w["balance"] - w["reserved"],
        }, "credits")
    except Exception as exc:
        logger.warning("wallet.updated publish failed: %s", exc)


def purchase(db: Session, company_id: str, amount: int, created_by: str | None = None, note: str = "Credits purchased") -> dict:
    if amount <= 0:
        raise ValueError("Purchase amount must be positive")
    row = db.execute(text('SELECT id FROM "credit_wallets" WHERE company_id = :c AND user_id IS NULL FOR UPDATE'), {"c": company_id}).first()
    if row:
        wallet_id = row[0]
        db.execute(text('UPDATE "credit_wallets" SET balance = balance + :amount WHERE id = :id'), {"amount": amount, "id": wallet_id})
    else:
        wallet_id = str(uuid.uuid4())
        db.execute(text('INSERT INTO "credit_wallets" (id, company_id, user_id, balance, reserved) VALUES (:id, :c, NULL, :a, 0)'), {"id": wallet_id, "c": company_id, "a": amount})
    record_tx(db, wallet_id, None, "purchase", amount, created_by, note)
    db.commit()
    emit_wallet(db, wallet_id)
    return get_wallet(db, wallet_id)


def grant(db: Session, company_id: str, amount: int, created_by: str | None = None, note: str = "SuperAdmin grant") -> dict:
    return purchase(db, company_id, amount, created_by, note)


def allocate(db: Session, company_id: str, to_user_id: str, amount: int, allocated_by: str | None = None) -> dict:
    if amount <= 0:
        raise ValueError("Allocation amount must be positive")
    c_wal = db.execute(text('SELECT id, balance, reserved FROM "credit_wallets" WHERE company_id = :c AND user_id IS NULL FOR UPDATE'), {"c": company_id}).first()
    if not c_wal or c_wal.balance - c_wal.reserved < amount:
        raise ValueError("Insufficient company credits" if c_wal else "Company wallet not found")
    u_wal = db.execute(text('SELECT id FROM "credit_wallets" WHERE company_id = :c AND user_id = :u FOR UPDATE'), {"c": company_id, "u": to_user_id}).first()
    u_id = u_wal[0] if u_wal else str(uuid.uuid4())
    if u_wal:
        db.execute(text('UPDATE "credit_wallets" SET balance = balance + :amount WHERE id = :id'), {"amount": amount, "id": u_id})
    else:
        db.execute(text('INSERT INTO "credit_wallets" (id, company_id, user_id, balance, reserved) VALUES (:id, :c, :u, :a, 0)'), {"id": u_id, "c": company_id, "u": to_user_id, "a": amount})
    db.execute(text('UPDATE "credit_wallets" SET balance = balance - :amount WHERE id = :id'), {"amount": amount, "id": c_wal.id})
    record_tx(db, c_wal.id, u_id, "allocate", -amount, allocated_by, "Allocated to employee")
    record_tx(db, u_id, c_wal.id, "allocate", amount, allocated_by, "Received from company")
    db.commit()
    emit_wallet(db, c_wal.id); emit_wallet(db, u_id)
    return {"companyWallet": get_wallet(db, c_wal.id), "userWallet": get_wallet(db, u_id)}


def revoke(db: Session, company_id: str, from_user_id: str, amount: int, revoked_by: str | None = None, note: str = "Revoked back to pool") -> dict:
    if amount <= 0:
        raise ValueError("Revoke amount must be positive")
    u_wal = db.execute(text('SELECT id, balance, reserved FROM "credit_wallets" WHERE company_id = :c AND user_id = :u FOR UPDATE'), {"c": company_id, "u": from_user_id}).first()
    if not u_wal or u_wal.balance - u_wal.reserved < amount:
        raise ValueError("Cannot revoke more than available credits" if u_wal else "Employee wallet not found")
    c_wal = db.execute(text('SELECT id FROM "credit_wallets" WHERE company_id = :c AND user_id IS NULL FOR UPDATE'), {"c": company_id}).first()
    if not c_wal:
        raise ValueError("Company wallet not found")
    db.execute(text('UPDATE "credit_wallets" SET balance = balance - :amount WHERE id = :id'), {"amount": amount, "id": u_wal.id})
    db.execute(text('UPDATE "credit_wallets" SET balance = balance + :amount WHERE id = :id'), {"amount": amount, "id": c_wal.id})
    record_tx(db, u_wal.id, c_wal.id, "revoke", -amount, revoked_by, note)
    record_tx(db, c_wal.id, u_wal.id, "revoke", amount, revoked_by, note)
    db.commit()
    emit_wallet(db, c_wal.id); emit_wallet(db, u_wal.id)
    return {"companyWallet": get_wallet(db, c_wal.id), "userWallet": get_wallet(db, u_wal.id)}


def reserve(db: Session, wallet_id: str, amount: int, run_id: str | None = None, task_id: str | None = None) -> dict:
    if amount <= 0:
        raise ValueError("Reservation amount must be positive")
    row = db.execute(text('SELECT balance, reserved FROM "credit_wallets" WHERE id = :id FOR UPDATE'), {"id": wallet_id}).first()
    if not row or row.balance - row.reserved < amount:
        raise ValueError("Insufficient available credits" if row else "Wallet not found")
    db.execute(text('UPDATE "credit_wallets" SET reserved = reserved + :amount WHERE id = :id'), {"amount": amount, "id": wallet_id})
    record_tx(db, wallet_id, None, "reserve", -amount, None, "Agent reservation")
    db.commit()
    emit_wallet(db, wallet_id)
    return get_wallet(db, wallet_id)


def consume(db: Session, wallet_id: str, actual: int, reserved: int, run_id: str | None = None, task_id: str | None = None) -> dict:
    db.execute(text('UPDATE "credit_wallets" SET reserved = GREATEST(reserved - :r, 0) WHERE id = :id'), {"r": reserved, "id": wallet_id})
    record_tx(db, wallet_id, None, "release", reserved, None, "Release unused reservation")
    if actual > 0:
        db.execute(text('UPDATE "credit_wallets" SET balance = balance - :a WHERE id = :id'), {"a": actual, "id": wallet_id})
        record_tx(db, wallet_id, None, "consume", -actual, None, "Agent execution")
    db.commit()
    emit_wallet(db, wallet_id)
    return get_wallet(db, wallet_id)


def release(db: Session, wallet_id: str, reserved: int, run_id: str | None = None, task_id: str | None = None) -> dict:
    db.execute(text('UPDATE "credit_wallets" SET reserved = GREATEST(reserved - :r, 0) WHERE id = :id'), {"r": reserved, "id": wallet_id})
    record_tx(db, wallet_id, None, "release", reserved, None, "Released on failure")
    db.commit()
    emit_wallet(db, wallet_id)
    return get_wallet(db, wallet_id)
