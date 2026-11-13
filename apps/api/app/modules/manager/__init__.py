from fastapi import APIRouter

from .approvals_router import router as approvals_router
from .oversight_router import router as oversight_router
from .team_ops_router import router as team_ops_router
from .team_router import router as team_router

router = APIRouter(prefix="/manager", tags=["manager"])
router.include_router(team_router)
router.include_router(team_ops_router)
router.include_router(approvals_router)
router.include_router(oversight_router)

__all__ = ["router"]