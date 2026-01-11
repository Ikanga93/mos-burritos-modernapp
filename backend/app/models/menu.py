"""
Mo's Burritos - Menu Models
Each location has its own separate menu (categories and items)
"""
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class MenuCategory(Base):
    """Menu categories - each location has its own categories"""
    __tablename__ = "menu_categories"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    location_id = Column(String(36), ForeignKey("locations.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    emoji = Column(String(10), nullable=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    location = relationship("Location", back_populates="categories")
    items = relationship("MenuItem", back_populates="category", cascade="all, delete-orphan")


class MenuItem(Base):
    """Menu items - each location has its own items"""
    __tablename__ = "menu_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    location_id = Column(String(36), ForeignKey("locations.id"), nullable=False)
    category_id = Column(String(36), ForeignKey("menu_categories.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    emoji = Column(String(10), nullable=True)
    image_url = Column(Text, nullable=True)
    is_available = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    location = relationship("Location", back_populates="menu_items")
    category = relationship("MenuCategory", back_populates="items")
    option_groups = relationship("MenuItemOptionGroup", back_populates="menu_item", cascade="all, delete-orphan")


class MenuItemOptionGroup(Base):
    """Option groups for menu items (e.g., Size, Toppings, Sides)"""
    __tablename__ = "menu_item_option_groups"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    menu_item_id = Column(String(36), ForeignKey("menu_items.id"), nullable=False)
    name = Column(String(100), nullable=False)  # e.g., "Size", "Toppings"
    is_required = Column(Boolean, default=False)  # Must customer select at least one?
    allow_multiple = Column(Boolean, default=False)  # Can select multiple options?
    min_selections = Column(Integer, default=0)  # Minimum selections required
    max_selections = Column(Integer, nullable=True)  # Maximum selections allowed (null = unlimited)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    menu_item = relationship("MenuItem", back_populates="option_groups")
    options = relationship("MenuItemOption", back_populates="option_group", cascade="all, delete-orphan")


class MenuItemOption(Base):
    """Individual options within an option group (e.g., Small, Medium, Large)"""
    __tablename__ = "menu_item_options"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    option_group_id = Column(String(36), ForeignKey("menu_item_option_groups.id"), nullable=False)
    name = Column(String(100), nullable=False)  # e.g., "Large", "Extra Cheese"
    price_modifier = Column(Float, default=0.0)  # Additional price (+2.00, +0.50, etc.)
    is_default = Column(Boolean, default=False)  # Is this the default selection?
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    option_group = relationship("MenuItemOptionGroup", back_populates="options")
