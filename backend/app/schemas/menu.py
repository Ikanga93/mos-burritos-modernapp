"""
Mo's Burritos - Menu Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# Category schemas
class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    emoji: Optional[str] = None
    display_order: int = 0


class CategoryCreate(CategoryBase):
    location_id: str


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    emoji: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    id: str
    location_id: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Menu item schemas
class MenuItemBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    price: float = Field(gt=0)
    emoji: Optional[str] = None
    image_url: Optional[str] = None
    display_order: int = 0


class MenuItemCreate(MenuItemBase):
    location_id: str
    category_id: str
    is_available: Optional[bool] = True


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    emoji: Optional[str] = None
    image_url: Optional[str] = None
    display_order: Optional[int] = None
    is_available: Optional[bool] = None
    category_id: Optional[str] = None


class MenuItemResponse(MenuItemBase):
    id: str
    location_id: str
    category_id: str
    is_available: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class CategoryWithItems(CategoryResponse):
    items: List[MenuItemResponse] = []


class LocationMenu(BaseModel):
    location_id: str
    location_name: str
    categories: List[CategoryWithItems] = []
