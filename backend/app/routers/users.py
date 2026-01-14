"""
Mo's Burritos - User Management Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, UserLocation, Location, Order, UserRole as ModelUserRole, LocationRole as ModelLocationRole, OrderStatus as ModelOrderStatus
from ..schemas import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserWithLocations,
    LocationAssignment,
    AssignUserToLocation,
    UserRole,
    LocationRole
)
router = APIRouter(prefix="/users", tags=["Users"])


# ==================== User Management (No Auth Required) ====================

@router.get("", response_model=List[UserResponse])
async def get_users(
    role_filter: UserRole = None,
    db: Session = Depends(get_db)
):
    """Get all users (owner only)"""
    query = db.query(User)
    
    if role_filter:
        query = query.filter(User.role == role_filter)
    
    users = query.order_by(User.created_at.desc()).all()
    return users


@router.get("/{user_id}", response_model=UserWithLocations)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get location assignments
    assignments = db.query(UserLocation).filter(
        UserLocation.user_id == user_id,
        UserLocation.is_active == True
    ).all()
    
    locations = []
    for assignment in assignments:
        location = db.query(Location).filter(Location.id == assignment.location_id).first()
        if location:
            locations.append(LocationAssignment(
                location_id=location.id,
                location_name=location.name,
                role=LocationRole(assignment.role.value),
                assigned_at=assignment.assigned_at
            ))
    
    return UserWithLocations(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        role=UserRole(user.role.value),
        is_active=user.is_active,
        created_at=user.created_at,
        locations=locations
    )


@router.get("/{user_id}/locations", response_model=List[LocationAssignment])
async def get_user_locations(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get a user's assigned locations"""
    # Get location assignments
    assignments = db.query(UserLocation).filter(
        UserLocation.user_id == user_id,
        UserLocation.is_active == True
    ).all()

    locations = []
    for assignment in assignments:
        location = db.query(Location).filter(Location.id == assignment.location_id).first()
        if location:
            locations.append(LocationAssignment(
                location_id=location.id,
                location_name=location.name,
                role=LocationRole(assignment.role.value),
                assigned_at=assignment.assigned_at
            ))

    return locations


