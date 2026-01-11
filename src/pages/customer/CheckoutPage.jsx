import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CreditCard, MapPin, User, Phone, Mail, ArrowLeft, ShoppingBag, Loader } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useLocation } from '../../contexts/LocationContext'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { useToast } from '../../contexts/ToastContext'
import { paymentApi } from '../../services/api/paymentApi'
import { orderApi } from '../../services/api/orderApi'
import './CheckoutPage.css'

// Initialize Stripe with publishable key from env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

const CheckoutForm = ({ customerInfo, setCustomerInfo, onSuccess }) => {
    const stripe = useStripe()
    const elements = useElements()
    const navigate = useNavigate()

    const { items, subtotal, tax, total, locationId, clearCart } = useCart()
    const { locations } = useLocation()
    const { showToast } = useToast()

    const [isProcessing, setIsProcessing] = useState(false)
    const [errors, setErrors] = useState({})

    const selectedLocation = locations.find(loc => loc.id === locationId)

    const validateForm = () => {
        const newErrors = {}
        if (!customerInfo.name.trim()) newErrors.name = 'Name is required'
        if (!customerInfo.email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
            newErrors.email = 'Invalid email format'
        }
        if (!customerInfo.phone.trim()) {
            newErrors.phone = 'Phone is required'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return
        if (!stripe || !elements) return

        setIsProcessing(true)

        try {
            // 1. Create payment intent
            const amountInCents = Math.round(total * 100)
            const paymentIntentResponse = await paymentApi.createPaymentIntent(
                amountInCents,
                'usd',
                customerInfo,
                items
            )

            // 2. Confirm the payment with Stripe
            const cardElement = elements.getElement(CardElement)
            const { error, paymentIntent } = await stripe.confirmCardPayment(
                paymentIntentResponse.clientSecret,
                {
                    payment_method: {
                        card: cardElement,
                        billing_details: {
                            name: customerInfo.name,
                            email: customerInfo.email,
                            phone: customerInfo.phone
                        }
                    }
                }
            )

            if (error) {
                showToast(error.message, 'error')
                setIsProcessing(false)
                return
            }

            if (paymentIntent.status === 'succeeded') {
                // 3. Create order in our system
                const orderData = {
                    location_id: locationId,
                    customer_name: customerInfo.name,
                    customer_email: customerInfo.email,
                    customer_phone: customerInfo.phone,
                    items: items.map(item => ({
                        menu_item_id: item.menu_item_id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    })),
                    subtotal,
                    tax,
                    total,
                    payment_intent_id: paymentIntent.id,
                    payment_status: 'paid',
                    notes: customerInfo.notes || ''
                }

                const order = await orderApi.createOrder(orderData)

                // 4. Clear cart and redirect to tracking
                clearCart()
                showToast('Order placed successfully!', 'success')
                navigate(`/order-tracking/${order.id}`)
            }
        } catch (error) {
            console.error('Checkout error:', error)
            showToast(error.message || 'Checkout failed. Please try again.', 'error')
        } finally {
            setIsProcessing(false)
        }
    }

    const formatPrice = (price) => `$${parseFloat(price).toFixed(2)}`

    return (
        <form onSubmit={handleSubmit} className="checkout-form">
            {/* Customer Info Display (Read-only from account) */}
            <div className="checkout-section">
                <h3><User size={20} /> Customer Information</h3>
                <div className="customer-info-display">
                    <div className="info-row">
                        <span className="info-label">Name:</span>
                        <span className="info-value">{customerInfo.name || 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Email:</span>
                        <span className="info-value">{customerInfo.email || 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Phone:</span>
                        <span className="info-value">{customerInfo.phone || 'Not provided'}</span>
                    </div>
                    {customerInfo.notes && (
                        <div className="info-row">
                            <span className="info-label">Special Instructions:</span>
                            <span className="info-value">{customerInfo.notes}</span>
                        </div>
                    )}
                </div>
                <p className="info-note">Information from your account. To update, visit your profile.</p>
            </div>

            {/* Pickup Location */}
            <div className="checkout-section">
                <h3><MapPin size={20} /> Pickup Location</h3>
                <div className="pickup-location-card">
                    {selectedLocation ? (
                        <>
                            <strong>{selectedLocation.name}</strong>
                            <p>{selectedLocation.address}</p>
                            {selectedLocation.hours && (
                                <p className="location-hours">{selectedLocation.hours}</p>
                            )}
                        </>
                    ) : (
                        <p>No location selected</p>
                    )}
                </div>
            </div>

            {/* Payment Section */}
            <div className="checkout-section">
                <h3><CreditCard size={20} /> Payment</h3>
                <div className="card-element-container">
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#333',
                                    '::placeholder': { color: '#aab7c4' }
                                },
                                invalid: { color: '#dc3545' }
                            }
                        }}
                    />
                </div>
                <p className="payment-note">
                    Your card will be charged {formatPrice(total)}
                </p>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                className="checkout-submit-btn"
                disabled={!stripe || isProcessing || items.length === 0}
            >
                {isProcessing ? (
                    <>
                        <Loader size={20} className="spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <ShoppingBag size={20} />
                        Place Order - {formatPrice(total)}
                    </>
                )}
            </button>
        </form>
    )
}

