"""
Mo's Burritos - Location Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Location, User, UserLocation
from ..schemas import (
    LocationCreate,
    LocationUpdate,
    LocationResponse,
    LocationWithStats,
    UserRole
)
from ..middleware import get_current_user, require_owner, require_manager_or_above
from ..services import can_access_location

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("", response_model=List[LocationResponse])
async def get_locations(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all locations (public endpoint)"""
    try:
        query = db.query(Location)
        if active_only:
            query = query.filter(Location.is_active == True)

        locations = query.order_by(Location.name).all()
        return locations
    except Exception as e:
        # Return the actual error for debugging
        import traceback
        error_detail = f"Database error: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail
        )


@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(location_id: str, db: Session = Depends(get_db)):
    """Get a specific location by ID"""
    location = db.query(Location).filter(Location.id == location_id).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    return location


@router.post("", response_model=LocationResponse)
async def create_location(
    location_data: LocationCreate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    """Create a new location (owner only)"""
    new_location = Location(**location_data.model_dump())
    
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    
    return new_location


@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: str,
    location_data: LocationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a location (manager or above for assigned location, owner for any)"""
    location = db.query(Location).filter(Location.id == location_id).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Check permissions
    if current_user.role.value != UserRole.OWNER.value:
        if not can_access_location(db, current_user, location_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this location"
            )
    
    # Update fields
    update_data = location_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)
    
    db.commit()
    db.refresh(location)
    
    return location


@router.delete("/{location_id}")
async def delete_location(
    location_id: str,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    """Delete a location (owner only) - soft delete by setting inactive"""
    location = db.query(Location).filter(Location.id == location_id).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    location.is_active = False
    db.commit()
    
    return {"message": "Location deleted successfully"}


@router.get("/{location_id}/staff", response_model=List[dict])
async def get_location_staff(
    location_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get staff assigned to a location"""
    # Check permissions
    if current_user.role.value != UserRole.OWNER.value:
        if not can_access_location(db, current_user, location_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this location"
            )
    
    assignments = db.query(UserLocation).filter(
        UserLocation.location_id == location_id,
        UserLocation.is_active == True
    ).all()
    
    result = []
    for assignment in assignments:
        user = db.query(User).filter(User.id == assignment.user_id).first()
        if user:
            result.append({
                "user_id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": assignment.role.value,
                "assigned_at": assignment.assigned_at
            })
    
    return result
