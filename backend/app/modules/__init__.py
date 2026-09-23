from fastapi import APIRouter

from app.modules.applicants.router import router as applicants_router
from app.modules.applications.router import router as applications_router
from app.modules.catalog.router import router as catalog_router
from app.modules.commerce.router import router as commerce_router
from app.modules.communication.router import router as communication_router
from app.modules.consultations.router import router as consultations_router
from app.modules.content.router import router as content_router
from app.modules.discovery.router import router as discovery_router
from app.modules.documents.router import router as documents_router
from app.modules.identity.router import router as identity_router
from app.modules.integrations.router import router as integrations_router
from app.modules.learning.router import router as learning_router
from app.modules.media.router import router as media_router
from app.modules.notifications.router import router as notifications_router
from app.modules.programs.router import router as programs_router
from app.modules.reporting.router import router as reporting_router
from app.modules.universities.router import router as universities_router

module_routers: tuple[APIRouter, ...] = (
    identity_router,
    catalog_router,
    content_router,
    consultations_router,
    applicants_router,
    applications_router,
    documents_router,
    discovery_router,
    learning_router,
    media_router,
    commerce_router,
    communication_router,
    notifications_router,
    programs_router,
    integrations_router,
    reporting_router,
    universities_router,
)
