"""
Mo's Burritos - Payment Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, List


class PaymentIntentRequest(BaseModel):
    """Request to create a Stripe payment intent"""
    amount: int = Field(..., description="Amount in cents")
    currency: str = Field(default="usd", description="Currency code")
    customerInfo: Dict = Field(..., description="Customer information")
    items: List[Dict] = Field(..., description="Order items")


class PaymentIntentResponse(BaseModel):
    """Response from creating a payment intent"""
    clientSecret: str = Field(..., description="Stripe client secret for frontend")
    paymentIntentId: str = Field(..., description="Stripe payment intent ID")


class VerifyPaymentRequest(BaseModel):
    """Request to verify a Stripe payment session"""
    sessionId: str = Field(..., description="Stripe session ID")
    orderId: str = Field(..., description="Order ID to update")


class VerifyPaymentResponse(BaseModel):
    """Response from payment verification"""
    success: bool
    message: str
    order_id: Optional[str] = None
