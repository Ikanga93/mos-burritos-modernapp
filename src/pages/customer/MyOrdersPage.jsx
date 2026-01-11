import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Clock, ChevronRight, ShoppingBag, RefreshCw } from 'lucide-react'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { orderApi } from '../../services/api/orderApi'
import { useToast } from '../../contexts/ToastContext'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import './MyOrdersPage.css'

const STATUS_STYLES = {
    pending: { label: 'Pending', color: '#6c757d', bg: '#f8f9fa' },
    confirmed: { label: 'Confirmed', color: '#17a2b8', bg: '#e7f5f8' },
    preparing: { label: 'Preparing', color: '#FF6B35', bg: '#fff3ef' },
    ready: { label: 'Ready', color: '#28a745', bg: '#e8f5e9' },
    completed: { label: 'Completed', color: '#28a745', bg: '#e8f5e9' },
    cancelled: { label: 'Cancelled', color: '#dc3545', bg: '#fdeaec' }
}

const MyOrdersPage = () => {
    const { customer } = useCustomerAuth()
    const { showToast } = useToast()

    const [orders, setOrders] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const fetchOrders = async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true)
        else setIsLoading(true)

        try {
            const data = await orderApi.getMyOrders()
            setOrders(Array.isArray(data) ? data : data.orders || [])
        } catch (error) {
            console.error('Error fetching orders:', error)
            showToast('Could not load orders', 'error')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    const handleRefresh = () => {
        fetchOrders(true)
        showToast('Orders refreshed', 'success')
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const formatPrice = (price) => `$${parseFloat(price).toFixed(2)}`

    if (isLoading) {
        return (
            <div className="my-orders-page">
                <LoadingSpinner size="large" message="Loading your orders..." />
            </div>
        )
    }

    return (
        <div className="my-orders-page">
            <div className="orders-container">
                {/* Header */}
                <div className="orders-header">
                    <h1><ShoppingBag size={28} /> My Orders</h1>
                    <button
                        className="refresh-btn"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'spin' : ''} />
                    </button>
                </div>

                {/* Orders List */}
                {orders.length === 0 ? (
                    <div className="empty-orders">
                        <Package size={64} />
                        <h2>No orders yet</h2>
                        <p>When you place an order, it will appear here.</p>
                        <Link to="/menu" className="order-now-btn">
                            Order Now
                        </Link>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map((order) => {
                            const status = STATUS_STYLES[order.status] || STATUS_STYLES.pending
                            return (
                                <Link
                                    key={order.id}
                                    to={`/order-tracking/${order.id}`}
                                    className="order-card"
                                >
                                    <div className="order-top">
                                        <div className="order-info">
                                            <span className="order-number">
                                                Order #{order.id?.slice(-8).toUpperCase()}
                                            </span>
                                            <span className="order-date">
                                                <Clock size={14} />
                                                {formatDate(order.created_at)}
                                            </span>
                                        </div>
                                        <span
                                            className="order-status"
                                            style={{ color: status.color, backgroundColor: status.bg }}
                                        >
                                            {status.label}
                                        </span>
                                    </div>

                                    <div className="order-details">
                                        <div className="order-items-preview">
                                            {(order.items || []).slice(0, 3).map((item, idx) => (
                                                <span key={idx} className="item-preview">
                                                    {item.name} ×{item.quantity}
                                                </span>
                                            ))}
                                            {order.items?.length > 3 && (
                                                <span className="more-items">
                                                    +{order.items.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                        <div className="order-total">
                                            <span>{formatPrice(order.total)}</span>
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MyOrdersPage
