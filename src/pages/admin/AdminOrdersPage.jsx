import React, { useState, useEffect } from 'react'
import {
    Clock, CheckCircle, ChefHat, Package, RefreshCw,
    Search, X, XCircle
} from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { orderApi } from '../../services/api/orderApi'
import { locationApi } from '../../services/api/locationApi'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import './AdminOrdersPage.css'

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#ffc107', icon: Clock },
    confirmed: { label: 'Confirmed', color: '#17a2b8', icon: CheckCircle },
    preparing: { label: 'Preparing', color: '#FF6B35', icon: ChefHat },
    ready: { label: 'Ready', color: '#28a745', icon: Package },
    completed: { label: 'Completed', color: '#28a745', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: '#dc3545', icon: X }
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

    // Filter orders by search
    const filteredOrders = orders.filter(order => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            order.id?.toLowerCase().includes(query) ||
            order.customer_name?.toLowerCase().includes(query) ||
            order.customer_email?.toLowerCase().includes(query) ||
            order.customer_phone?.includes(query)
        )
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

            {/* Orders Table */}
            <div className="orders-table-container">
                {filteredOrders.length === 0 ? (
                    <div className="empty-state">
                        <Package size={48} />
                        <p>No orders found</p>
                    </div>
                ) : (
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => {
                                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                                const StatusIcon = status.icon

                                return (
                                    <tr key={order.id}>
                                        <td className="order-id">#{order.id?.slice(-6).toUpperCase()}</td>
                                        <td className="customer-info">
                                            <strong>{order.customer_name}</strong>
                                            <span>{order.customer_phone}</span>
                                        </td>
                                        <td className="items-cell">
                                            {(order.items || []).slice(0, 2).map((item, idx) => (
                                                <span key={idx} className="item-chip">{item.quantity}× {item.name}</span>
                                            ))}
                                            {order.items?.length > 2 && (
                                                <span className="more-chip">+{order.items.length - 2}</span>
                                            )}
                                        </td>
                                        <td className="total-cell">{formatPrice(order.total)}</td>
                                        <td>
                                            <span className="status-badge" style={{ backgroundColor: status.color }}>
                                                <StatusIcon size={12} />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="date-cell">{formatDate(order.created_at)}</td>
                                        <td className="actions-cell">
                                            <div className="action-buttons-group">
                                                {order.status === 'pending' && (
                                                    <button className="action-btn confirm" onClick={() => updateOrderStatus(order.id, 'confirmed')}>
                                                        Confirm
                                                    </button>
                                                )}
                                                {order.status === 'confirmed' && (
                                                    <button className="action-btn prepare" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                                                        Prepare
                                                    </button>
                                                )}
                                                {order.status === 'preparing' && (
                                                    <button className="action-btn ready" onClick={() => updateOrderStatus(order.id, 'ready')}>
                                                        Ready
                                                    </button>
                                                )}
                                                {order.status === 'ready' && (
                                                    <button className="action-btn complete" onClick={() => updateOrderStatus(order.id, 'completed')}>
                                                        Complete
                                                    </button>
                                                )}
                                                {!['completed', 'cancelled'].includes(order.status) && (
                                                    <button 
                                                        className="action-btn cancel-btn" 
                                                        onClick={() => openCancelModal(order.id)}
                                                        title="Cancel Order"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                )}
                                                {['completed', 'cancelled'].includes(order.status) && (
                                                    <span className="done-text">Done</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
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
