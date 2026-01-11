import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Loader } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useToast } from '../../contexts/ToastContext'
import { paymentApi } from '../../services/api/paymentApi'
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

                const { customerInfo, locationId: storedLocationId, items: storedItems, subtotal, tax, total } = JSON.parse(confirmationData)

                // Verify payment with Stripe
                const verification = await paymentApi.verifyPayment(sessionId, '')

                if (!verification.success) {
                    setError(verification.message || 'Payment verification failed')
                    setIsProcessing(false)
                    return
                }

                // Create order in database
                const orderData = {
                    location_id: storedLocationId || locationId,
                    customer_name: customerInfo.name,
                    customer_email: customerInfo.email,
                    customer_phone: customerInfo.phone,
                    items: storedItems.map(item => ({
                        menu_item_id: item.menu_item_id || item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    })),
                    subtotal,
                    tax,
                    total,
                    payment_intent_id: sessionId,
                    payment_status: 'paid',
                    notes: customerInfo.notes || ''
                }

                const order = await orderApi.createOrder(orderData)

                // Clear cart and session storage
                clearCart()
                sessionStorage.removeItem('orderConfirmation')
                sessionStorage.removeItem('stripeSessionId')

                setOrderId(order.id)
                setIsProcessing(false)
                showToast('Order placed successfully!', 'success')

                // Redirect to order tracking after 3 seconds
                setTimeout(() => {
                    navigate(`/order-tracking/${order.id}`)
                }, 3000)
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
