from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.modules import module_routers
from app.modules.seo.router import public_site_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(public_site_router)

versioned_router = APIRouter(prefix="/api/v1")
for router in module_routers:
    versioned_router.include_router(router)
api_router.include_router(versioned_router)
