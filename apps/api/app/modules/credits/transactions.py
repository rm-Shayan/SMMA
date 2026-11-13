import uuid
from sqlalchemy import text
from sqlalchemy.orm import Session


def get_wallet_by_id(db: Session, wallet_id: str) -> dict:
    row = db.execute(
        text('SELECT id, company_id, user_id, balance, reserved FROM "credit_wallets" WHERE id = :id'),
        {"id": wallet_id},
    ).first()
    if row is None:
        raise ValueError("Wallet not found")
    mapping = dict(row._mapping)
    mapping["available"] = mapping["balance"] - mapping["reserved"]
    return mapping


def get_company_wallet_record(db: Session, company_id: str) -> dict | None:
    row = db.execute(
        text(
            'SELECT id, company_id, user_id, balance, reserved FROM "credit_wallets" '
            'WHERE company_id = :company_id AND user_id IS NULL'
        ),
        {"company_id": company_id},
    ).first()
    if row is None:
        return None
    wallet = dict(row._mapping)
    wallet["available"] = wallet["balance"] - wallet["reserved"]
    return wallet


def record_tx(
    db: Session,
    wallet_id: str,
    counter_id: str | None,
    kind: str,
    amount: int,
    created_by: str | None,
    note: str,
) -> None:
    db.execute(
        text(
            """
            INSERT INTO "credit_transactions"
            (id, wallet_id, counter_wallet_id, type, amount, created_by, note, created_at)
            VALUES (:id, :wallet_id, :counter_wallet_id, :type, :amount, :created_by, :note, NOW())
            """
        ),
        {
            "id": str(uuid.uuid4()),
            "wallet_id": wallet_id,
            "counter_wallet_id": counter_id,
            "type": kind,
            "amount": amount,
            "created_by": created_by,
            "note": note,
        },
    )

