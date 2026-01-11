"""
Mo's Burritos - Order Models
"""
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum, Float, Text, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from ..database import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CARD = "card"
    ONLINE = "online"


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    location_id = Column(String(36), ForeignKey("locations.id"), nullable=False)
    customer_id = Column(String(36), ForeignKey("users.id"), nullable=True)  # Nullable for guest orders
    
    # Customer info (stored for guest orders)
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    customer_email = Column(String(255), nullable=True)
    
    # Order details
    items = Column(JSON, nullable=False)  # [{item_id, name, price, quantity, ...}]
    subtotal = Column(Float, nullable=False)
    tax = Column(Float, nullable=False, default=0)
    total = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Status
    status = Column(SQLEnum(OrderStatus), nullable=False, default=OrderStatus.PENDING)
    payment_status = Column(SQLEnum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=True)
    payment_intent_id = Column(String(255), nullable=True)
    stripe_session_id = Column(String(255), nullable=True)
    
    # Timing
    estimated_time = Column(Integer, nullable=True)  # Minutes
    estimated_completion = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    location = relationship("Location", back_populates="orders")
    customer = relationship("User", back_populates="orders")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")


class OrderStatusHistory(Base):
    """Track order status changes"""
    __tablename__ = "order_status_history"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False)
    status = Column(SQLEnum(OrderStatus), nullable=False)
    changed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    order = relationship("Order", back_populates="status_history")
