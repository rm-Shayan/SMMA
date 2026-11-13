import time

from ..bootstrap import register_all
from .scheduler import MasterCronScheduler


def main() -> None:
    register_all()
    scheduler = MasterCronScheduler()
    print("Master Python Worker started: Outbox Pacing, Social Scheduler, Dynamic DB Crons, Daily Brief & Analytics")
    while True:
        try:
            results = scheduler.tick()
            active_events = {k: v for k, v in results.items() if v}
            if active_events:
                print(f"[Worker Tick] {active_events}")
        except Exception as exc:
            print(f"[Worker Error] {exc}")
        time.sleep(10)


if __name__ == "__main__":
    main()
