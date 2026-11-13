from datetime import datetime
from .analytics_cron import run_daily_briefs, run_nightly_analytics
from .dynamic_cron import dispatch_db_schedules
from .maintenance_cron import check_low_credit_wallets, cleanup_stale_jobs
from .pacing import process_outbox
from .social_cron import publish_scheduled_posts


class MasterCronScheduler:
    def __init__(self):
        self.last_brief_date = None
        self.last_analytics_date = None
        self.last_maintenance_time = None

    def tick(self) -> dict:
        results = {}
        now = datetime.now()

        # 1. Continuous Pacing Loop (Every tick)
        try:
            results["outboxDispatched"] = process_outbox(limit=10)
        except Exception as exc:
            results["outboxError"] = str(exc)

        # 2. Scheduled Social Media Auto-Publisher
        try:
            results["socialPublished"] = publish_scheduled_posts(limit=10)
        except Exception as exc:
            results["socialError"] = str(exc)

        # 3. Dynamic User DB Schedules Dispatcher
        try:
            results["schedulesDispatched"] = dispatch_db_schedules(limit=5)
        except Exception as exc:
            results["schedulesError"] = str(exc)

        # 4. Periodic Maintenance (Every 10 minutes)
        if not self.last_maintenance_time or (now - self.last_maintenance_time).total_seconds() >= 600:
            try:
                results["staleCleanup"] = cleanup_stale_jobs()
                results["lowCreditAlerts"] = check_low_credit_wallets()
                self.last_maintenance_time = now
            except Exception as exc:
                results["maintenanceError"] = str(exc)

        # 5. Daily 09:00 AM Cron (Agent #5 Daily Brief)
        if now.hour == 9 and self.last_brief_date != now.date():
            try:
                results["dailyBriefsCreated"] = run_daily_briefs()
                self.last_brief_date = now.date()
            except Exception as exc:
                results["dailyBriefError"] = str(exc)

        # 6. Midnight 00:00 Cron (Agent #4 Analytics Snapshot)
        if now.hour == 0 and self.last_analytics_date != now.date():
            try:
                results["nightlyAnalyticsCreated"] = run_nightly_analytics()
                self.last_analytics_date = now.date()
            except Exception as exc:
                results["nightlyAnalyticsError"] = str(exc)

        return results