@router.post("", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Create a new user (owner only)"""
    # Check if email exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Convert role string to Enum properly
    model_role = ModelUserRole(user_data.role.value)
    
    # Handle empty phone string as None to avoid unique constraint violation
    phone_val = user_data.phone
    if phone_val is not None and not phone_val.strip():
        phone_val = None
    
    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=phone_val,
        role=model_role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db)
):
    """Update a user"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    update_data = user_data.model_dump(exclude_unset=True)
    
    # Handle empty phone string to avoid unique constraint violation
    if "phone" in update_data and update_data["phone"] is not None and not update_data["phone"].strip():
        update_data["phone"] = None

    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/assign-location")
async def assign_user_to_location(
    assignment_data: AssignUserToLocation,
    db: Session = Depends(get_db)
):
    """Assign a user to a location (owner only)"""
    # Verify user exists
    user = db.query(User).filter(User.id == assignment_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify location exists
    location = db.query(Location).filter(Location.id == assignment_data.location_id).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Check if already assigned
    existing = db.query(UserLocation).filter(
        UserLocation.user_id == assignment_data.user_id,
        UserLocation.location_id == assignment_data.location_id
    ).first()
    
    if existing:
        # Update existing assignment
        existing.role = ModelLocationRole(assignment_data.role.value)
        existing.is_active = True
        db.commit()
        return {"message": "User assignment updated"}
    
    # Create new assignment
    new_assignment = UserLocation(
        user_id=assignment_data.user_id,
        location_id=assignment_data.location_id,
        role=ModelLocationRole(assignment_data.role.value),
        assigned_by=None
    )
    
    db.add(new_assignment)
    db.commit()
    
    return {"message": "User assigned to location successfully"}


@router.delete("/unassign/{user_id}/{location_id}")
async def unassign_user_from_location(
    user_id: str,
    location_id: str,
    db: Session = Depends(get_db)
):
    """Remove a user from a location (owner only)"""
    assignment = db.query(UserLocation).filter(
        UserLocation.user_id == user_id,
        UserLocation.location_id == location_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    assignment.is_active = False
    db.commit()

    return {"message": "User removed from location successfully"}


# ==================== Admin Endpoints ====================

@router.get("/admin/users", response_model=List[UserResponse])
async def admin_get_users(
    role_filter: UserRole = None,
    db: Session = Depends(get_db)
):
    """Get all users (admin alias)"""
    # This is an alias for the main GET /users endpoint
    return await get_users(role_filter, db)


@router.get("/admin/customers")
async def admin_get_customers(
    db: Session = Depends(get_db)
):
    """Get all customers (both registered users and guest orders) - owner only"""
    # Get registered customers
    registered_customers = db.query(User).filter(
        User.role == ModelUserRole.CUSTOMER
    ).all()

    # Get guest customers from orders (those without customer_id)
    guest_orders = db.query(Order).filter(
        Order.customer_id == None
    ).all()

    # Format registered customers
    customers = []
    for customer in registered_customers:
        # Get customer's orders
        orders = db.query(Order).filter(Order.customer_id == customer.id).all()
        total_spent = sum(order.total for order in orders if order.status == ModelOrderStatus.COMPLETED)
        last_order = max(orders, key=lambda o: o.created_at) if orders else None

        customers.append({
            "id": customer.id,
            "type": "registered",
            "name": f"{customer.first_name or ''} {customer.last_name or ''}".strip() or "Unknown",
            "email": customer.email,
            "phone": customer.phone,
            "order_count": len(orders),
            "total_spent": round(total_spent, 2),
            "last_order_date": last_order.created_at if last_order else None,
            "created_at": customer.created_at
        })

    # Add guest customers (group by email or phone)
    guest_customers_map = {}
    for order in guest_orders:
        key = order.customer_email or order.customer_phone
        if key:
            if key not in guest_customers_map:
                guest_customers_map[key] = {
                    "id": f"guest_{key}",
                    "type": "guest",
                    "name": order.customer_name,
                    "email": order.customer_email,
                    "phone": order.customer_phone,
                    "order_count": 0,
                    "total_spent": 0,
                    "last_order_date": order.created_at,
                    "created_at": order.created_at
                }

            guest_customers_map[key]["order_count"] += 1
            if order.status == ModelOrderStatus.COMPLETED:
                guest_customers_map[key]["total_spent"] += order.total
            if order.created_at > guest_customers_map[key]["last_order_date"]:
                guest_customers_map[key]["last_order_date"] = order.created_at

    # Round total_spent for guests
    for guest in guest_customers_map.values():
        guest["total_spent"] = round(guest["total_spent"], 2)
        customers.append(guest)

    # Sort by last order date (most recent first)
    customers.sort(key=lambda c: c["last_order_date"] if c["last_order_date"] else c["created_at"], reverse=True)

    return {
        "total_customers": len(customers),
        "registered_count": len(registered_customers),
        "guest_count": len(guest_customers_map),
        "customers": customers
    }


@router.delete("/admin/customers/{customer_id}")
async def admin_delete_customer(
    customer_id: str,
    db: Session = Depends(get_db)
):
    """Delete a customer and all their orders (owner only)"""
    # Find customer
    customer = db.query(User).filter(
        User.id == customer_id,
        User.role == ModelUserRole.CUSTOMER
    ).first()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    # Mark all customer's orders as cancelled
    orders = db.query(Order).filter(Order.customer_id == customer_id).all()
    for order in orders:
        order.status = ModelOrderStatus.CANCELLED

    # Soft delete customer by marking inactive
    customer.is_active = False

    db.commit()

    return {
        "message": "Customer deleted successfully",
        "customer_id": customer_id,
        "orders_cancelled": len(orders)
    }
