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
    const selectedLocation = locations.find(loc => loc.id === locationId)

    // Get customer info from account
    const customerInfo = useMemo(() => {
        if (isAuthenticated && customer) {
            return {
                name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email || '',
                email: customer.email || '',
                phone: customer.phone || '',
                notes: notes
            }
        }
        return {
            name: '',
            email: '',
            phone: '',
            notes: notes
        }
    }, [isAuthenticated, customer, notes])

    // Redirect if cart is empty
    useEffect(() => {
        if (items.length === 0) {
            navigate('/menu')
        }
    }, [items, navigate])

    const handleConfirm = async () => {
        // Validate that we have customer info
        if (!isAuthenticated || !customer) {
            showToast('Please log in to continue', 'error')
            navigate('/login', { state: { from: { pathname: '/order-confirmation' } } })
            return
        }

        if (!customerInfo.name.trim() || !customerInfo.email.trim() || !customerInfo.phone.trim()) {
            showToast('Your account information is incomplete. Please update your profile.', 'error')
            navigate('/profile')
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
                locationId,
                items,
                subtotal,
                tax,
                total
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
                                <button 
                                    className="edit-btn"
                                    onClick={() => navigate('/profile')}
                                >
                                    <Edit2 size={16} />
                                    Update Profile
                                </button>
                            </div>

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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderConfirmationPage
