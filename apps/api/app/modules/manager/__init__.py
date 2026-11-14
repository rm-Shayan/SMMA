from fastapi import APIRouter

from .approvals_router import router as approvals_router
from .oversight_router import router as oversight_router
from .team_admin_router import router as team_admin_router
from .team_ops_router import router as team_ops_router
from .team_router import router as team_router
from .team_schedule_router import router as team_schedule_router

router = APIRouter(prefix="/manager", tags=["manager"])
router.include_router(team_router)
router.include_router(team_ops_router)
router.include_router(team_admin_router)
router.include_router(team_schedule_router)
router.include_router(approvals_router)
router.include_router(oversight_router)

__all__ = ["router"]