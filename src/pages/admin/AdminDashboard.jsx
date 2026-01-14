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
    const formatTime = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
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
            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <ShoppingBag size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.todayOrders || 0}</span>
                        <span className="stat-label">Today's Orders</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.pendingOrders || 0}</span>
                        <span className="stat-label">Pending Orders</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{formatPrice(stats?.todayRevenue)}</span>
                        <span className="stat-label">Today's Revenue</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.totalOrders || 0}</span>
                        <span className="stat-label">Total Orders</span>
                    </div>
                </div>
            </div>

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
                    <div className="orders-grid">
                        {activeOrders.map(order => {
                            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                            const StatusIcon = status.icon

                            return (
                                <div key={order.id} className="order-card">
                                    <div className="order-header">
                                        <span className="order-number">#{order.id?.slice(-6).toUpperCase()}</span>
                                        <span className="order-status" style={{ backgroundColor: status.color }}>
                                            <StatusIcon size={14} />
                                            {status.label}
                                        </span>
                                    </div>

                                    <div className="order-time">
                                        <Clock size={14} />
                                        {formatTime(order.created_at)}
                                    </div>

                                    <div className="order-customer">
                                        <strong>{order.customer_name}</strong>
                                        <span>{order.customer_phone}</span>
                                    </div>

                                    <div className="order-items">
                                        {(order.items || []).slice(0, 3).map((item, idx) => (
                                            <span key={idx} className="item-tag">
                                                {item.quantity}× {item.name}
                                            </span>
                                        ))}
                                        {order.items?.length > 3 && (
                                            <span className="more-items">+{order.items.length - 3} more</span>
                                        )}
                                    </div>

                                    <div className="order-total">
                                        {formatPrice(order.total)}
                                    </div>

                                    <div className="order-actions">
                                        {order.status === 'pending' && (
                                            <>
                                                <button className="action-btn confirm" onClick={() => updateOrderStatus(order.id, 'confirmed')}>
                                                    Confirm
                                                </button>
                                                <button className="action-btn cancel-btn-small" onClick={() => openCancelModal(order.id)} title="Cancel Order">
                                                    <XCircle size={14} />
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'confirmed' && (
                                            <>
                                                <button className="action-btn prepare" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                                                    Start Preparing
                                                </button>
                                                <button className="action-btn cancel-btn-small" onClick={() => openCancelModal(order.id)} title="Cancel Order">
                                                    <XCircle size={14} />
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'preparing' && (
                                            <>
                                                <button className="action-btn ready" onClick={() => updateOrderStatus(order.id, 'ready')}>
                                                    Mark Ready
                                                </button>
                                                <button className="action-btn cancel-btn-small" onClick={() => openCancelModal(order.id)} title="Cancel Order">
                                                    <XCircle size={14} />
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'ready' && (
                                            <>
                                                <button className="action-btn complete" onClick={() => updateOrderStatus(order.id, 'completed')}>
                                                    Complete
                                                </button>
                                                <button className="action-btn cancel-btn-small" onClick={() => openCancelModal(order.id)} title="Cancel Order">
                                                    <XCircle size={14} />
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
