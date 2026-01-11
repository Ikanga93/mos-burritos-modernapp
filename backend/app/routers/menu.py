"""
Mo's Burritos - Menu Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Location, MenuCategory, MenuItem, User
from ..schemas import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    MenuItemCreate,
    MenuItemUpdate,
    MenuItemResponse,
    CategoryWithItems,
    LocationMenu,
    UserRole
)
from ..middleware import get_current_user, require_manager_or_above
from ..services import can_access_location

router = APIRouter(prefix="/menu", tags=["Menu"])


# ==================== Public Menu Endpoints ====================

@router.get("", response_model=List[dict])
async def get_flat_menu(location_id: str = None, db: Session = Depends(get_db)):
    """Get flat menu (compatibility endpoint for frontend)

    Returns a flat list of menu items with category as a string field.
    If location_id is provided, returns items for that location only.
    Otherwise, returns items from the first active location.
    """
    # If no location specified, use first active location
    if not location_id:
        first_location = db.query(Location).filter(Location.is_active == True).first()
        if not first_location:
            return []
        location_id = first_location.id

    # Get all menu items with their categories
    items = db.query(MenuItem).join(MenuCategory).filter(
        MenuItem.location_id == location_id,
        MenuItem.is_available == True,
        MenuCategory.is_active == True
    ).order_by(MenuItem.display_order).all()

    # Format as flat list with category as string
    flat_menu = []
    for item in items:
        category = db.query(MenuCategory).filter(MenuCategory.id == item.category_id).first()
        flat_menu.append({
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "price": item.price,
            "category": category.name if category else "Uncategorized",
            "emoji": item.emoji,
            "image_url": item.image_url,
            "is_available": item.is_available,
            "location_id": item.location_id
        })

    return flat_menu


@router.get("/location/{location_id}", response_model=LocationMenu)
async def get_location_menu(location_id: str, db: Session = Depends(get_db)):
    """Get full menu for a specific location (public)"""
    location = db.query(Location).filter(Location.id == location_id).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    categories = db.query(MenuCategory).filter(
        MenuCategory.location_id == location_id,
        MenuCategory.is_active == True
    ).order_by(MenuCategory.display_order).all()
    
    categories_with_items = []
    for category in categories:
        items = db.query(MenuItem).filter(
            MenuItem.category_id == category.id,
            MenuItem.is_available == True
        ).order_by(MenuItem.display_order).all()
        
        categories_with_items.append(CategoryWithItems(
            id=category.id,
            location_id=category.location_id,
            name=category.name,
            description=category.description,
            emoji=category.emoji,
            display_order=category.display_order,
            is_active=category.is_active,
            created_at=category.created_at,
            items=[MenuItemResponse.model_validate(item) for item in items]
        ))
    
    return LocationMenu(
        location_id=location.id,
        location_name=location.name,
        categories=categories_with_items
    )


# ==================== Category Endpoints ====================

@router.get("/categories/{location_id}", response_model=List[CategoryResponse])
async def get_categories(location_id: str, db: Session = Depends(get_db)):
    """Get all categories for a location"""
    categories = db.query(MenuCategory).filter(
        MenuCategory.location_id == location_id
    ).order_by(MenuCategory.display_order).all()
    
    return categories


@router.post("/categories", response_model=CategoryResponse)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new category (manager or above for their location)"""
    # Check permissions
    if current_user.role.value != UserRole.OWNER.value:
        if not can_access_location(db, current_user, category_data.location_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this location"
            )
    
    # Verify location exists
    location = db.query(Location).filter(Location.id == category_data.location_id).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    new_category = MenuCategory(**category_data.model_dump())
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    
    return new_category


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    category_data: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a category"""
    category = db.query(MenuCategory).filter(MenuCategory.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check permissions
    if current_user.role.value != UserRole.OWNER.value:
        if not can_access_location(db, current_user, category.location_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this location"
            )
    
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    return category


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a category (soft delete)"""
    category = db.query(MenuCategory).filter(MenuCategory.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check permissions
    if current_user.role.value != UserRole.OWNER.value:
        if not can_access_location(db, current_user, category.location_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this location"
            )
    
    category.is_active = False
    db.commit()
    
    return {"message": "Category deleted successfully"}


# ==================== Menu Item Endpoints ====================

@router.get("/items/{location_id}", response_model=List[MenuItemResponse])
async def get_menu_items(
    location_id: str,
    available_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all menu items for a location"""
    query = db.query(MenuItem).filter(MenuItem.location_id == location_id)
    
    if available_only:
        query = query.filter(MenuItem.is_available == True)
    
    items = query.order_by(MenuItem.display_order).all()
    return items


@router.post("/items", response_model=MenuItemResponse)
async def create_menu_item(
    item_data: MenuItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new menu item"""
    # Check permissions
    if current_user.role.value != UserRole.OWNER.value:
        if not can_access_location(db, current_user, item_data.location_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this location"
            )
    
    # Verify category exists and belongs to the location
    category = db.query(MenuCategory).filter(
        MenuCategory.id == item_data.category_id,
        MenuCategory.location_id == item_data.location_id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found or doesn't belong to this location"
        )
    
    new_item = MenuItem(**item_data.model_dump())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return new_item


@router.put("/items/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    item_id: str,
    item_data: MenuItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a menu item"""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    
    # Check permissions
    if current_user.role.value != UserRole.OWNER.value:
        if not can_access_location(db, current_user, item.location_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this location"
            )
    
    update_data = item_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    db.commit()
    db.refresh(item)
    
    return item


@router.delete("/items/{item_id}")
async def delete_menu_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a menu item (sets unavailable)"""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    
    # Check permissions
    if current_user.role.value != UserRole.OWNER.value:
        if not can_access_location(db, current_user, item.location_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this location"
            )
    
    item.is_available = False
    db.commit()
    
    return {"message": "Menu item deleted successfully"}


@router.patch("/items/{item_id}/toggle")
async def toggle_item_availability(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle menu item availability (quick action for staff)"""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    
    # Check permissions
    if current_user.role.value != UserRole.OWNER.value:
        if not can_access_location(db, current_user, item.location_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this location"
            )
    
    item.is_available = not item.is_available
    db.commit()
    
    return {"is_available": item.is_available}
