"""
Mo's Burritos - Order Schemas
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    ONLINE = "online"


# Order item (within an order)
class OrderItem(BaseModel):
    item_id: str
    name: str
    price: float
    quantity: int = Field(ge=1)
    notes: Optional[str] = None


# Order schemas
class OrderCreate(BaseModel):
    location_id: Optional[str] = None  # Optional - will use first active location if not provided
    customer_name: str = Field(min_length=1)
    customer_phone: str = Field(min_length=10)
    customer_email: Optional[EmailStr] = None
    items: List[OrderItem]
    notes: Optional[str] = None
    payment_method: Optional[PaymentMethod] = None


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    estimated_time: Optional[int] = None
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: Optional[str] = None


class OrderResponse(BaseModel):
    id: str
    location_id: str
    customer_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    items: List[Any]  # JSON stored items
    subtotal: float
    tax: float
    total: float
    notes: Optional[str] = None
    status: OrderStatus
    payment_status: PaymentStatus
    payment_method: Optional[PaymentMethod] = None
    payment_intent_id: Optional[str] = None
    stripe_session_id: Optional[str] = None
    estimated_time: Optional[int] = None
    estimated_completion: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OrderWithLocation(OrderResponse):
    location_name: str


# Dashboard stats
class DashboardStats(BaseModel):
    location_id: str
    location_name: str
    orders_today: int = 0
    orders_pending: int = 0
    orders_preparing: int = 0
    orders_ready: int = 0
    revenue_today: float = 0
    average_order_value: float = 0
