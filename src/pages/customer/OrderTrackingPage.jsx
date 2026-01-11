import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Package, Clock, CheckCircle, ChefHat, MapPin, Phone, ArrowLeft, RefreshCw } from 'lucide-react'
import { orderApi } from '../../services/api/orderApi'
import { useToast } from '../../contexts/ToastContext'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import './OrderTrackingPage.css'

const ORDER_STATUSES = {
    pending: { label: 'Order Received', icon: Package, color: '#6c757d' },
    confirmed: { label: 'Confirmed', icon: CheckCircle, color: '#17a2b8' },
    preparing: { label: 'Preparing', icon: ChefHat, color: '#FF6B35' },
    ready: { label: 'Ready for Pickup', icon: Package, color: '#28a745' },
    completed: { label: 'Completed', icon: CheckCircle, color: '#28a745' },
    cancelled: { label: 'Cancelled', icon: Package, color: '#dc3545' }
}

const OrderTrackingPage = () => {
    const { orderId } = useParams()
    const { showToast } = useToast()

    const [order, setOrder] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState(null)

    const fetchOrder = async (showRefreshSpinner = false) => {
        if (showRefreshSpinner) setIsRefreshing(true)
        else setIsLoading(true)

        try {
            const data = await orderApi.getOrder(orderId)
            setOrder(data)
            setError(null)
        } catch (err) {
            console.error('Error fetching order:', err)
            setError('Could not find this order. Please check your order ID.')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        if (orderId) {
            fetchOrder()

            // Auto-refresh every 30 seconds
            const interval = setInterval(() => fetchOrder(true), 30000)
            return () => clearInterval(interval)
        }
    }, [orderId])

    const handleRefresh = () => {
        fetchOrder(true)
        showToast('Order status refreshed', 'success')
    }

    const formatPrice = (price) => `$${parseFloat(price).toFixed(2)}`
    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    const getStatusIndex = (status) => {
        const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'completed']
        return statusOrder.indexOf(status)
    }

    if (isLoading) {
        return (
            <div className="order-tracking-page">
                <LoadingSpinner size="large" message="Loading order details..." />
            </div>
        )
    }

    if (error) {
        return (
            <div className="order-tracking-page">
                <div className="tracking-error">
                    <Package size={64} />
                    <h2>Order Not Found</h2>
                    <p>{error}</p>
                    <Link to="/menu" className="back-to-menu-btn">
                        <ArrowLeft size={20} />
                        Back to Menu
                    </Link>
                </div>
            </div>
        )
    }

    const currentStatus = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending
    const statusIndex = getStatusIndex(order.status)
    const isCancelled = order.status === 'cancelled'

    return (
        <div className="order-tracking-page">
            <div className="tracking-container">
                {/* Header */}
                <div className="tracking-header">
                    <Link to="/menu" className="back-link">
                        <ArrowLeft size={20} />
                        Back to Menu
                    </Link>
                    <h1>Order Tracking</h1>
                    <button
                        className="refresh-btn"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={20} className={isRefreshing ? 'spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* Order Info Card */}
                <div className="order-info-card">
                    <div className="order-id-section">
                        <span className="order-label">Order #</span>
                        <span className="order-number">{order.id?.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="order-date">
                        <Clock size={16} />
                        {formatDate(order.created_at)}
                    </div>
                </div>

                {/* Status Timeline */}
                <div className="status-section">
                    <h2>Order Status</h2>

                    {isCancelled ? (
                        <div className="cancelled-badge">
                            <Package size={24} />
                            <span>This order has been cancelled</span>
                        </div>
                    ) : (
                        <div className="status-timeline">
                            {['pending', 'confirmed', 'preparing', 'ready'].map((status, index) => {
                                const statusInfo = ORDER_STATUSES[status]
                                const Icon = statusInfo.icon
                                const isActive = statusIndex >= index
                                const isCurrent = order.status === status

                                return (
                                    <div
                                        key={status}
                                        className={`timeline-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
                                    >
                                        <div className="step-indicator">
                                            <div
                                                className="step-icon"
                                                style={{ backgroundColor: isActive ? statusInfo.color : '#ddd' }}
                                            >
                                                <Icon size={20} />
                                            </div>
                                            {index < 3 && <div className={`step-line ${statusIndex > index ? 'completed' : ''}`}></div>}
                                        </div>
                                        <div className="step-label">{statusInfo.label}</div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {order.status === 'ready' && (
                        <div className="ready-alert">
                            <CheckCircle size={24} />
                            <div>
                                <strong>Your order is ready!</strong>
                                <p>Please pick it up at the location below.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pickup Location */}
                {order.location && (
                    <div className="pickup-section">
                        <h2><MapPin size={20} /> Pickup Location</h2>
                        <div className="pickup-card">
                            <strong>{order.location.name}</strong>
                            <p>{order.location.address}</p>
                            {order.location.phone && (
                                <a href={`tel:${order.location.phone}`} className="phone-link">
                                    <Phone size={16} />
                                    {order.location.phone}
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Order Items */}
                <div className="items-section">
                    <h2>Order Items</h2>
                    <div className="items-list">
                        {(order.items || []).map((item, index) => (
                            <div key={index} className="order-item">
                                <div className="item-details">
                                    <span className="item-name">{item.name}</span>
                                    <span className="item-qty">×{item.quantity}</span>
                                </div>
                                <span className="item-price">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="order-totals">
                        <div className="total-row">
                            <span>Subtotal</span>
                            <span>{formatPrice(order.subtotal)}</span>
                        </div>
                        <div className="total-row">
                            <span>Tax</span>
                            <span>{formatPrice(order.tax)}</span>
                        </div>
                        <div className="total-row grand-total">
                            <span>Total</span>
                            <span>{formatPrice(order.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="customer-section">
                    <h2>Customer Information</h2>
                    <div className="customer-details">
                        <p><strong>Name:</strong> {order.customer_name}</p>
                        <p><strong>Email:</strong> {order.customer_email}</p>
                        <p><strong>Phone:</strong> {order.customer_phone}</p>
                        {order.notes && (
                            <p><strong>Notes:</strong> {order.notes}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderTrackingPage
