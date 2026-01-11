"""
Mo's Burritos - Payment Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
import stripe
import os
from typing import Optional

from ..database import get_db
from ..models import Order, OrderStatus as ModelOrderStatus, PaymentStatus as ModelPaymentStatus
from ..schemas.payment import (
    PaymentIntentRequest,
    PaymentIntentResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse
)
from ..middleware import get_current_user

router = APIRouter(prefix="/api", tags=["Payment"])

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")


@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    request: PaymentIntentRequest,
    db: Session = Depends(get_db)
):
    """Create a Stripe payment intent for checkout"""
    try:
        # Create payment intent with Stripe
        intent = stripe.PaymentIntent.create(
            amount=request.amount,
            currency=request.currency,
            automatic_payment_methods={'enabled': True},
            metadata={
                'customer_name': request.customerInfo.get('name', ''),
                'customer_email': request.customerInfo.get('email', ''),
                'customer_phone': request.customerInfo.get('phone', ''),
                'items': str(request.items)
            }
        )

        return PaymentIntentResponse(
            clientSecret=intent.client_secret,
            paymentIntentId=intent.id
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment intent creation failed: {str(e)}"
        )


@router.post("/verify-payment", response_model=VerifyPaymentResponse)
async def verify_payment(
    request: VerifyPaymentRequest,
    db: Session = Depends(get_db)
):
    """Verify Stripe payment and update order status"""
    try:
        # Retrieve the payment intent from Stripe
        if request.sessionId.startswith('pi_'):
            # It's a payment intent ID
            payment_intent = stripe.PaymentIntent.retrieve(request.sessionId)
        else:
            # It's a checkout session ID
            session = stripe.checkout.Session.retrieve(request.sessionId)
            payment_intent = stripe.PaymentIntent.retrieve(session.payment_intent)

        # Check if payment was successful
        if payment_intent.status != 'succeeded':
            return VerifyPaymentResponse(
                success=False,
                message=f"Payment not completed. Status: {payment_intent.status}",
                order_id=request.orderId
            )

        # Update order in database
        order = db.query(Order).filter(Order.id == request.orderId).first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        # Update order with payment information
        order.payment_status = ModelPaymentStatus.PAID
        order.payment_intent_id = payment_intent.id
        order.stripe_session_id = request.sessionId
        order.status = ModelOrderStatus.CONFIRMED

        db.commit()
        db.refresh(order)

        return VerifyPaymentResponse(
            success=True,
            message="Payment verified successfully",
            order_id=str(order.id)
        )

    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification failed: {str(e)}"
        )


@router.post("/webhook/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db)
):
    """Handle Stripe webhook events"""
    payload = await request.body()

    try:
        # Verify webhook signature
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(
                payload, stripe_signature, STRIPE_WEBHOOK_SECRET
            )
        else:
            # For development without webhook secret
            import json
            event = json.loads(payload)

        # Handle the event
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']

            # Find order by payment intent ID
            order = db.query(Order).filter(
                Order.payment_intent_id == payment_intent['id']
            ).first()

            if order:
                order.payment_status = ModelPaymentStatus.PAID
                order.status = ModelOrderStatus.CONFIRMED
                db.commit()

        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']

            # Find order by payment intent ID
            order = db.query(Order).filter(
                Order.payment_intent_id == payment_intent['id']
            ).first()

            if order:
                order.payment_status = ModelPaymentStatus.FAILED
                db.commit()

        return {"status": "success"}

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload"
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing failed: {str(e)}"
        )
