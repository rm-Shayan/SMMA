import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ...core.guardrails import check_prompt_injection, wrap_safe_prompt
from ...core.llm import generate_text_stream
from ...core.runner import run_agent
from ..campaigns.audio_engine import detect_language

router = APIRouter()


class SupervisorBody(BaseModel):
    request: str
    maxCreditBudget: int = 10


class ResearchBody(BaseModel):
    targetCompetitor: str
    websiteUrl: str | None = None
    focusArea: str = "general"


class CopilotBody(BaseModel):
    query: str
    wantVoice: bool = False


@router.post("/copilot/chat")
def copilot_chat(body: CopilotBody, tenant: Tenant = Depends(get_tenant)):
    result = run_agent(
        tenant, "copilot", 0, "a0000000-0000-0000-0000-000000000000", "auto",
        {"query": body.query, "role": tenant.role or "employee", "wantVoice": body.wantVoice},
    )
    return {"success": result.success, "data": result.data, "runId": result.run_id}


@router.post("/copilot/chat/stream")
def copilot_chat_stream(body: CopilotBody, tenant: Tenant = Depends(get_tenant)):
    is_injected, err = check_prompt_injection(body.query)
    if is_injected:
        return StreamingResponse((f"data: {json.dumps({'error': err})}\n\n" for _ in range(1)), media_type="text/event-stream")

    lang = detect_language(body.query)
    prompt = wrap_safe_prompt(f"You are the Styre AI Copilot. Answer concisely in '{lang}'. Role is '{tenant.role or 'employee'}'.", body.query)

    def sse_stream():
        for token in generate_text_stream(prompt, max_tokens=400):
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(sse_stream(), media_type="text/event-stream")


@router.get("/daily-briefs")
def list_briefs(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 30):
    rows = db.execute(text('SELECT id, brief_date, items FROM "daily_briefs" WHERE company_id = :c ORDER BY brief_date DESC LIMIT :limit'), {"c": tenant.company_id, "limit": limit}).all()
    return {"success": True, "briefs": [dict(r._mapping) for r in rows]}


@router.get("/tasks")
def list_tasks(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 50):
    rows = db.execute(text('SELECT id, request, plan, credit_budget, status, created_at FROM "tasks" WHERE company_id = :c ORDER BY created_at DESC LIMIT :limit'), {"c": tenant.company_id, "limit": limit}).all()
    return {"success": True, "tasks": [dict(r._mapping) for r in rows]}


@router.post("/supervisor")
def supervisor(body: SupervisorBody, tenant: Tenant = Depends(get_tenant)):
    result = run_agent(tenant, "supervisor", 12, "a0000000-0000-0000-0000-000000000012", "auto", {"request": body.request, "maxCreditBudget": body.maxCreditBudget, "autoExecute": True})
    return {"success": result.success, "data": result.data, "runId": result.run_id}


@router.post("/research")
def research(body: ResearchBody, tenant: Tenant = Depends(get_tenant)):
    result = run_agent(tenant, "competitor-researcher", 2, "a0000000-0000-0000-0000-000000000002", "auto", body.model_dump())
    return {"success": result.success, "data": result.data, "runId": result.run_id}


@router.get("/brief")
def brief(tenant: Tenant = Depends(get_tenant)):
    result = run_agent(tenant, "daily-brief", 5, "a0000000-0000-0000-0000-000000000005", "auto", {})
    return {"success": result.success, "data": result.data, "runId": result.run_id}


@router.get("/analytics")
def analytics(tenant: Tenant = Depends(get_tenant)):
    result = run_agent(tenant, "analytics", 4, "a0000000-0000-0000-0000-000000000004", "auto", {"scope": "company_overview", "period": "7d"})
    return {"success": result.success, "data": result.data, "runId": result.run_id}
