import json
import uuid
from sqlalchemy import text

from ...core.base_agent import BaseAgent
from ...core.db import SessionLocal
from ...core.registry import get as get_agent
from ...core.types import AgentContext, RunResult
from ..credits import ledger

ROUTES = [
    (["competitor", "research", "market", "rival"], 2, "Competitor Researcher", "Research competitor positioning", 3),
    (["post", "content", "publish", "linkedin", "social", "campaign"], 8, "Publisher", "Draft and route post for approval", 2),
    (["engage", "comment", "conversation", "outreach"], 1, "Own Post Engager", "Queue conversation starter comments", 1),
    (["policy", "sop", "knowledge", "document", "handbook"], 11, "Company Ops", "Answer from internal knowledge base", 1),
]

CODES = {1: "own-post-engager", 2: "competitor-researcher", 8: "publisher", 11: "company-ops"}
ACTIONS = {1: "a0000000-0000-0000-0000-000000000001", 2: "a0000000-0000-0000-0000-000000000002", 8: "a0000000-0000-0000-0000-000000000008", 11: "a0000000-0000-0000-0000-000000000011"}


def plan_dag(request: str) -> list[dict]:
    lower = request.lower()
    matched = [route for route in ROUTES if any(keyword in lower for keyword in route[0])]
    if len(matched) < 3:
        for route in ROUTES:
            if route not in matched:
                matched.append(route)
            if len(matched) >= 3:
                break
    return [
        {"step": index + 1, "agentId": route[1], "agentName": route[2], "description": route[3], "estimatedCredits": route[4], "status": "pending"}
        for index, route in enumerate(matched[:4])
    ]


def build_input(step: dict, request: str) -> dict:
    agent_id = step["agentId"]
    if agent_id == 2:
        return {"targetCompetitor": request, "focusArea": "general"}
    if agent_id == 8:
        return {"platform": "linkedin", "topic": request, "autoApprove": False}
    if agent_id == 1:
        return {"postId": "00000000-0000-0000-0000-000000000000", "postContent": request, "platform": "linkedin", "commentCount": 1}
    return {"query": request}


def run_step(step: dict, request: str, context: AgentContext) -> dict:
    executor = get_agent(CODES.get(step["agentId"], ""))
    if executor is None:
        return {"ok": False, "attempts": 0, "error": f"No executor for agent #{step['agentId']}", "credits": 0}

    db = SessionLocal()
    try:
        wallet = ledger.get_company_wallet(db, context.company_id)
        if not wallet or wallet["available"] < step["estimatedCredits"]:
            return {"ok": False, "attempts": 0, "error": "Insufficient credits", "credits": 0}
    finally:
        db.close()

    last_error = ""
    for attempt in range(1, 4):
        result = executor.execute(
            AgentContext(
                company_id=context.company_id, user_id=context.user_id, wallet_id=context.wallet_id,
                agent_id=step["agentId"], agent_action_id=ACTIONS.get(step["agentId"], ""), mode="auto", task_id=context.task_id,
            ),
            build_input(step, request),
        )
        if result.success:
            return {"ok": True, "attempts": attempt, "credits": result.credits_used}
        last_error = result.error or "step failed"
    return {"ok": False, "attempts": 3, "error": last_error, "credits": 0}


class SupervisorAgent(BaseAgent):
    id = 12
    code = "supervisor"
    name = "Supervisor Orchestrator"
    default_mode = "auto"

    def estimate_credits(self, input_data: dict) -> int:
        return 0

    def plan(self, context: AgentContext, input_data: dict) -> list[str]:
        return ["Decompose goal into DAG", "Reserve budget", "Execute steps with retries"]

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        db = SessionLocal()
        try:
            task_id = str(uuid.uuid4())
            plan = plan_dag(input_data["request"])
            budget = sum(step["estimatedCredits"] for step in plan)
            db.execute(
                text('INSERT INTO "tasks" (id, company_id, user_id, request, plan, credit_budget, status, created_at) VALUES (:id, :c, :u, :request, :plan, :budget, \'running\', NOW())'),
                {"id": task_id, "c": context.company_id, "u": context.user_id, "request": input_data["request"], "plan": json.dumps(plan), "budget": budget},
            )
            db.commit()

            credits, failed = 0, False
            for step in plan:
                step["status"] = "running"
                db.execute(text('UPDATE "tasks" SET plan = :plan WHERE id = :id'), {"plan": json.dumps(plan), "id": task_id})
                db.commit()

                result = run_step(step, input_data["request"], AgentContext(context.company_id, context.user_id, context.wallet_id, context.agent_id, context.agent_action_id, "auto", task_id))
                step["status"] = "completed" if result["ok"] else "failed"
                step["attempts"] = result["attempts"]
                if not result["ok"]:
                    step["error"] = result["error"]
                    failed = True
                credits += result["credits"]
                db.execute(text('UPDATE "tasks" SET plan = :plan WHERE id = :id'), {"plan": json.dumps(plan), "id": task_id})
                db.commit()
                if failed:
                    break

            status = "failed" if failed else "completed"
            db.execute(text('UPDATE "tasks" SET status = :status WHERE id = :id'), {"status": status, "id": task_id})
            db.commit()
            return RunResult({"taskId": task_id, "request": input_data["request"], "totalBudget": budget, "creditsUsed": credits, "plan": plan, "status": status}, 0, 0)
        finally:
            db.close()

