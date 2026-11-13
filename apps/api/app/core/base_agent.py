import json
import re
import uuid

from sqlalchemy import text

from ..modules.credits import ledger
from .audit import record
from .db import SessionLocal, set_rls_tenant
from .types import AgentContext, AgentResult, RunResult

UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)


def nullable_user_id(user_id: str | None) -> str | None:
    return user_id if user_id and UUID_RE.match(user_id) else None


class BaseAgent:
    id: int = 0
    code: str = ""
    name: str = ""
    default_mode: str = "draft"

    def estimate_credits(self, input_data: dict) -> int:
        return 1

    def plan(self, context: AgentContext, input_data: dict) -> list[str]:
        return []

    def execute(self, context: AgentContext, input_data: dict) -> AgentResult:
        db = SessionLocal()
        estimated = self.estimate_credits(input_data)
        run_id = str(uuid.uuid4())
        reserved, reserved_flag = 0, False

        try:
            set_rls_tenant(db, context.company_id)
            db.execute(
                text(
                    """
                    INSERT INTO "agent_runs"
                    (id, company_id, task_id, agent_action_id, user_id, status, credits_used, cost_usd, input, started_at)
                    VALUES (:id, :company_id, :task_id, :agent_action_id, :user_id, 'queued', 0, 0, :input, NOW())
                    """
                ),
                {
                    "id": run_id, "company_id": context.company_id, "task_id": context.task_id,
                    "agent_action_id": context.agent_action_id, "user_id": nullable_user_id(context.user_id),
                    "input": json.dumps(input_data, default=str),
                },
            )
            db.commit()

            if context.mode != "draft" and context.wallet_id and estimated > 0:
                ledger.reserve(db, context.wallet_id, estimated, run_id, context.task_id)
                reserved, reserved_flag = estimated, True

            db.execute(text('UPDATE "agent_runs" SET status = \'running\' WHERE id = :id'), {"id": run_id})
            db.commit()

            result: RunResult = self._execute(context, input_data, run_id)
            actual = result.actual_credits if result.actual_credits is not None else estimated
            if reserved_flag and context.wallet_id:
                ledger.consume(db, context.wallet_id, actual, reserved, run_id, context.task_id)

            status = "awaiting_approval" if context.mode == "draft" else "completed"
            db.execute(
                text(
                    'UPDATE "agent_runs" SET status = :status, credits_used = :credits, cost_usd = :cost, '
                    "output = :output, finished_at = NOW() WHERE id = :id"
                ),
                {"status": status, "credits": actual, "cost": result.cost_usd, "output": json.dumps(result.data, default=str), "id": run_id},
            )
            db.commit()
            record(db, context.company_id, nullable_user_id(context.user_id), "agent_run", "agent_runs", run_id, {"agent": self.code, "status": status, "credits": actual})
            return AgentResult(True, run_id, status, actual, result.cost_usd, result.data)

        except Exception as exc:
            db.rollback()
            if reserved_flag and context.wallet_id:
                try:
                    ledger.release(db, context.wallet_id, reserved, run_id, context.task_id)
                except Exception:
                    db.rollback()
            db.execute(
                text('UPDATE "agent_runs" SET status = \'failed\', output = :output, finished_at = NOW() WHERE id = :id'),
                {"output": json.dumps({"error": str(exc)}), "id": run_id},
            )
            db.commit()
            record(db, context.company_id, nullable_user_id(context.user_id), "agent_run", "agent_runs", run_id, {"agent": self.code, "status": "failed", "error": str(exc)})
            return AgentResult(False, run_id, "failed", error=str(exc))
        finally:
            db.close()

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        raise NotImplementedError
