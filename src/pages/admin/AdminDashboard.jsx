import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ShoppingBag, Clock, CheckCircle, ChefHat,
    DollarSign, RefreshCw, Package, TrendingUp, X, XCircle
} from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { orderApi } from '../../services/api/orderApi'
import { locationApi } from '../../services/api/locationApi'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import './AdminDashboard.css'

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#ffc107', icon: Clock },
    confirmed: { label: 'Confirmed', color: '#17a2b8', icon: CheckCircle },
    preparing: { label: 'Preparing', color: '#FF6B35', icon: ChefHat },
    ready: { label: 'Ready', color: '#28a745', icon: Package },
    completed: { label: 'Completed', color: '#28a745', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: '#dc3545', icon: Package }
}

const AdminDashboard = () => {
    const { showToast } = useToast()
    const navigate = useNavigate()

    const [selectedLocation, setSelectedLocation] = useState('all')
    const [locations, setLocations] = useState([])
    const [orders, setOrders] = useState([])
    const [stats, setStats] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Cancel modal state
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [cancelOrderId, setCancelOrderId] = useState(null)
    const [cancelReason, setCancelReason] = useState('')
    const [isCancelling, setIsCancelling] = useState(false)

    // Load locations
    useEffect(() => {
        const loadLocations = async () => {
            try {
                const data = await locationApi.getAllLocations()
                setLocations(Array.isArray(data) ? data : data.locations || [])
            } catch (error) {
                console.error('Error loading locations:', error)
            }
        }
        loadLocations()
    }, [])

    // Load orders and stats
    const loadDashboardData = async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true)
        else setIsLoading(true)

        try {
            const filters = selectedLocation !== 'all' ? { location_id: selectedLocation } : {}
            const ordersData = await orderApi.getAllOrders(filters)
            setOrders(Array.isArray(ordersData) ? ordersData : ordersData.orders || [])

            // Calculate stats from orders
            const allOrders = Array.isArray(ordersData) ? ordersData : ordersData.orders || []
            const today = new Date().toDateString()

            const todayOrders = allOrders.filter(o => new Date(o.created_at).toDateString() === today)
            const pendingOrders = allOrders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status))
            const todayRevenue = todayOrders
                .filter(o => ['pending', 'confirmed', 'preparing', 'ready', 'completed'].includes(o.status) && o.status !== 'cancelled')
                .reduce((sum, o) => sum + o.total, 0)

            setStats({
                todayOrders: todayOrders.length,
                pendingOrders: pendingOrders.length,
                todayRevenue: todayRevenue,
                totalOrders: allOrders.length
            })
        } catch (error) {
            console.error('Error loading dashboard data:', error)
            showToast('Failed to load dashboard data', 'error')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        loadDashboardData()
    }, [selectedLocation])

    // Auto refresh every 15 seconds for better real-time updates
    useEffect(() => {
        const interval = setInterval(() => loadDashboardData(true), 15000)
        return () => clearInterval(interval)
    }, [selectedLocation])

    const handleRefresh = () => {
        loadDashboardData(true)
        showToast('Dashboard refreshed', 'success')
    }

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await orderApi.updateOrderStatus(orderId, newStatus)
            showToast(`Order updated to ${STATUS_CONFIG[newStatus]?.label}`, 'success')
            loadDashboardData(true)
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
            loadDashboardData(true) // Refresh dashboard
        } catch (error) {
            console.error('Error cancelling order:', error)
            showToast(error.response?.data?.detail || 'Failed to cancel order', 'error')
        } finally {
            setIsCancelling(false)
        }
    }

    const formatPrice = (price) => `$${parseFloat(price || 0).toFixed(2)}`

    // Relative time for card view
    const getTimeAgo = (dateStr) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        return `${diffDays}d ago`
    }

    // Check if order is urgent (pending >5 minutes)
    const isOrderUrgent = (order) => {
        if (order.status !== 'pending') return false
        const createdTime = new Date(order.created_at)
        const now = new Date()
        const diffMinutes = (now - createdTime) / 60000
        return diffMinutes > 5
    }

    // Show loading while data is loading
    if (isLoading) {
        return (
            <div className="dashboard-content">
                <LoadingSpinner size="large" message="Loading dashboard..." />
            </div>
        )
    }

    const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status))

    return (
        <div className="dashboard-content">
            {/* Daily Stats - Sliding Carousel */}
            {stats && (
                <div className="daily-stats-container">
                    <div className="daily-stats-slider">
                        <div className="stat-card-mini">
                            <div className="stat-icon-mini">
                                <ShoppingBag size={20} />
                            </div>
                            <div className="stat-info-mini">
                                <div className="stat-value-mini">{stats.todayOrders}</div>
                                <div className="stat-label-mini">Today's Orders</div>
                            </div>
                        </div>

                        <div className="stat-card-mini">
                            <div className="stat-icon-mini pending">
                                <Clock size={20} />
                            </div>
                            <div className="stat-info-mini">
                                <div className="stat-value-mini">{stats.pendingOrders}</div>
                                <div className="stat-label-mini">Pending Orders</div>
                            </div>
                        </div>

                        <div className="stat-card-mini">
                            <div className="stat-icon-mini revenue">
                                <DollarSign size={20} />
                            </div>
                            <div className="stat-info-mini">
                                <div className="stat-value-mini">{formatPrice(stats.todayRevenue)}</div>
                                <div className="stat-label-mini">Today's Revenue</div>
                            </div>
                        </div>

                        <div className="stat-card-mini">
                            <div className="stat-icon-mini total">
                                <TrendingUp size={20} />
                            </div>
                            <div className="stat-info-mini">
                                <div className="stat-value-mini">{stats.totalOrders}</div>
                                <div className="stat-label-mini">Total Orders</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Orders */}
            <section className="orders-section">
                <div className="section-header">
                    <h2>Active Orders</h2>
                    <span className="order-count">{activeOrders.length} orders</span>
                </div>

{activeOrders.length === 0 ? (
                    <div className="empty-orders">
                        <CheckCircle size={48} />
                        <p>No active orders right now</p>
                    </div>
                ) : (
                    <div className="dashboard-orders-grid">
                        {activeOrders.map(order => {
                            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                            const StatusIcon = status.icon
                            const elapsedTime = getTimeAgo(order.created_at)
                            const isUrgent = isOrderUrgent(order)

                            return (
                                <div key={order.id} className={`order-card ${order.status} ${isUrgent ? 'urgent' : ''}`}>
                                    {/* Status Banner - Prominent */}
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
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

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

export default AdminDashboard