const CheckoutPage = () => {
    const navigate = useNavigate()
    const { items, subtotal, tax, total } = useCart()
    const { customer, isAuthenticated } = useCustomerAuth()

    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: '',
        notes: ''
    })

    // Load customer info from order confirmation or pre-fill if logged in
    useEffect(() => {
        // First, try to load from order confirmation
        const confirmationData = sessionStorage.getItem('orderConfirmation')
        if (confirmationData) {
            try {
                const data = JSON.parse(confirmationData)
                setCustomerInfo(data.customerInfo)
                // Clear the session storage after loading
                sessionStorage.removeItem('orderConfirmation')
            } catch (error) {
                console.error('Error loading confirmation data:', error)
            }
        } else if (isAuthenticated && customer) {
            // Fallback to logged-in user data
            setCustomerInfo({
                name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
                email: customer.email || '',
                phone: customer.phone || '',
                notes: ''
            })
        }
    }, [isAuthenticated, customer])

    // Redirect if cart is empty or if no confirmation data
    useEffect(() => {
        if (items.length === 0) {
            navigate('/menu')
            return
        }
        
        // If no confirmation data and not logged in, redirect to confirmation page
        const confirmationData = sessionStorage.getItem('orderConfirmation')
        if (!confirmationData && !isAuthenticated) {
            navigate('/order-confirmation')
        }
    }, [items, navigate, isAuthenticated])

    const formatPrice = (price) => `$${parseFloat(price).toFixed(2)}`

    if (items.length === 0) {
        return null
    }

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                {/* Header */}
                <div className="checkout-header">
                    <button className="back-btn" onClick={() => navigate('/menu')}>
                        <ArrowLeft size={20} />
                        Back to Menu
                    </button>
                    <h1>Checkout</h1>
                </div>

                <div className="checkout-content">
                    {/* Left: Form */}
                    <div className="checkout-form-section">
                        <Elements stripe={stripePromise}>
                            <CheckoutForm
                                customerInfo={customerInfo}
                                setCustomerInfo={setCustomerInfo}
                            />
                        </Elements>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="checkout-summary-section">
                        <div className="order-summary-card">
                            <h3>Order Summary</h3>

                            <div className="summary-items">
                                {items.map((item) => (
                                    <div key={item.menu_item_id} className="summary-item">
                                        <div className="item-info">
                                            {item.emoji && <span className="item-emoji">{item.emoji}</span>}
                                            <span className="item-name">{item.name}</span>
                                            <span className="item-qty">×{item.quantity}</span>
                                        </div>
                                        <span className="item-price">{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="summary-divider"></div>

                            <div className="summary-totals">
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Tax</span>
                                    <span>{formatPrice(tax)}</span>
                                </div>
                                <div className="summary-row total">
                                    <span>Total</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CheckoutPage
