"""
Mo's Burritos - Order Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models import Order, OrderStatusHistory, Location, User, OrderStatus as ModelOrderStatus, PaymentStatus as ModelPaymentStatus
from ..schemas import (
    OrderCreate,
    OrderUpdate,
    OrderStatusUpdate,
    OrderResponse,
    OrderWithLocation,
    DashboardStats,
    OrderStatus,
    PaymentStatus,
    PaymentStatus
)
from ..middleware import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db)
):
    """Create a new order (public - anyone can order)"""
    # If no location provided, use first active location
    location_id = order_data.location_id
    if not location_id:
        first_location = db.query(Location).filter(Location.is_active == True).first()
        if not first_location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active locations available"
            )
        location_id = first_location.id

    # Verify location exists and is active
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.is_active == True
    ).first()

    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found or inactive"
        )
    
    # Calculate totals
    subtotal = sum(item.price * item.quantity for item in order_data.items)
    tax = round(subtotal * 0.0825, 2)  # 8.25% tax rate
    total = round(subtotal + tax, 2)

    # Create order
    new_order = Order(
        location_id=location_id,  # Use the resolved location_id
        customer_id=order_data.customer_id,  # Link to user account if provided
        customer_name=order_data.customer_name,
        customer_phone=order_data.customer_phone,
        customer_email=order_data.customer_email,
        items=[item.model_dump() for item in order_data.items],
        subtotal=subtotal,
        tax=tax,
        total=total,
        notes=order_data.notes,
        payment_method=order_data.payment_method,
        payment_status=ModelPaymentStatus(order_data.payment_status.value) if order_data.payment_status else ModelPaymentStatus.PENDING,
        payment_intent_id=order_data.payment_intent_id,
        stripe_session_id=order_data.stripe_session_id,
        status=ModelOrderStatus.PENDING
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    # Add to status history
    status_history = OrderStatusHistory(
        order_id=new_order.id,
        status=ModelOrderStatus.PENDING,
        notes="Order created"
    )
    db.add(status_history)
    db.commit()
    
    return new_order


@router.get("", response_model=List[OrderResponse])
async def get_orders(
    location_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    status_filter: Optional[OrderStatus] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get orders (public for admin dashboard)"""
    query = db.query(Order)

    # Filter by customer ID
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)

    # Filter by location
    if location_id:
        query = query.filter(Order.location_id == location_id)

    # Filter by status
    if status_filter:
        query = query.filter(Order.status == status_filter)

    orders = query.order_by(Order.created_at.desc()).limit(limit).all()
    return orders


