from fastapi import APIRouter

from .activity_router import router as activity_router
from .campaigns_router import router as campaigns_router
from .growth_router import router as growth_router
from .learning_router import router as learning_router
from .notifications_router import router as notifications_router
from .overview_router import router as overview_router
from .profile_router import router as profile_router
from .self_ops_router import router as self_ops_router
from .social_router import router as social_router
from .work_router import router as work_router

router = APIRouter(prefix="/employee", tags=["employee"])
router.include_router(overview_router)
router.include_router(work_router)
router.include_router(learning_router)
router.include_router(notifications_router)
router.include_router(profile_router)
router.include_router(activity_router)
router.include_router(self_ops_router)
router.include_router(growth_router)
router.include_router(social_router)
router.include_router(campaigns_router)

__all__ = ["router"]