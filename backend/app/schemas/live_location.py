"""
Mo's Burritos - Live Location Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LiveLocationCreate(BaseModel):
    """Create a new live location (food truck)"""
    truck_name: str = Field(min_length=1, description="Name of the food truck")
    current_address: str = Field(min_length=1, description="Current address")
    latitude: float = Field(description="Latitude coordinate")
    longitude: float = Field(description="Longitude coordinate")
    hours_today: Optional[str] = Field(None, description="Operating hours for today")


class LiveLocationUpdate(BaseModel):
    """Update a live location"""
    truck_name: Optional[str] = None
    current_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    hours_today: Optional[str] = None
    is_active: Optional[bool] = None


class LiveLocationResponse(BaseModel):
    """Live location response"""
    id: str
    truck_name: str
    current_address: str
    latitude: float
    longitude: float
    hours_today: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
