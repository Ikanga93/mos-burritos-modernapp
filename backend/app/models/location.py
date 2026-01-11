"""
Mo's Burritos - Location Models
"""
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum, Float, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from ..database import Base


class LocationType(str, enum.Enum):
    RESTAURANT = "restaurant"
    FOOD_TRUCK = "food_truck"


class Location(Base):
    __tablename__ = "locations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    type = Column(SQLEnum(LocationType), nullable=False, default=LocationType.RESTAURANT)
    address = Column(String(500), nullable=True)  # Nullable for food trucks
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    zip_code = Column(String(20), nullable=True)
    phone = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    schedule = Column(JSON, nullable=True)  # {"mon": "9am-9pm", "tue": "9am-9pm", ...}
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    staff = relationship("UserLocation", back_populates="location")
    menu_items = relationship("MenuItem", back_populates="location", cascade="all, delete-orphan")
    categories = relationship("MenuCategory", back_populates="location", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="location")
