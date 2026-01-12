import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, User, ArrowLeft, CheckCircle, Edit2, ShoppingBag, Loader } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useLocation } from '../../contexts/LocationContext'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { useToast } from '../../contexts/ToastContext'
import { paymentApi } from '../../services/api/paymentApi'
import './OrderConfirmationPage.css'

const OrderConfirmationPage = () => {
    const navigate = useNavigate()
    const { items, subtotal, tax, total, locationId } = useCart()
    const { locations } = useLocation()
    const { customer, isAuthenticated } = useCustomerAuth()
    const { showToast } = useToast()

    const [notes, setNotes] = useState('')
    const [isCreatingSession, setIsCreatingSession] = useState(false)
    const [isGuestCheckout, setIsGuestCheckout] = useState(false)

    // Guest form fields
    const [guestName, setGuestName] = useState('')
    const [guestEmail, setGuestEmail] = useState('')
    const [guestPhone, setGuestPhone] = useState('')

    const selectedLocation = locations.find(loc => loc.id === locationId)

    // Get customer info from account or guest form
    const customerInfo = useMemo(() => {
        if (isAuthenticated && customer) {
            return {
                name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email || '',
                email: customer.email || '',
                phone: customer.phone || '',
                notes: notes
            }
        }
        // Guest checkout info
        return {
            name: guestName,
            email: guestEmail,
            phone: guestPhone,
            notes: notes
        }
    }, [isAuthenticated, customer, notes, guestName, guestEmail, guestPhone])

    // Redirect if cart is empty
    useEffect(() => {
        if (items.length === 0) {
            navigate('/menu')
        }
    }, [items, navigate])

    const handleAuthenticatedCheckout = () => {
        navigate('/login', { state: { from: { pathname: '/order-confirmation' } } })
    }

    const handleGuestCheckout = () => {
        setIsGuestCheckout(true)
    }

    const handleConfirm = async () => {
        // Validate customer info (works for both authenticated and guest)
        if (!customerInfo.name.trim() || !customerInfo.email.trim() || !customerInfo.phone.trim()) {
            if (isAuthenticated) {
                showToast('Your account information is incomplete. Please update your profile.', 'error')
                navigate('/profile')
            } else {
                showToast('Please fill in all required fields', 'error')
            }
            return
        }

        if (!selectedLocation) {
            showToast('Please select a location', 'error')
            return
        }

        setIsCreatingSession(true)
        try {
            // Create Stripe Checkout Session
            const amountInCents = Math.round(total * 100)
            const checkoutSession = await paymentApi.createCheckoutSession(
                amountInCents,
                'usd',
                customerInfo,
                items.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                locationId,
                notes
            )

            // Store session ID for later verification
            sessionStorage.setItem('stripeSessionId', checkoutSession.sessionId)
            sessionStorage.setItem('orderConfirmation', JSON.stringify({
                customerInfo,
                customerId: isAuthenticated && customer ? customer.id : null,
                locationId,
                items,
                subtotal,
                tax,
                total,
                isGuest: !isAuthenticated
            }))

            // Redirect to Stripe hosted checkout page
            window.location.href = checkoutSession.url
        } catch (error) {
            console.error('Error creating checkout session:', error)
            showToast(error.response?.data?.detail || 'Failed to create checkout session. Please try again.', 'error')
            setIsCreatingSession(false)
        }
    }

    const formatPrice = (price) => `$${parseFloat(price).toFixed(2)}`

    if (items.length === 0) {
        return null
    }

    return (
        <div className="order-confirmation-page">
            <div className="confirmation-container">
                {/* Header */}
                <div className="confirmation-header">
                    <button className="back-btn" onClick={() => navigate('/menu')}>
                        <ArrowLeft size={20} />
                        Back to Menu
                    </button>
                    <h1>Confirm Your Order</h1>
                    <p className="subtitle">Please review and confirm your information before proceeding to payment</p>
                </div>

                <div className="confirmation-content">
                    {/* Left: Customer Info & Location */}
                    <div className="confirmation-form-section">
                        {/* Restaurant/Location */}
                        <div className="confirmation-section">
                            <div className="section-header">
                                <MapPin size={20} />
                                <h3>Pickup Location</h3>
                            </div>
                            <div className="location-card">
                                {selectedLocation ? (
                                    <>
                                        <strong>{selectedLocation.name}</strong>
                                        <p>{selectedLocation.address}</p>
                                        {selectedLocation.hours && (
                                            <p className="location-hours">{selectedLocation.hours}</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="error-text">No location selected. Please go back and select a location.</p>
                                )}
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="confirmation-section">
                            <div className="section-header">
                                <User size={20} />
                                <h3>Your Information</h3>
                                {isAuthenticated && (
                                    <button
                                        className="edit-btn"
                                        onClick={() => navigate('/profile')}
                                    >
                                        <Edit2 size={16} />
                                        Update Profile
                                    </button>
                                )}
                            </div>

                            {isAuthenticated ? (
                                <>
                                    <div className="readonly-info">
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
                                    </div>
                                    <p className="info-note">
                                        Your account information will be used for this order. To update, visit your profile.
                                    </p>
                                </>
                            ) : (
                                <>
                                    {!isGuestCheckout ? (
                                        <div className="guest-prompt">
                                            <p className="info-note">
                                                You need to provide your information to complete the order.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="guest-form">
                                            <div className="form-group">
                                                <label htmlFor="guestName">Full Name *</label>
                                                <input
                                                    type="text"
                                                    id="guestName"
                                                    value={guestName}
                                                    onChange={(e) => setGuestName(e.target.value)}
                                                    placeholder="Enter your full name"
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="guestEmail">Email *</label>
                                                <input
                                                    type="email"
                                                    id="guestEmail"
                                                    value={guestEmail}
                                                    onChange={(e) => setGuestEmail(e.target.value)}
                                                    placeholder="Enter your email"
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="guestPhone">Phone *</label>
                                                <input
                                                    type="tel"
                                                    id="guestPhone"
                                                    value={guestPhone}
                                                    onChange={(e) => setGuestPhone(e.target.value)}
                                                    placeholder="Enter your phone number"
                                                    required
                                                />
                                            </div>
                                            <p className="info-note">
                                                We'll use this information to contact you about your order.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Special Notes */}
                        <div className="confirmation-section">
                            <div className="section-header">
                                <h3>Special Instructions (Optional)</h3>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any special instructions for your order..."
                                rows={4}
                                className="notes-textarea"
                            />
                        </div>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="confirmation-summary-section">
                        <div className="order-summary-card">
                            <h3><ShoppingBag size={20} /> Order Summary</h3>

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

                            {isAuthenticated ? (
                                <button
                                    className="confirm-order-btn"
                                    onClick={handleConfirm}
                                    disabled={!selectedLocation || isCreatingSession}
                                >
                                    {isCreatingSession ? (
                                        <>
                                            <Loader size={20} className="spin" />
                                            Redirecting to Payment...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={20} />
                                            Confirm & Proceed to Payment
                                        </>
                                    )}
                                </button>
                            ) : (
                                <>
                                    {!isGuestCheckout ? (
                                        <div className="checkout-options">
                                            <button
                                                className="confirm-order-btn"
                                                onClick={handleAuthenticatedCheckout}
                                                disabled={!selectedLocation}
                                            >
                                                <User size={20} />
                                                Login to Checkout
                                            </button>
                                            <button
                                                className="guest-checkout-link"
                                                onClick={handleGuestCheckout}
                                                disabled={!selectedLocation}
                                            >
                                                Continue as Guest
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="confirm-order-btn"
                                            onClick={handleConfirm}
                                            disabled={!selectedLocation || isCreatingSession}
                                        >
                                            {isCreatingSession ? (
                                                <>
                                                    <Loader size={20} className="spin" />
                                                    Redirecting to Payment...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={20} />
                                                    Confirm & Proceed to Payment
                                                </>
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderConfirmationPage
