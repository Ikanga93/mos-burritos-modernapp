import React, { useState, useEffect } from 'react'
import {
    Clock, CheckCircle, ChefHat, Package, RefreshCw,
    Search, X, XCircle, User, Phone
} from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { orderApi } from '../../services/api/orderApi'
import { locationApi } from '../../services/api/locationApi'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import './AdminOrdersPage.css'

const STATUS_CONFIG = {
    pending: { label: 'New Order', color: '#FF6B35', icon: Clock, action: 'Accept' },
    confirmed: { label: 'Confirmed', color: '#3B82F6', icon: CheckCircle, action: 'Start Prep' },
    preparing: { label: 'Preparing', color: '#8B5CF6', icon: ChefHat, action: 'Mark Ready' },
    ready: { label: 'Ready', color: '#10B981', icon: Package, action: 'Complete' },
    completed: { label: 'Completed', color: '#6B7280', icon: CheckCircle, action: null },
    cancelled: { label: 'Cancelled', color: '#EF4444', icon: X, action: null }
}

const AdminOrdersPage = () => {
    const { showToast } = useToast()

    const [orders, setOrders] = useState([])
    const [locations, setLocations] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Filters
    const [selectedLocation, setSelectedLocation] = useState('all')
    const [selectedStatus, setSelectedStatus] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    // Cancel modal state
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [cancelOrderId, setCancelOrderId] = useState(null)
    const [cancelReason, setCancelReason] = useState('')
    const [isCancelling, setIsCancelling] = useState(false)

    // Auto-refresh timer
    const [currentTime, setCurrentTime] = useState(new Date())


    // Load locations
    useEffect(() => {
        if (true) {
            loadLocations()
        }
    }, [])

    // Location selection removed - all locations accessible

    const loadLocations = async () => {
        try {
            const data = await locationApi.getAllLocations()
            setLocations(Array.isArray(data) ? data : data.locations || [])
        } catch (error) {
            console.error('Error loading locations:', error)
        }
    }

    // Load orders
    const loadOrders = async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true)
        else setIsLoading(true)

        try {
            const filters = {}
            if (selectedLocation !== 'all') filters.location_id = selectedLocation
            if (selectedStatus !== 'all') filters.status_filter = selectedStatus

            const data = await orderApi.getAllOrders(filters)
            setOrders(Array.isArray(data) ? data : data.orders || [])
        } catch (error) {
            console.error('Error loading orders:', error)
            showToast('Failed to load orders', 'error')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        if (true) {
            loadOrders()
        }
    }, [selectedLocation, selectedStatus])

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            loadOrders(true)
        }, 30000)
        return () => clearInterval(interval)
    }, [selectedLocation, selectedStatus])

    // Update current time every minute for elapsed time display
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 60000)
        return () => clearInterval(interval)
    }, [])

    const handleRefresh = () => {
        loadOrders(true)
        showToast('Orders refreshed', 'success')
    }

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await orderApi.updateOrderStatus(orderId, newStatus)
            showToast(`Order updated to ${STATUS_CONFIG[newStatus]?.label}`, 'success')
            loadOrders(true)
        } catch (error) {
            showToast('Failed to update order', 'error')
        }
    }

    const openCancelModal = (orderId) => {
        setCancelOrderId(orderId)
        setCancelReason('')
        setShowCancelModal(true)
    }

    const closeCancelModal = () => {
        setShowCancelModal(false)
        setCancelOrderId(null)
        setCancelReason('')
    }

    const handleCancelOrder = async () => {
        if (!cancelOrderId) return

        setIsCancelling(true)
        try {
            await orderApi.adminCancelOrder(cancelOrderId, cancelReason || 'Cancelled by restaurant staff')
            showToast('Order cancelled successfully', 'success')
            closeCancelModal()
            loadOrders(true) // Refresh orders
        } catch (error) {
            console.error('Error cancelling order:', error)
            showToast(error.response?.data?.detail || 'Failed to cancel order', 'error')
        } finally {
            setIsCancelling(false)
        }
    }

    const formatPrice = (price) => `$${parseFloat(price || 0).toFixed(2)}`

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    }

    const getElapsedTime = (dateStr) => {
        const date = new Date(dateStr)
        const now = currentTime
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours}h ago`
        const diffDays = Math.floor(diffHours / 24)
        return `${diffDays}d ago`
    }

    const getStatusPriority = (status) => {
        const priorities = { pending: 0, confirmed: 1, preparing: 2, ready: 3, completed: 4, cancelled: 5 }
        return priorities[status] || 999
    }

    // Filter and sort orders by search and status priority
    const filteredOrders = orders
        .filter(order => {
            if (!searchQuery) return true
            const query = searchQuery.toLowerCase()
            return (
                order.id?.toLowerCase().includes(query) ||
                order.customer_name?.toLowerCase().includes(query) ||
                order.customer_email?.toLowerCase().includes(query) ||
                order.customer_phone?.includes(query)
            )
        })
        .sort((a, b) => {
            const priorityDiff = getStatusPriority(a.status) - getStatusPriority(b.status)
            if (priorityDiff !== 0) return priorityDiff
            return new Date(b.created_at) - new Date(a.created_at)
        })

    if (isLoading) {
        return (
            <div className="admin-orders-page">
                <LoadingSpinner size="large" message="Loading orders..." />
            </div>
        )
    }

    return (
        <div className="admin-orders-page">
            {/* Header */}
            <header className="page-header">
                <div className="header-left">
                    <h1>Orders</h1>
                </div>
                <button className="refresh-btn" onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshCw size={18} className={isRefreshing ? 'spin' : ''} />
                    Refresh
                </button>
            </header>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                    <option value="all">All Locations</option>
                    {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                </select>

                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                    <option value="all">All Status</option>
                    {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>

            {/* Orders List */}
            <div className="orders-list-container">
                {filteredOrders.length === 0 ? (
                    <div className="empty-state">
                        <Package size={48} />
                        <p>No orders found</p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {filteredOrders.map(order => {
                            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                            const StatusIcon = status.icon
                            const elapsedTime = getElapsedTime(order.created_at)
                            const isUrgent = order.status === 'pending' && new Date() - new Date(order.created_at) > 5 * 60000

                            return (
                                <div key={order.id} className={`order-card ${order.status} ${isUrgent ? 'urgent' : ''}`}>
                                    {/* Status Badge - Prominent */}
                                    <div className="order-status-banner" style={{ backgroundColor: status.color }}>
                                        <StatusIcon size={20} />
                                        <span>{status.label}</span>
                                    </div>

                                    {/* Header: Order ID and Time */}
                                    <div className="order-card-header">
                                        <div className="order-id-section">
                                            <span className="order-id-label">Order</span>
                                            <span className="order-id">#{order.id?.slice(-6).toUpperCase()}</span>
                                        </div>
                                        <div className="order-time-section">
                                            <Clock size={16} />
                                            <span className="elapsed-time">{elapsedTime}</span>
                                        </div>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="order-customer">
                                        <div className="customer-detail">
                                            <User size={18} />
                                            <div className="customer-text">
                                                <span className="customer-name">{order.customer_name}</span>
                                                <span className="customer-phone">{order.customer_phone}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="order-items-section">
                                        <div className="items-header">Items</div>
                                        <div className="order-items-list">
                                            {(order.items || []).map((item, idx) => (
                                                <div key={idx} className="item-row">
                                                    <span className="item-qty">{item.quantity}×</span>
                                                    <span className="item-name">{item.name}</span>
                                                    <span className="item-price">{formatPrice(item.price * item.quantity)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="order-total-section">
                                        <span className="total-label">Total</span>
                                        <span className="total-amount">{formatPrice(order.total)}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="order-actions">
                                        {order.status === 'pending' && (
                                            <>
                                                <button className="primary-action-btn accept" onClick={() => updateOrderStatus(order.id, 'confirmed')}>
                                                    <CheckCircle size={18} />
                                                    Accept Order
                                                </button>
                                                <button className="secondary-action-btn decline" onClick={() => openCancelModal(order.id)}>
                                                    <XCircle size={18} />
                                                    Decline
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'confirmed' && (
                                            <>
                                                <button className="primary-action-btn start" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                                                    <ChefHat size={18} />
                                                    Start Preparing
                                                </button>
                                                <button className="secondary-action-btn decline" onClick={() => openCancelModal(order.id)}>
                                                    <XCircle size={18} />
                                                    Cancel
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'preparing' && (
                                            <>
                                                <button className="primary-action-btn ready" onClick={() => updateOrderStatus(order.id, 'ready')}>
                                                    <Package size={18} />
                                                    Mark as Ready
                                                </button>
                                                <button className="secondary-action-btn decline" onClick={() => openCancelModal(order.id)}>
                                                    <XCircle size={18} />
                                                    Cancel
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'ready' && (
                                            <>
                                                <button className="primary-action-btn complete" onClick={() => updateOrderStatus(order.id, 'completed')}>
                                                    <CheckCircle size={18} />
                                                    Complete Order
                                                </button>
                                                <button className="secondary-action-btn decline" onClick={() => openCancelModal(order.id)}>
                                                    <XCircle size={18} />
                                                    Cancel
                                                </button>
                                            </>
                                        )}
                                        {['completed', 'cancelled'].includes(order.status) && (
                                            <div className="completed-badge">
                                                <CheckCircle size={16} />
                                                Finished
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Cancel Order Modal */}
            {showCancelModal && (
                <div className="modal-overlay" onClick={closeCancelModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Cancel Order</h2>
                            <button className="close-modal-btn" onClick={closeCancelModal}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to cancel this order?</p>
                            <div className="form-group">
                                <label htmlFor="cancelReason">Cancellation Reason</label>
                                <textarea
                                    id="cancelReason"
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Enter reason for cancellation..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="secondary-btn"
                                onClick={closeCancelModal}
                                disabled={isCancelling}
                            >
                                Keep Order
                            </button>
                            <button
                                className="danger-btn"
                                onClick={handleCancelOrder}
                                disabled={isCancelling}
                            >
                                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminOrdersPage
