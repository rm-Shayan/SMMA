from .account_test_router import router as test_router
from .external_gateway_router import router as external_router
from .router import router

router.include_router(test_router)
router.include_router(external_router)

__all__ = ["router"]
