from fastapi import APIRouter, Depends

from app.api.v1.branches import router as branches_router
from app.api.v1.costs import router as costs_router
from app.api.v1.customers import router as customers_router
from app.api.v1.employees import router as employees_router
from app.api.v1.health import router as health_router
from app.api.v1.health_seed import router as health_seed_router
from app.api.v1.overview import router as overview_router
from app.api.v1.payroll import router as payroll_router
from app.api.v1.revenue import router as revenue_router
from app.api.v1.service_assignments import router as service_assignments_router
from app.api.v1.services import router as services_router
from app.api.v1.sales import router as sales_router
from app.api.v1.targets import router as targets_router
from app.api.v1.attendance import router as attendance_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.analytics import router as analytics_router
from app.core.config import settings
from app.core.auth import get_current_user

# health & health_seed stay public — UptimeRobot pings need no auth
_auth = [Depends(get_current_user)]

api_router = APIRouter(prefix=settings.api_v1_prefix)
api_router.include_router(health_router)
api_router.include_router(health_seed_router)
api_router.include_router(branches_router,            dependencies=_auth)
api_router.include_router(overview_router,            dependencies=_auth)
api_router.include_router(analytics_router,           dependencies=_auth)
api_router.include_router(services_router,            dependencies=_auth)
api_router.include_router(service_assignments_router, dependencies=_auth)
api_router.include_router(sales_router,               dependencies=_auth)
api_router.include_router(revenue_router,             dependencies=_auth)
api_router.include_router(costs_router,               dependencies=_auth)
api_router.include_router(employees_router,           dependencies=_auth)
api_router.include_router(payroll_router,             dependencies=_auth)
api_router.include_router(customers_router,           dependencies=_auth)
api_router.include_router(targets_router,             dependencies=_auth)
api_router.include_router(attendance_router,          dependencies=_auth)
api_router.include_router(reviews_router,             dependencies=_auth)