@router.get("/my-orders", response_model=List[OrderResponse])
async def get_my_orders(
    current_user: User = Depends(get_current_user),
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all orders for the authenticated customer"""
    orders = db.query(Order).filter(
        Order.customer_id == current_user.id
    ).order_by(Order.created_at.desc()).limit(limit).all()

    return orders


@router.get("/customer/{customer_id}", response_model=List[OrderResponse])
async def get_customer_orders(
    customer_id: str,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all orders for a specific customer (public - for order tracking)"""
    orders = db.query(Order).filter(
        Order.customer_id == customer_id
    ).order_by(Order.created_at.desc()).limit(limit).all()

    return orders


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific order by ID (for tracking)"""
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return order


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status_patch(
    order_id: str,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update order status - PATCH method (public)"""
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Update status
    old_status = order.status
    order.status = ModelOrderStatus(status_update.status.value)

    # Set completed_at if order is completed or cancelled
    if status_update.status in [OrderStatus.COMPLETED, OrderStatus.CANCELLED]:
        order.completed_at = datetime.utcnow()

    # Add to status history
    status_history = OrderStatusHistory(
        order_id=order.id,
        status=order.status,
        changed_by=None,
        notes=status_update.notes or f"Status changed from {old_status.value} to {order.status.value}"
    )
    db.add(status_history)

    db.commit()
    db.refresh(order)

    return order


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status_put(
    order_id: str,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update order status - PUT method (public)"""
    # Same implementation as PATCH
    return await update_order_status_patch(order_id, status_update, db)


@router.patch("/{order_id}/payment", response_model=OrderResponse)
async def update_payment_status(
    order_id: str,
    payment_status: PaymentStatus,
    db: Session = Depends(get_db)
):
    """Update payment status for an order"""
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    order.payment_status = payment_status
    db.commit()
    db.refresh(order)

    return order


@router.put("/{order_id}/reset-to-cooking")
async def reset_order_to_cooking(
    order_id: str,
    estimated_time: int = 15,
    db: Session = Depends(get_db)
):
    """Reset order to preparing status with custom estimated time"""
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Reset order status
    order.status = ModelOrderStatus.PREPARING
    order.estimated_time = estimated_time
    order.estimated_completion = datetime.utcnow() + timedelta(minutes=estimated_time)
    order.completed_at = None

    # Add to status history
    status_history = OrderStatusHistory(
        order_id=order.id,
        status=ModelOrderStatus.PREPARING,
        changed_by=None,
        notes=f"Order reset to cooking with {estimated_time} minutes estimated time"
    )
    db.add(status_history)

    db.commit()
    db.refresh(order)

    return {
        "message": "Order reset to cooking successfully",
        "order_id": order.id,
        "estimated_time": estimated_time,
        "estimated_completion": order.estimated_completion
    }


@router.patch("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: str,
    reason: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel an order
    - Customers can cancel their own orders if status is PENDING or CONFIRMED
    - Admin (public) can cancel any order at any time
    """
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Check if order is already cancelled or completed
    if order.status == ModelOrderStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already cancelled"
        )
    
    if order.status == ModelOrderStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel a completed order"
        )

    # Permission checks for CUSTOMERS ONLY
    # If a user is logged in, we check if they own the order
    # If no user is logged in, we assume it's an admin/public action (dashboard)
    
    if current_user:
        # Check if user is acting as a customer
        is_owner = order.customer_id == current_user.id
        
        # If user is logged in but NOT the owner and NOT making an authenticated admin request (which we've mostly removed)
        # We can treat them as a customer. 
        # Ideally, we'd rely on the "public" nature of the dashboard now.
        # But if they ARE logged in as a customer, we enforce customer rules.
        
        if is_owner:
            if order.status not in [ModelOrderStatus.PENDING, ModelOrderStatus.CONFIRMED]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You can only cancel orders that are pending or confirmed. Please contact the restaurant."
                )

    # Update order status
    old_status = order.status
    order.status = ModelOrderStatus.CANCELLED
    order.completed_at = datetime.utcnow()

    # Determine cancellation notes
    if reason:
        notes = reason
    elif current_user:
        notes = f"Order cancelled by user ({current_user.email})"
    else:
        notes = "Order cancelled"

    # Add to status history
    status_history = OrderStatusHistory(
        order_id=order.id,
        status=ModelOrderStatus.CANCELLED,
        changed_by=current_user.id if current_user else None,
        notes=notes
    )
    db.add(status_history)

    db.commit()
    db.refresh(order)

    return order


@router.delete("/{order_id}")
async def delete_order(
    order_id: str,
    db: Session = Depends(get_db)
):
    """Delete an order (public - soft delete by setting cancelled status)"""
    # NOTE: Making this public creates a risk of abuse, but aligns with request for no-auth dashboard
    
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Soft delete by marking as cancelled
    order.status = ModelOrderStatus.CANCELLED
    order.completed_at = datetime.utcnow()

    # Add to status history
    status_history = OrderStatusHistory(
        order_id=order.id,
        status=ModelOrderStatus.CANCELLED,
        changed_by=None,
        notes="Order deleted"
    )
    db.add(status_history)

    db.commit()

    return {"message": "Order deleted successfully", "order_id": order.id}


@router.get("/dashboard/{location_id}", response_model=DashboardStats)
async def get_dashboard_stats(
    location_id: str,
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for a location"""
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Today's date range
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    # Query today's orders
    today_orders = db.query(Order).filter(
        Order.location_id == location_id,
        Order.created_at >= today_start,
        Order.created_at < today_end
    ).all()
    
    # Calculate stats
    orders_today = len(today_orders)
    orders_pending = len([o for o in today_orders if o.status == ModelOrderStatus.PENDING])
    orders_preparing = len([o for o in today_orders if o.status == ModelOrderStatus.PREPARING])
    orders_ready = len([o for o in today_orders if o.status == ModelOrderStatus.READY])
    
    completed_orders = [o for o in today_orders if o.status == ModelOrderStatus.COMPLETED]
    revenue_today = sum(o.total for o in completed_orders)
    average_order_value = revenue_today / len(completed_orders) if completed_orders else 0
    
    return DashboardStats(
        location_id=location_id,
        location_name=location.name,
        orders_today=orders_today,
        orders_pending=orders_pending,
        orders_preparing=orders_preparing,
        orders_ready=orders_ready,
        revenue_today=round(revenue_today, 2),
        average_order_value=round(average_order_value, 2)
    )
