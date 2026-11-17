import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.db import engine

BASE_DIR = Path(__file__).resolve().parents[1]
DOCS_ERD = Path(__file__).resolve().parents[2] / "docs" / "ERD.sql"
ROOT_ERD = Path(__file__).resolve().parents[2] / "ERD.sql"
MIGRATIONS_DIR = BASE_DIR / "migrations"


def main() -> int:
    raw = engine.raw_connection()
    try:
        erd_path = DOCS_ERD if DOCS_ERD.exists() else ROOT_ERD
        if erd_path.exists():
            raw.exec_driver_sql(erd_path.read_text(encoding="utf-8"))
            print(f"Migrated {erd_path.name} against the configured database")

        if MIGRATIONS_DIR.exists():
            for sql_file in sorted(MIGRATIONS_DIR.glob("*.sql")):
                raw.exec_driver_sql(sql_file.read_text(encoding="utf-8"))
                print(f"Applied migration: {sql_file.name}")

        return 0
    finally:
        raw.close()


if __name__ == "__main__":
    raise SystemExit(main())
