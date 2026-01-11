"""
Mo's Burritos - Routers Package
"""
from .auth import router as auth_router
from .locations import router as locations_router
from .menu import router as menu_router
from .orders import router as orders_router
from .users import router as users_router
from .payment import router as payment_router
from .live_locations import router as live_locations_router
from .admin import router as admin_router

__all__ = [
    "auth_router",
    "locations_router",
    "menu_router",
    "orders_router",
    "users_router",
    "payment_router",
    "live_locations_router",
    "admin_router",
]
