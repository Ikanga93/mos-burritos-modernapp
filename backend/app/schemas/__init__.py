"""
Mo's Burritos - Schemas Package
"""
from .user import (
    UserRole,
    LocationRole,
    UserLogin,
    UserRegister,
    Token,
    LoginResponse,
    RefreshTokenRequest,
    TokenData,
    PhoneOTPRequest,
    PhoneVerifyRequest,
    PhoneLoginResponse,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserWithLocations,
    LocationAssignment,
    AssignUserToLocation,
)
from .location import (
    LocationType,
    LocationCreate,
    LocationUpdate,
    LocationResponse,
    LocationWithStats,
)
from .menu import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    MenuItemCreate,
    MenuItemUpdate,
    MenuItemResponse,
    CategoryWithItems,
    LocationMenu,
)
from .order import (
    OrderStatus,
    PaymentStatus,
    PaymentMethod,
    OrderItem,
    OrderCreate,
    OrderUpdate,
    OrderStatusUpdate,
    OrderResponse,
    OrderWithLocation,
    DashboardStats,
)
from .payment import (
    PaymentIntentRequest,
    PaymentIntentResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
)
from .live_location import (
    LiveLocationCreate,
    LiveLocationUpdate,
    LiveLocationResponse,
)

__all__ = [
    # User
    "UserRole",
    "LocationRole",
    "UserLogin",
    "UserRegister",
    "Token",
    "LoginResponse",
    "RefreshTokenRequest",
    "TokenData",
    "PhoneOTPRequest",
    "PhoneVerifyRequest",
    "PhoneLoginResponse",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserWithLocations",
    "LocationAssignment",
    "AssignUserToLocation",
    # Location
    "LocationType",
    "LocationCreate",
    "LocationUpdate",
    "LocationResponse",
    "LocationWithStats",
    # Menu
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryResponse",
    "MenuItemCreate",
    "MenuItemUpdate",
    "MenuItemResponse",
    "CategoryWithItems",
    "LocationMenu",
    # Order
    "OrderStatus",
    "PaymentStatus",
    "PaymentMethod",
    "OrderItem",
    "OrderCreate",
    "OrderUpdate",
    "OrderStatusUpdate",
    "OrderResponse",
    "OrderWithLocation",
    "DashboardStats",
    # Payment
    "PaymentIntentRequest",
    "PaymentIntentResponse",
    "VerifyPaymentRequest",
    "VerifyPaymentResponse",
    # Live Location
    "LiveLocationCreate",
    "LiveLocationUpdate",
    "LiveLocationResponse",
]
