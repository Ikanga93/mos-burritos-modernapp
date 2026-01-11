"""
Mo's Burritos - Location Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime
from enum import Enum


class LocationType(str, Enum):
    RESTAURANT = "restaurant"
    FOOD_TRUCK = "food_truck"


class LocationBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: LocationType = LocationType.RESTAURANT
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    schedule: Optional[Dict[str, str]] = None  # {"mon": "9am-9pm", ...}


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[LocationType] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    schedule: Optional[Dict[str, str]] = None
    is_active: Optional[bool] = None


class LocationResponse(LocationBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class LocationWithStats(LocationResponse):
    total_orders_today: int = 0
    total_revenue_today: float = 0
    staff_count: int = 0
