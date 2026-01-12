import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Loader } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useToast } from '../../contexts/ToastContext'
import { orderApi } from '../../services/api/orderApi'
import './OrderSuccessPage.css'

const OrderSuccessPage = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { items, subtotal, tax, total, locationId, clearCart } = useCart()
    const { showToast } = useToast()
    
    const [isProcessing, setIsProcessing] = useState(true)
    const [orderId, setOrderId] = useState(null)
    const [error, setError] = useState(null)

    const sessionId = searchParams.get('session_id')

    useEffect(() => {
        const processOrder = async () => {
            if (!sessionId) {
                setError('No session ID found')
                setIsProcessing(false)
                return
            }

            try {
                // Get order confirmation data from sessionStorage
                const confirmationData = sessionStorage.getItem('orderConfirmation')
                if (!confirmationData) {
                    setError('Order data not found')
                    setIsProcessing(false)
                    return
                }

                const { customerInfo, customerId, locationId: storedLocationId, items: storedItems, subtotal, tax, total } = JSON.parse(confirmationData)

                // Create order in database
                // Always use publicClient to avoid token expiration issues after Stripe redirect
                // But include customer_id if user was authenticated
                const orderData = {
                    location_id: storedLocationId || locationId,
                    customer_id: customerId || null,  // Link to account if authenticated
                    customer_name: customerInfo.name,
                    customer_email: customerInfo.email,
                    customer_phone: customerInfo.phone,
                    items: storedItems.map(item => ({
                        item_id: item.menu_item_id || item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    })),
                    subtotal,
                    tax,
                    total,
                    stripe_session_id: sessionId,
                    payment_status: 'pending',
                    payment_method: 'online',
                    notes: customerInfo.notes || ''
                }

                // Always use guest order creation (publicClient) to avoid token expiration
                // The customer_id is included in the data to link to account
                const order = await orderApi.createGuestOrder(orderData)

                // Payment verification happens via Stripe webhook in the background
                // The webhook will update order status from PENDING -> CONFIRMED and payment_status to PAID
                // We just need to create the order with the stripe_session_id so webhook can find it

                // Clear cart and session storage
                clearCart()
                sessionStorage.removeItem('orderConfirmation')
                sessionStorage.removeItem('stripeSessionId')

                setOrderId(order.id)
                setIsProcessing(false)
                showToast('Order placed successfully! Payment is being processed.', 'success')

                // Redirect to order tracking after 2 seconds
                setTimeout(() => {
                    navigate(`/order-tracking/${order.id}`)
                }, 2000)
            } catch (error) {
                console.error('Error processing order:', error)
                setError(error.response?.data?.detail || error.message || 'Failed to process order')
                setIsProcessing(false)
                showToast('Failed to process order. Please contact support.', 'error')
            }
        }

        processOrder()
    }, [sessionId, navigate, clearCart, showToast, locationId])

    if (isProcessing) {
        return (
            <div className="order-success-page">
                <div className="success-container">
                    <Loader size={48} className="spin" />
                    <h2>Processing your order...</h2>
                    <p>Please wait while we confirm your payment and create your order.</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="order-success-page">
                <div className="success-container error">
                    <h2>Error Processing Order</h2>
                    <p>{error}</p>
                    <button className="retry-btn" onClick={() => navigate('/order-confirmation')}>
                        Go Back to Order Confirmation
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="order-success-page">
            <div className="success-container">
                <CheckCircle size={64} className="success-icon" />
                <h1>Order Placed Successfully!</h1>
                <p>Your payment has been processed and your order is being prepared.</p>
                {orderId && (
                    <p className="order-id">Order ID: {orderId}</p>
                )}
                <p className="redirect-message">Redirecting to order tracking...</p>
            </div>
        </div>
    )
}

export default OrderSuccessPage
