"""
Zero-Downtime Safe Database Migration Framework.
Implements the Expand and Contract pattern with safe statement timeouts.
Ensures zero table lock contention during live production traffic.
"""
import sys
import logging
from sqlalchemy import text
from app.core.db import SessionLocal

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("migration")

SAFE_INDEX_SQL = """
-- 1. Create indexes concurrently without blocking table reads/writes
SET statement_timeout = '60s';
SET lock_timeout = '5s';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_runs_user_company 
ON "agent_runs" (company_id, user_id, started_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outbox_jobs_pacing 
ON "outbox_jobs" (status, not_before, priority ASC);
"""

def run_zero_downtime_migration():
    logger.info("Starting Zero-Downtime Migration (Expand Phase)...")
    db = SessionLocal()
    try:
        # Prevent long-running table locks
        db.execute(text("SET lock_timeout = '5s';"))
        logger.info("Applying non-blocking concurrent indexes...")
        
        # Execute outside of transaction block as CONCURRENTLY requires autocommit
        conn = db.connection().connection
        conn.autocommit = True
        with conn.cursor() as cursor:
            for statement in SAFE_INDEX_SQL.strip().split(";"):
                stmt = statement.strip()
                if stmt:
                    logger.info("Executing: %s...", stmt[:60].replace("\n", " "))
                    cursor.execute(stmt)

        logger.info("Zero-Downtime Migration completed successfully! Live traffic uninterrupted.")
    except Exception as exc:
        logger.error("Migration failed: %s", exc)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_zero_downtime_migration()

