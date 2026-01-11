"""
Mo's Burritos - Live Location Models (Food Truck Tracking)
"""
from sqlalchemy import Column, String, Boolean, DateTime, Float
from datetime import datetime
import uuid

from ..database import Base


class LiveLocation(Base):
    """Food truck live location tracking"""
    __tablename__ = "live_locations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    truck_name = Column(String(255), nullable=False)
    current_address = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    hours_today = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
