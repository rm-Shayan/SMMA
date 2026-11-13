import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ...core.pubsub import publish_event_sync
from ...core.runner import run_agent

router = APIRouter(prefix="/workflows", tags=["workflows"])

class StepConfig(BaseModel):
    agent_code: str
    action: str = "run"
    input_template: Dict[str, Any] = {}

class WorkflowRequest(BaseModel):
    name: str = Field(min_length=3)
    steps: List[StepConfig] = Field(min_length=1)

class TriggerWorkflow(BaseModel):
    initial_input: Dict[str, Any] = {}

@router.post("")
def create_workflow(body: WorkflowRequest, tenant: Tenant = Depends(get_tenant)):
    wf_id = str(uuid.uuid4())
    return {"success": True, "workflowId": wf_id, "name": body.name, "stepCount": len(body.steps)}

@router.post("/run-pipeline")
def run_pipeline(body: TriggerWorkflow, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    """Executes a 3-agent chained pipeline: Research -> Publisher -> Outbox/Media."""
    pipeline_id = str(uuid.uuid4())
    publish_event_sync(tenant.company_id, "pipeline_started", {"pipelineId": pipeline_id, "status": "running"}, "agents")
    results = []

    # Step 1: Competitor Researcher
    r1 = run_agent(tenant, "competitor-researcher", 2, "a0000000-0000-0000-0000-000000000002", "draft", {"topic": body.initial_input.get("topic", "AI marketing automation")})
    results.append({"step": 1, "agent": "competitor-researcher", "data": r1.data})
    publish_event_sync(tenant.company_id, "pipeline_step", {"pipelineId": pipeline_id, "step": 1, "status": "done"}, "agents")

    # Step 2: Publisher & Distributor
    r2 = run_agent(tenant, "publisher", 8, "a0000000-0000-0000-0000-000000000008", "draft", {"topic": body.initial_input.get("topic", "AI marketing automation"), "research": r1.data})
    results.append({"step": 2, "agent": "publisher", "data": r2.data})
    publish_event_sync(tenant.company_id, "pipeline_step", {"pipelineId": pipeline_id, "step": 2, "status": "done"}, "agents")

    publish_event_sync(tenant.company_id, "pipeline_completed", {"pipelineId": pipeline_id, "status": "completed"}, "agents")
    return {"success": True, "pipelineId": pipeline_id, "stepsCompleted": len(results), "chainResults": results}

