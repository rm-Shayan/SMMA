import json
import uuid
from sqlalchemy import text

from ...core.base_agent import BaseAgent
from ...core.db import SessionLocal
from ...core.registry import get as get_agent
from ...core.types import AgentContext, RunResult
from ..credits import ledger

ROUTES = [
    (["competitor", "research", "market"], 2, "Competitor Researcher", "Research competitor positioning", 3),
    (["post", "content", "publish", "social"], 8, "Publisher", "Draft and route post for approval", 2),
    (["engage", "starter", "conversation"], 1, "Own Post Engager", "Queue conversation starter comments", 1),
    (["email", "outreach", "cold"], 6, "Outreach Agent", "Personalize email outreach campaign", 1),
    (["inbox", "dm", "message", "reply"], 9, "Inbox Responder", "Triage and draft inbound replies", 1),
    (["sop", "train", "quiz"], 10, "Trainee & SOP", "Interactive SOP training & extraction", 2),
    (["policy", "doc", "knowledge"], 11, "Company Ops", "Answer from internal knowledge base", 1),
    (["metrics", "analytics", "roi"], 4, "Analytics Agent", "Compile cross-platform analytics", 2),
    (["brief", "today", "agenda"], 5, "Daily Brief", "Compile daily executive brief", 1),
    (["comment", "faq", "public"], 3, "Comment Responder", "Triage public post comments", 1),
    (["rival", "competitor post"], 7, "Competitor Engager", "Draft value-added competitor comment", 1),
]

CODES = {1: "own-post-engager", 2: "competitor-researcher", 3: "comment-responder", 4: "analytics", 5: "daily-brief", 6: "outreach", 7: "competitor-engager", 8: "publisher", 9: "inbox-responder", 10: "trainee-sop", 11: "company-ops"}


def plan_dag(request: str) -> list[dict]:
    lower = request.lower()
    matched = [r for r in ROUTES if any(k in lower for k in r[0])]
    if len(matched) < 3:
        matched += [r for r in ROUTES if r not in matched][:3 - len(matched)]
    return [
        {"step": i + 1, "agentId": r[1], "agentName": r[2], "description": r[3], "estimatedCredits": r[4], "status": "pending"}
        for i, r in enumerate(matched[:4])
    ]


def build_input(step: dict, request: str) -> dict:
    aid = step["agentId"]
    if aid == 2: return {"targetCompetitor": request, "focusArea": "general"}
    if aid == 8: return {"platform": "linkedin", "topic": request, "autoApprove": False}
    if aid == 1: return {"postId": "00000000-0000-0000-0000-000000000000", "postContent": request, "platform": "linkedin", "commentCount": 1}
    if aid == 6: return {"campaignGoal": request, "recipients": []}
    if aid == 4: return {"scope": "company_overview", "period": "7d"}
    if aid == 10: return {"sopQuery": request, "task": "quiz"}
    return {"query": request, "request": request}


def run_step(step: dict, request: str, context: AgentContext) -> dict:
    aid = step["agentId"]
    executor = get_agent(CODES.get(aid, ""))
    if executor is None:
        return {"ok": False, "attempts": 0, "error": f"No executor for agent #{aid}", "credits": 0}

    db = SessionLocal()
    try:
        wallet = ledger.get_company_wallet(db, context.company_id)
        if not wallet or wallet["available"] < step["estimatedCredits"]:
            return {"ok": False, "attempts": 0, "error": "Insufficient credits", "credits": 0}
    finally:
        db.close()

    act_id = f"a0000000-0000-0000-0000-{aid:012d}"
    last_error = ""
    for attempt in range(1, 4):
        result = executor.execute(
            AgentContext(
                company_id=context.company_id, user_id=context.user_id, wallet_id=context.wallet_id,
                agent_id=aid, agent_action_id=act_id, mode="auto", task_id=context.task_id,
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

