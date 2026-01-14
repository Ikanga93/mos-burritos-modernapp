import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Loader } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { useToast } from '../../contexts/ToastContext'
import { orderApi } from '../../services/api/orderApi'
import { paymentApi } from '../../services/api/paymentApi'
import './OrderSuccessPage.css'

const OrderSuccessPage = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { items, subtotal, tax, total, locationId, clearCart } = useCart()
    const { isAuthenticated, customer } = useCustomerAuth()
    const { showToast } = useToast()
    
    const [isProcessing, setIsProcessing] = useState(true)
    const [orderId, setOrderId] = useState(null)
    const [error, setError] = useState(null)

    const sessionId = searchParams.get('session_id')

    useEffect(() => {
        const processOrder = async () => {
            console.log('=== ORDER SUCCESS PAGE - Starting processOrder ===')
            console.log('Session ID:', sessionId)
            console.log('Cart items:', items)
            console.log('Is authenticated:', isAuthenticated)
            console.log('Customer:', customer)
            
            if (!sessionId) {
                console.error('No session ID found in URL')
                setError('No session ID found')
                setIsProcessing(false)
                return
            }

            try {
                // Try to get order confirmation data from sessionStorage
                let confirmationData = sessionStorage.getItem('orderConfirmation')
                let orderInfo = null
                
                console.log('SessionStorage data:', confirmationData ? 'Found' : 'Missing')

                if (confirmationData) {
                    // Happy path: We have the data in sessionStorage
                    console.log('Using sessionStorage data')
                    orderInfo = JSON.parse(confirmationData)
                } else {
                    // Fallback 1: Try to use cart context (if cart hasn't been cleared)
                    console.log('SessionStorage missing, attempting fallback with cart and Stripe data...')
                    
                    if (items && items.length > 0) {
                        // We have cart items, use them with whatever customer info we have
                        console.log('Using cart data with authenticated user info')
                        orderInfo = {
                            customerInfo: {
                                name: isAuthenticated && customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 'Guest Customer',
                                email: isAuthenticated && customer ? customer.email : '',
                                phone: isAuthenticated && customer ? customer.phone : '',
                                notes: ''
                            },
                            customerId: isAuthenticated && customer ? customer.id : null,
                            locationId: locationId,
                            items: items,
                            subtotal: subtotal,
                            tax: tax,
                            total: total,
                            isGuest: !isAuthenticated
                        }
                        console.log('Successfully reconstructed order data from cart and user info')
                    } else {
                        // Fallback 2: No cart, no sessionStorage - this shouldn't happen in normal flow
                        // Just show a user-friendly error and redirect
                        console.warn('No order data available - cart is empty and sessionStorage is missing')
                        setError('Your order information could not be found. Please check your email for order confirmation.')
                        setIsProcessing(false)
                        showToast('Order confirmation email has been sent. Check your inbox.', 'info')
                        setTimeout(() => {
                            navigate('/menu')
                        }, 3000)
                        return
                    }
                }

                if (!orderInfo) {
                    console.error('Order info is null after all attempts')
                    throw new Error('Order information unavailable')
                }

                console.log('Final orderInfo:', orderInfo)

                const { customerInfo, customerId, locationId: storedLocationId, items: storedItems, subtotal: storedSubtotal, tax: storedTax, total: storedTotal } = orderInfo

                console.log('Creating order with data:', {
                    customerId,
                    customerName: customerInfo.name,
                    itemCount: storedItems?.length || 0,
                    total: storedTotal
                })

                // Create order in database
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
                    subtotal: storedSubtotal,
                    tax: storedTax,
                    total: storedTotal,
                    stripe_session_id: sessionId,
                    payment_status: 'pending',
                    payment_method: 'online',
                    notes: customerInfo.notes || ''
                }

                // Use authenticated order creation if user is logged in, otherwise guest order
                // This ensures the order is properly linked to the user's account
                let order
                if (isAuthenticated && customerId) {
                    order = await orderApi.createOrder(orderData)
                } else {
                    order = await orderApi.createGuestOrder(orderData)
                }

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
                const errorMessage = error.response?.data?.detail || error.message || 'Failed to process order'
                setError(errorMessage)
                setIsProcessing(false)
                
                // Show user-friendly error message
                if (errorMessage.includes('order information')) {
                    showToast('Please check your email for order confirmation', 'info')
                } else {
                    showToast('There was an issue processing your order. Please contact support if you were charged.', 'error')
                }
            }
        }

        processOrder()
    }, [sessionId, navigate, clearCart, showToast, locationId, items, subtotal, tax, total, isAuthenticated, customer])

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
                    <button className="retry-btn" onClick={() => navigate('/menu')}>
                        Go Back to Menu
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
