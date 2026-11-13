from sqlalchemy import text

from ..core.db import SessionLocal
from ..core.types import AgentContext
from ..modules.credits import ledger
from ..modules.orchestration.analytics import AnalyticsAgent
from ..modules.orchestration.daily_brief import DailyBriefAgent

BRIEF = DailyBriefAgent()
ANALYTICS = AnalyticsAgent()


def run_daily_briefs() -> int:
    db = SessionLocal()
    created = 0
    try:
        companies = db.execute(text('SELECT id FROM "companies" WHERE status = \'active\' OR status IS NULL')).all()
        for row in companies:
            wallet = ledger.get_company_wallet(db, str(row[0]))
            if not wallet or wallet["available"] < 1:
                continue
            result = BRIEF.execute(
                AgentContext(str(row[0]), None, wallet["id"], 5, "a0000000-0000-0000-0000-000000000005", "auto"),
                {},
            )
            if result.success:
                created += 1
    finally:
        db.close()
    return created


def run_nightly_analytics() -> int:
    db = SessionLocal()
    created = 0
    try:
        companies = db.execute(text('SELECT id FROM "companies" WHERE status = \'active\' OR status IS NULL')).all()
        for row in companies:
            wallet = ledger.get_company_wallet(db, str(row[0]))
            if not wallet or wallet["available"] < 2:
                continue
            result = ANALYTICS.execute(
                AgentContext(str(row[0]), None, wallet["id"], 4, "a0000000-0000-0000-0000-000000000004", "auto"),
                {"scope": "company_overview", "period": "24h"},
            )
            if result.success:
                created += 1
    finally:
        db.close()
    return created

