import json
from typing import Generator
from sqlalchemy.orm import Session

from ..modules.credits import ledger
from .access_control import can_execute_agent
from .db import SessionLocal
from .deps import Tenant
from .registry import get
from .types import AgentContext, AgentResult


def _prepare_context(tenant: Tenant, code: str, agent_id: int, action_id: str, mode: str, input_data: dict):
    allowed, err = can_execute_agent(tenant.role, code, custom_permissions=input_data.get("customPermissions"))
    if not allowed:
        raise PermissionError(err)

    agent = get(code)
    if agent is None:
        raise ValueError(f"Unknown agent: {code}")

    db: Session = SessionLocal()
    try:
        wallet = ledger.get_company_wallet(db, tenant.company_id)
        if not wallet:
            raise ValueError("Company wallet not found")
    finally:
        db.close()

    context = AgentContext(tenant.company_id, tenant.user_id, wallet["id"], agent_id, action_id, mode)
    return agent, context


def run_agent(tenant: Tenant, code: str, agent_id: int, action_id: str, mode: str, input_data: dict) -> AgentResult:
    agent, context = _prepare_context(tenant, code, agent_id, action_id, mode, input_data)
    result = agent.execute(context, input_data)
    if not result.success:
        raise RuntimeError(result.error or "agent run failed")
    return result


def stream_agent(tenant: Tenant, code: str, agent_id: int, action_id: str, mode: str, input_data: dict) -> Generator[str, None, None]:
    """Streams real-time agent execution events (plan, steps, live status, and result) via SSE."""
    try:
        agent, context = _prepare_context(tenant, code, agent_id, action_id, mode, input_data)
    except Exception as exc:
        yield f"event: error\ndata: {json.dumps({'error': str(exc)})}\n\n"
        return

    plan_steps = agent.plan(context, input_data)
    yield f"event: plan\ndata: {json.dumps({'agent': agent.name, 'code': code, 'plan': plan_steps})}\n\n"

    for idx, step in enumerate(plan_steps, 1):
        yield f"event: step\ndata: {json.dumps({'index': idx, 'total': len(plan_steps), 'step': step, 'status': 'running'})}\n\n"

    try:
        result = agent.execute(context, input_data)
        if not result.success:
            yield f"event: error\ndata: {json.dumps({'error': result.error or 'Execution failed'})}\n\n"
            return
        yield f"event: result\ndata: {json.dumps({'runId': result.run_id, 'status': result.status, 'credits': result.credits_used, 'data': result.data})}\n\n"
        yield "event: done\ndata: [DONE]\n\n"
    except Exception as exc:
        yield f"event: error\ndata: {json.dumps({'error': str(exc)})}\n\n"
