"""
Mo's Burritos - Menu Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import base64
import uuid

from ..database import get_db
from ..models import Location, MenuCategory, MenuItem, User
from ..models.menu import MenuItemOptionGroup, MenuItemOption
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


# ==================== Image Upload Endpoint ====================

@router.post("/items/{item_id}/upload-image")
async def upload_menu_item_image(
    item_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload image for menu item

    For now, stores image as base64 data URL.
    In production, use cloud storage (S3, Cloudinary, etc.)
    """
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

    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/avif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, WebP, and AVIF images are allowed"
        )

    # Read file and convert to base64
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    data_url = f"data:{file.content_type};base64,{base64_image}"

    # Store data URL in database
    item.image_url = data_url
    db.commit()
    db.refresh(item)

    return {"image_url": data_url, "message": "Image uploaded successfully"}


# ==================== Option Groups Endpoints ====================

@router.get("/items/{item_id}/option-groups")
async def get_item_option_groups(
    item_id: str,
    db: Session = Depends(get_db)
):
    """Get all option groups for a menu item (public)"""
    option_groups = db.query(MenuItemOptionGroup).filter(
        MenuItemOptionGroup.menu_item_id == item_id
    ).order_by(MenuItemOptionGroup.display_order).all()

    result = []
    for group in option_groups:
        options = db.query(MenuItemOption).filter(
            MenuItemOption.option_group_id == group.id
        ).order_by(MenuItemOption.display_order).all()

        result.append({
            "id": group.id,
            "name": group.name,
            "is_required": group.is_required,
            "allow_multiple": group.allow_multiple,
            "min_selections": group.min_selections,
            "max_selections": group.max_selections,
            "display_order": group.display_order,
            "options": [
                {
                    "id": opt.id,
                    "name": opt.name,
                    "price_modifier": opt.price_modifier,
                    "is_default": opt.is_default,
                    "display_order": opt.display_order
                }
                for opt in options
            ]
        })

    return result


@router.post("/items/{item_id}/option-groups")
async def create_option_group(
    item_id: str,
    group_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create an option group for a menu item"""
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

    # Create option group
    new_group = MenuItemOptionGroup(
        menu_item_id=item_id,
        name=group_data.get("name"),
        is_required=group_data.get("is_required", False),
        allow_multiple=group_data.get("allow_multiple", False),
        min_selections=group_data.get("min_selections", 0),
        max_selections=group_data.get("max_selections"),
        display_order=group_data.get("display_order", 0)
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)

    # Create options if provided
    if "options" in group_data and group_data["options"]:
        for opt_data in group_data["options"]:
            new_option = MenuItemOption(
                option_group_id=new_group.id,
                name=opt_data.get("name"),
                price_modifier=opt_data.get("price_modifier", 0.0),
                is_default=opt_data.get("is_default", False),
                display_order=opt_data.get("display_order", 0)
            )
            db.add(new_option)
        db.commit()

    return {"id": new_group.id, "message": "Option group created successfully"}


@router.put("/option-groups/{group_id}")
async def update_option_group(
    group_id: str,
    group_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an option group"""
    group = db.query(MenuItemOptionGroup).filter(MenuItemOptionGroup.id == group_id).first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Option group not found"
        )

    # Get menu item to check permissions
    item = db.query(MenuItem).filter(MenuItem.id == group.menu_item_id).first()
    if current_user.role.value != UserRole.OWNER.value:
        if not can_access_location(db, current_user, item.location_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this location"
            )

    # Update group fields
    if "name" in group_data:
        group.name = group_data["name"]
    if "is_required" in group_data:
        group.is_required = group_data["is_required"]
    if "allow_multiple" in group_data:
        group.allow_multiple = group_data["allow_multiple"]
    if "min_selections" in group_data:
        group.min_selections = group_data["min_selections"]
    if "max_selections" in group_data:
        group.max_selections = group_data["max_selections"]
    if "display_order" in group_data:
        group.display_order = group_data["display_order"]

    db.commit()

    return {"message": "Option group updated successfully"}


@router.delete("/option-groups/{group_id}")
async def delete_option_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an option group and all its options"""
    group = db.query(MenuItemOptionGroup).filter(MenuItemOptionGroup.id == group_id).first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Option group not found"
        )

    # Get menu item to check permissions
    item = db.query(MenuItem).filter(MenuItem.id == group.menu_item_id).first()
    if current_user.role.value != UserRole.OWNER.value:
        if not can_access_location(db, current_user, item.location_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this location"
            )

    # Delete will cascade to options
    db.delete(group)
    db.commit()

    return {"message": "Option group deleted successfully"}


# ==================== Individual Options Endpoints ====================

@router.post("/option-groups/{group_id}/options")
async def create_option(
    group_id: str,
    option_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add an option to an option group"""
    group = db.query(MenuItemOptionGroup).filter(MenuItemOptionGroup.id == group_id).first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Option group not found"
        )

    # Check permissions
    item = db.query(MenuItem).filter(MenuItem.id == group.menu_item_id).first()
    if current_user.role.value != UserRole.OWNER.value:
        if not can_access_location(db, current_user, item.location_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this location"
            )

    new_option = MenuItemOption(
        option_group_id=group_id,
        name=option_data.get("name"),
        price_modifier=option_data.get("price_modifier", 0.0),
        is_default=option_data.get("is_default", False),
        display_order=option_data.get("display_order", 0)
    )
    db.add(new_option)
    db.commit()
    db.refresh(new_option)

    return {"id": new_option.id, "message": "Option created successfully"}


@router.delete("/options/{option_id}")
async def delete_option(
    option_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an individual option"""
    option = db.query(MenuItemOption).filter(MenuItemOption.id == option_id).first()

    if not option:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Option not found"
        )

    # Check permissions
    group = db.query(MenuItemOptionGroup).filter(MenuItemOptionGroup.id == option.option_group_id).first()
    item = db.query(MenuItem).filter(MenuItem.id == group.menu_item_id).first()
    if current_user.role.value != UserRole.OWNER.value:
        if not can_access_location(db, current_user, item.location_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this location"
            )

    db.delete(option)
    db.commit()

    return {"message": "Option deleted successfully"}
