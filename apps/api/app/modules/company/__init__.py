from fastapi import APIRouter

from .admin_ops_router import router as admin_ops_router
from .profile_router import router as profile_router
from .quotas_router import router as quotas_router
from .security_router import router as security_router
from .teams_router import router as teams_router

router = APIRouter(prefix="/company", tags=["company"])
router.include_router(profile_router)
router.include_router(teams_router)
router.include_router(quotas_router)
router.include_router(security_router)
router.include_router(admin_ops_router)

__all__ = ["router"]