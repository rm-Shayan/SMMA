import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.db import engine

ERD = Path(__file__).resolve().parents[2] / "ERD.sql"


def main() -> int:
    sql = ERD.read_text(encoding="utf-8")
    raw = engine.raw_connection()
    try:
        raw.exec_driver_sql(sql)
        print(f"Migrated {ERD.name} against the configured database")
        return 0
    finally:
        raw.close()


if __name__ == "__main__":
    raise SystemExit(main())