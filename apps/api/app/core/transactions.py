from contextlib import contextmanager
from typing import Generator
from sqlalchemy import text
from sqlalchemy.orm import Session

@contextmanager
def atomic_wallet_transaction(db: Session, wallet_id: str) -> Generator[dict, None, None]:
    """
    ACID Transaction Context Manager with Pessimistic Row-Level Locking.
    Guarantees zero race conditions during credit reservation or deduction.
    """
    try:
        # SELECT ... FOR UPDATE locks the wallet row in PostgreSQL until commit/rollback
        row = db.execute(
            text('SELECT id, company_id, user_id, balance, reserved FROM "credit_wallets" WHERE id = :id FOR UPDATE'),
            {"id": wallet_id},
        ).first()

        if not row:
            raise ValueError(f"Wallet {wallet_id} not found")

        wallet_data = dict(row._mapping)
        yield wallet_data
        db.commit()
    except Exception:
        db.rollback()
        raise

