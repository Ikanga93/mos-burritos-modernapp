"""
Mo's Burritos - User Models
"""
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from ..database import Base


class UserRole(str, enum.Enum):
    OWNER = "owner"
    MANAGER = "manager"
    STAFF = "staff"
    CUSTOMER = "customer"


class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    supabase_id = Column(String(36), unique=True, nullable=True, index=True)  # Supabase Auth user ID
    email = Column(String(255), unique=True, nullable=True, index=True)  # Nullable for phone-only users
    phone = Column(String(20), unique=True, nullable=True, index=True)  # Unique for phone auth
    password_hash = Column(String(255), nullable=True)  # Nullable for phone-only users
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.CUSTOMER)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    location_assignments = relationship("UserLocation", back_populates="user", foreign_keys="[UserLocation.user_id]")
    orders = relationship("Order", back_populates="customer")
    
    @property
    def full_name(self) -> str:
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or self.email


class LocationRole(str, enum.Enum):
    MANAGER = "manager"
    STAFF = "staff"


class UserLocation(Base):
    """Many-to-many relationship between users and locations with role"""
    __tablename__ = "user_locations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    location_id = Column(String(36), ForeignKey("locations.id"), nullable=False)
    role = Column(SQLEnum(LocationRole), nullable=False, default=LocationRole.STAFF)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    assigned_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="location_assignments", foreign_keys=[user_id])
    location = relationship("Location", back_populates="staff")
