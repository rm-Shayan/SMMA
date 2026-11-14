from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ...core.access_control import can_execute_agent
from ...core.deps import Tenant, get_tenant
from ...core.runner import run_agent

router = APIRouter(prefix="/external", tags=["external-gateway"])


class ExternalDispatchRequest(BaseModel):
    systemName: str = Field(default="Generic_External", description="Name of external system e.g. HCM, ERP, Slack, CRM")
    externalToken: str | None = Field(default=None, description="External platform bearer token or session token")
    externalUserId: str | None = Field(default=None, description="User identifier in external system")
    agentCode: str = Field(default="copilot", description="Target agent to execute e.g. copilot, supervisor, publisher")
    query: str = Field(description="Command or natural language prompt for the agent")
    parameters: dict = Field(default_factory=dict, description="Additional structured parameters or context")


@router.post("/dispatch")
def dispatch_external_agent(body: ExternalDispatchRequest, tenant: Tenant = Depends(get_tenant)):
    """Standardized Gateway Endpoint to trigger Styre-BOT AI from any external system (HCM, ERP, CRM, Slack, WhatsApp)."""
    allowed, err = can_execute_agent(tenant.role, body.agentCode)
    if not allowed:
        raise HTTPException(status_code=403, detail=f"Access Control Blocked: Role '{tenant.role}' is not authorized to run '{body.agentCode}'.")

    input_data = {
        "query": body.query,
        "role": tenant.role or "employee",
        "systemName": body.systemName,
        "externalToken": body.externalToken,
        "externalUserId": body.externalUserId,
        **body.parameters,
    }

    result = run_agent(
        tenant=tenant,
        code=body.agentCode,
        agent_id=0,
        action_id="ext-gateway-action",
        mode="auto",
        input_data=input_data,
    )

    return {
        "success": result.success,
        "systemName": body.systemName,
        "agentCode": body.agentCode,
        "runId": result.run_id,
        "status": result.status,
        "creditsUsed": result.credits_used,
        "data": result.data,
    }


class DiscoverBody(BaseModel):
    baseUrl: str | None = None
    openApiUrl: str | None = None
    openApiSpec: dict | None = None
    token: str | None = None


@router.post("/discover")
def discover_external_endpoints(body: DiscoverBody, tenant: Tenant = Depends(get_tenant)):
    """Autonomous zero-config discovery of backend endpoints with 0 LLM token cost."""
    from .openapi_engine import auto_discover_backend, fetch_and_parse_openapi
    if body.baseUrl:
        routes = auto_discover_backend(body.baseUrl, token=body.token)
    else:
        routes = fetch_and_parse_openapi(body.openApiUrl, body.openApiSpec)
    return {"success": bool(routes), "totalEndpoints": len(routes), "endpoints": routes}


@router.get("/spec")
def get_external_integration_spec():
    """Returns the integration specification and header requirements for external developers."""
    return {
        "gatewayEndpoint": "/api/v1/connectors/external/dispatch",
        "method": "POST",
        "requiredHeaders": {
            "Authorization": "Bearer <Styre_JWT_or_API_Token>",
            "x-tenant-id": "<Company_UUID>",
            "Content-Type": "application/json",
        },
        "payloadFormat": {
            "systemName": "HCM_Workday",
            "externalToken": "Bearer ext_user_token_abc123",
            "externalUserId": "emp_9410",
            "agentCode": "copilot",
            "query": "Check company credit balance and show latest ledger count",
            "parameters": {},
        },
        "supportedAgents": [
            "copilot", "supervisor", "publisher", "inbox_responder", "outreach",
            "competitor_researcher", "comment_responder", "analytics", "daily_brief", "company_ops"
        ],
    }
