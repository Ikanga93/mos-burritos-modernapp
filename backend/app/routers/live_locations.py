"""
Mo's Burritos - Live Locations Routes (Food Truck Tracking)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import LiveLocation, User
from ..schemas import (
    LiveLocationCreate,
    LiveLocationUpdate,
    LiveLocationResponse,
    UserRole
)
from ..middleware import get_current_user

router = APIRouter(prefix="/live-locations", tags=["Live Locations"])


@router.get("", response_model=List[LiveLocationResponse])
async def get_live_locations(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all live locations (public - for food truck tracking)"""
    query = db.query(LiveLocation)

    if active_only:
        query = query.filter(LiveLocation.is_active == True)

    locations = query.order_by(LiveLocation.created_at.desc()).all()
    return locations


@router.get("/{location_id}", response_model=LiveLocationResponse)
async def get_live_location(
    location_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific live location by ID"""
    location = db.query(LiveLocation).filter(LiveLocation.id == location_id).first()

    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Live location not found"
        )

    return location


@router.post("", response_model=LiveLocationResponse)
async def create_live_location(
    location_data: LiveLocationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new live location (admin only)"""
    # Only managers and above can create live locations
    if current_user.role.value not in [UserRole.OWNER.value, UserRole.MANAGER.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and owners can create live locations"
        )

    new_location = LiveLocation(**location_data.model_dump())
    db.add(new_location)
    db.commit()
    db.refresh(new_location)

    return new_location


@router.put("/{location_id}", response_model=LiveLocationResponse)
async def update_live_location(
    location_id: str,
    location_data: LiveLocationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a live location (admin only)"""
    # Only managers and above can update live locations
    if current_user.role.value not in [UserRole.OWNER.value, UserRole.MANAGER.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and owners can update live locations"
        )

    location = db.query(LiveLocation).filter(LiveLocation.id == location_id).first()

    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Live location not found"
        )

    update_data = location_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)

    db.commit()
    db.refresh(location)

    return location


@router.delete("/{location_id}")
async def delete_live_location(
    location_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a live location (admin only - soft delete)"""
    # Only managers and above can delete live locations
    if current_user.role.value not in [UserRole.OWNER.value, UserRole.MANAGER.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and owners can delete live locations"
        )

    location = db.query(LiveLocation).filter(LiveLocation.id == location_id).first()

    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Live location not found"
        )

    # Soft delete by marking as inactive
    location.is_active = False
    db.commit()

    return {"message": "Live location deleted successfully", "location_id": location_id}
