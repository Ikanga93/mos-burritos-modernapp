"""
Mo's Burritos - Admin Routes
Endpoints under /api/admin prefix
"""
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
from pathlib import Path

from ..database import get_db
from ..models import User, Order, UserRole as ModelUserRole, OrderStatus as ModelOrderStatus
from ..schemas import UserRole
from ..middleware import get_current_user, require_owner

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/customers")
async def admin_get_customers(
    current_user: User = Depends(require_owner),
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
    total_orders_count = 0
    total_revenue = 0

    for customer in registered_customers:
        # Get customer's orders
        orders = db.query(Order).filter(Order.customer_id == customer.id).all()
        total_spent = sum(order.total for order in orders if order.status == ModelOrderStatus.COMPLETED)
        last_order = max(orders, key=lambda o: o.created_at) if orders else None

        total_orders_count += len(orders)
        total_revenue += total_spent

        customers.append({
            "id": customer.id,
            "type": "registered",
            "name": f"{customer.first_name or ''} {customer.last_name or ''}".strip() or "Unknown",
            "email": customer.email,
            "phone": customer.phone,
            "totalOrders": len(orders),  # Changed from order_count
            "totalSpent": round(total_spent, 2),  # Changed from total_spent
            "lastOrderDate": last_order.created_at.isoformat() if last_order else None,  # Changed from last_order_date
            "registeredDate": customer.created_at.isoformat(),  # Added
            "isRegistered": True,  # Added
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
                    "totalOrders": 0,  # Changed from order_count
                    "totalSpent": 0,  # Changed from total_spent
                    "lastOrderDate": order.created_at.isoformat(),  # Changed from last_order_date
                    "firstOrderDate": order.created_at.isoformat(),  # Added
                    "isRegistered": False,  # Added
                    "created_at": order.created_at
                }

            guest_customers_map[key]["totalOrders"] += 1
            if order.status == ModelOrderStatus.COMPLETED:
                guest_customers_map[key]["totalSpent"] += order.total
                total_orders_count += 1
                total_revenue += order.total
            if order.created_at > guest_customers_map[key]["created_at"]:
                guest_customers_map[key]["lastOrderDate"] = order.created_at.isoformat()

    # Round totalSpent for guests and add to customers list
    for guest in guest_customers_map.values():
        guest["totalSpent"] = round(guest["totalSpent"], 2)
        customers.append(guest)

    # Sort by last order date (most recent first)
    customers.sort(key=lambda c: c.get("lastOrderDate") or c["created_at"].isoformat(), reverse=True)

    return {
        "customers": customers,
        "summary": {
            "totalCustomers": len(customers),
            "registeredCount": len(registered_customers),
            "guestCount": len(guest_customers_map),
            "totalOrders": total_orders_count,
            "totalRevenue": round(total_revenue, 2)
        }
    }


@router.delete("/customers/{customer_id}")
async def admin_delete_customer(
    customer_id: str,
    current_user: User = Depends(require_owner),
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

    # Delete customer's orders first
    db.query(Order).filter(Order.customer_id == customer_id).delete()

    # Delete customer
    db.delete(customer)
    db.commit()

    return {"message": "Customer and their orders deleted successfully"}


@router.post("/upload-menu-image")
async def upload_menu_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a menu item image (manager or above)"""
    # Verify user has admin privileges
    admin_roles = ['owner', 'manager', 'staff']
    if current_user.role.value not in admin_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff can upload menu images"
        )

    # Validate file type
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )

    # For now, just return a placeholder URL since we don't have cloud storage configured
    # In production, you would upload to S3/Cloudinary/Supabase Storage
    # Generate a unique filename
    file_ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_ext}"

    # Return a placeholder URL
    # TODO: Implement actual file upload to cloud storage (S3/Cloudinary/Supabase)
    image_url = f"/uploads/menu/{unique_filename}"

    return {
        "success": True,
        "url": image_url,
        "message": "Image upload endpoint ready (cloud storage not configured yet)"
    }
