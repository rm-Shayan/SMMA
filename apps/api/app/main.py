from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .bootstrap import register_all
from .core.lifecycle import lifespan
from .core.observability import ObservabilityMiddleware
from .modules.admin import (
    admin_router,
    billing_admin_router,
    credits_admin_router,
    governance_admin_router,
    metrics_router,
    router as users_router,
    system_admin_router,
)
from .modules.agents import router as agents_router
from .modules.approvals import bot_router as approvals_bot_router, router as approvals_router
from .modules.auth import router as auth_router
from .modules.campaigns import router as campaigns_router
from .modules.company import router as company_router
from .modules.connectors import router as connectors_router
from .modules.contacts import router as contacts_router
from .modules.credits import router as credits_router
from .modules.employee import router as employee_router
from .modules.events import router as events_router
from .modules.health import router as health_router
from .modules.inbox import router as inbox_router
from .modules.knowledge import router as knowledge_router
from .modules.manager import router as manager_router
from .modules.media import router as media_router
from .modules.notifications import router as notifications_router
from .modules.orchestration import router as orchestration_router
from .modules.outbox import router as outbox_router
from .modules.reporting import router as reporting_router
from .modules.schedules import router as schedules_router
from .modules.social import router as social_router
from .modules.teams import router as teams_router
from .modules.uploads import router as uploads_router
from .modules.workflows import router as workflows_router

register_all()

app = FastAPI(title="Styre-BOT API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(ObservabilityMiddleware)


@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    return JSONResponse(status_code=400, content={"success": False, "error": str(exc)})


app.include_router(health_router)


app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/v1/users", tags=["users"])
app.include_router(company_router, prefix="/api/v1", tags=["company"])
app.include_router(manager_router, prefix="/api/v1", tags=["manager"])
app.include_router(employee_router, prefix="/api/v1", tags=["employee"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(metrics_router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(credits_admin_router, prefix="/api/v1/admin", tags=["admin-credits"])
app.include_router(system_admin_router, prefix="/api/v1/admin", tags=["admin-system"])
app.include_router(billing_admin_router, prefix="/api/v1/admin", tags=["admin-billing"])
app.include_router(governance_admin_router, prefix="/api/v1/admin", tags=["admin-governance"])
app.include_router(teams_router, prefix="/api/v1/teams", tags=["teams"])
app.include_router(schedules_router, prefix="/api/v1/schedules", tags=["schedules"])
app.include_router(uploads_router, prefix="/api/v1", tags=["uploads"])
app.include_router(reporting_router, prefix="/api/v1", tags=["reporting"])
app.include_router(agents_router, prefix="/api/v1/agents", tags=["agents"])
app.include_router(outbox_router, prefix="/api/v1/outbox", tags=["outbox"])
app.include_router(connectors_router, prefix="/api/v1/connectors", tags=["connectors"])
app.include_router(credits_router, prefix="/api/v1/credits", tags=["credits"])
app.include_router(campaigns_router, prefix="/api/v1/campaigns", tags=["campaigns"])
app.include_router(contacts_router, prefix="/api/v1", tags=["contacts"])
app.include_router(media_router, prefix="/api/v1", tags=["media"])
app.include_router(notifications_router, prefix="/api/v1", tags=["notifications"])
app.include_router(social_router, prefix="/api/v1/social", tags=["social"])
app.include_router(knowledge_router, prefix="/api/v1/knowledge", tags=["knowledge"])
app.include_router(approvals_router, prefix="/api/v1/approvals", tags=["approvals"])
app.include_router(approvals_bot_router, prefix="/api/v1", tags=["approvals-bot"])
app.include_router(inbox_router, prefix="/api/v1", tags=["inbox"])
app.include_router(workflows_router, prefix="/api/v1", tags=["workflows"])
app.include_router(events_router, prefix="/api/v1", tags=["events"])
app.include_router(orchestration_router, prefix="/api/v1/orchestration", tags=["orchestration"])
