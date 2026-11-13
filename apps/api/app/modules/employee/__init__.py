from fastapi import APIRouter
from .learning_router import router as learning_router
from .overview_router import router as overview_router
from .work_router import router as work_router

router = APIRouter(prefix="/employee", tags=["employee"])
router.include_router(overview_router)
router.include_router(work_router)
router.include_router(learning_router)

__all__ = ["router"]

