from fastapi import APIRouter

from .activity_router import router as activity_router
from .learning_router import router as learning_router
from .overview_router import router as overview_router
from .profile_router import router as profile_router
from .work_router import router as work_router

router = APIRouter(prefix="/employee", tags=["employee"])
router.include_router(overview_router)
router.include_router(work_router)
router.include_router(learning_router)
router.include_router(profile_router)
router.include_router(activity_router)

__all__ = ["router"]