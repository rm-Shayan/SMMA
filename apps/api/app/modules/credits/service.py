import uuid
from sqlalchemy import text
from sqlalchemy.orm import Session

from .transactions import get_company_wallet_record, get_wallet_by_id, record_tx

get_wallet = get_wallet_by_id
get_company_wallet = get_company_wallet_record


def purchase(db: Session, company_id: str, amount: int, created_by: str | None = None, note: str = "Credits purchased") -> dict:
    if amount <= 0:
        raise ValueError("Purchase amount must be positive")
    row = db.execute(
        text('SELECT id FROM "credit_wallets" WHERE company_id = :company_id AND user_id IS NULL FOR UPDATE'),
        {"company_id": company_id},
    ).first()
    if row:
        wallet_id = row[0]
        db.execute(text('UPDATE "credit_wallets" SET balance = balance + :amount WHERE id = :id'), {"amount": amount, "id": wallet_id})
    else:
        wallet_id = str(uuid.uuid4())
        db.execute(
            text('INSERT INTO "credit_wallets" (id, company_id, user_id, balance, reserved) VALUES (:id, :company_id, NULL, :amount, 0)'),
            {"id": wallet_id, "company_id": company_id, "amount": amount},
        )
    record_tx(db, wallet_id, None, "purchase", amount, created_by, note)
    db.commit()
    return get_wallet(db, wallet_id)


def grant(db: Session, company_id: str, amount: int, created_by: str | None = None, note: str = "SuperAdmin grant") -> dict:
    return purchase(db, company_id, amount, created_by, note)


def allocate(db: Session, company_id: str, to_user_id: str, amount: int, allocated_by: str | None = None) -> dict:
    if amount <= 0:
        raise ValueError("Allocation amount must be positive")
    company = db.execute(
        text('SELECT id, balance, reserved FROM "credit_wallets" WHERE company_id = :company_id AND user_id IS NULL FOR UPDATE'),
        {"company_id": company_id},
    ).first()
    if company is None or company.balance - company.reserved < amount:
        raise ValueError("Insufficient company credits" if company else "Company wallet not found")

    user = db.execute(
        text('SELECT id FROM "credit_wallets" WHERE company_id = :company_id AND user_id = :user_id FOR UPDATE'),
        {"company_id": company_id, "user_id": to_user_id},
    ).first()
    if user:
        user_wallet_id = user[0]
        db.execute(text('UPDATE "credit_wallets" SET balance = balance + :amount WHERE id = :id'), {"amount": amount, "id": user_wallet_id})
    else:
        user_wallet_id = str(uuid.uuid4())
        db.execute(
            text('INSERT INTO "credit_wallets" (id, company_id, user_id, balance, reserved) VALUES (:id, :company_id, :user_id, :amount, 0)'),
            {"id": user_wallet_id, "company_id": company_id, "user_id": to_user_id, "amount": amount},
        )
    db.execute(text('UPDATE "credit_wallets" SET balance = balance - :amount WHERE id = :id'), {"amount": amount, "id": company.id})
    record_tx(db, company.id, user_wallet_id, "allocate", -amount, allocated_by, "Allocated to employee")
    record_tx(db, user_wallet_id, company.id, "allocate", amount, allocated_by, "Received from company")
    db.commit()
    return {"companyWallet": get_wallet(db, company.id), "userWallet": get_wallet(db, user_wallet_id)}


def revoke(db: Session, company_id: str, from_user_id: str, amount: int, revoked_by: str | None = None, note: str = "Revoked back to company pool") -> dict:
    if amount <= 0:
        raise ValueError("Revoke amount must be positive")
    user = db.execute(
        text('SELECT id, balance, reserved FROM "credit_wallets" WHERE company_id = :company_id AND user_id = :user_id FOR UPDATE'),
        {"company_id": company_id, "user_id": from_user_id},
    ).first()
    if user is None or user.balance - user.reserved < amount:
        raise ValueError("Cannot revoke more than available credits" if user else "Employee wallet not found")

    company = db.execute(
        text('SELECT id FROM "credit_wallets" WHERE company_id = :company_id AND user_id IS NULL FOR UPDATE'),
        {"company_id": company_id},
    ).first()
    if company is None:
        raise ValueError("Company wallet not found")
    db.execute(text('UPDATE "credit_wallets" SET balance = balance - :amount WHERE id = :id'), {"amount": amount, "id": user.id})
    db.execute(text('UPDATE "credit_wallets" SET balance = balance + :amount WHERE id = :id'), {"amount": amount, "id": company.id})
    record_tx(db, user.id, company.id, "revoke", -amount, revoked_by, note)
    record_tx(db, company.id, user.id, "revoke", amount, revoked_by, note)
    db.commit()
    return {"companyWallet": get_wallet(db, company.id), "userWallet": get_wallet(db, user.id)}


def reserve(db: Session, wallet_id: str, amount: int, run_id: str | None = None, task_id: str | None = None) -> dict:
    if amount <= 0:
        raise ValueError("Reservation amount must be positive")
    row = db.execute(text('SELECT balance, reserved FROM "credit_wallets" WHERE id = :id FOR UPDATE'), {"id": wallet_id}).first()
    if row is None or row.balance - row.reserved < amount:
        raise ValueError("Insufficient available credits" if row else "Wallet not found")
    db.execute(text('UPDATE "credit_wallets" SET reserved = reserved + :amount WHERE id = :id'), {"amount": amount, "id": wallet_id})
    record_tx(db, wallet_id, None, "reserve", -amount, None, "Agent reservation")
    db.commit()
    return get_wallet(db, wallet_id)


def consume(db: Session, wallet_id: str, actual: int, reserved: int, run_id: str | None = None, task_id: str | None = None) -> dict:
    db.execute(text('UPDATE "credit_wallets" SET reserved = GREATEST(reserved - :reserved, 0) WHERE id = :id'), {"reserved": reserved, "id": wallet_id})
    record_tx(db, wallet_id, None, "release", reserved, None, "Release unused reservation")
    if actual > 0:
        db.execute(text('UPDATE "credit_wallets" SET balance = balance - :actual WHERE id = :id'), {"actual": actual, "id": wallet_id})
        record_tx(db, wallet_id, None, "consume", -actual, None, "Agent execution")
    db.commit()
    return get_wallet(db, wallet_id)


def release(db: Session, wallet_id: str, reserved: int, run_id: str | None = None, task_id: str | None = None) -> dict:
    db.execute(text('UPDATE "credit_wallets" SET reserved = GREATEST(reserved - :reserved, 0) WHERE id = :id'), {"reserved": reserved, "id": wallet_id})
    record_tx(db, wallet_id, None, "release", reserved, None, "Released on failure")
    db.commit()
    return get_wallet(db, wallet_id)

