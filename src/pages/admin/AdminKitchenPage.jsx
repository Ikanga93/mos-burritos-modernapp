import React, { useState, useEffect } from 'react'
import { ChefHat, Clock, CheckCircle, Package, RefreshCw, XCircle } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { orderApi } from '../../services/api/orderApi'
import { locationApi } from '../../services/api/locationApi'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import './AdminKitchenPage.css'

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#ffc107', icon: Clock },
    confirmed: { label: 'Confirmed', color: '#17a2b8', icon: CheckCircle },
    preparing: { label: 'Preparing', color: '#FF6B35', icon: ChefHat },
    ready: { label: 'Ready', color: '#28a745', icon: Package },
    completed: { label: 'Completed', color: '#28a745', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: '#dc3545', icon: Package }
}

const AdminKitchenPage = () => {
    const { showToast } = useToast()

    const [selectedLocation, setSelectedLocation] = useState('all')
    const [locations, setLocations] = useState([])
    const [orders, setOrders] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

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

    // Load orders
    const loadOrders = async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true)
        else setIsLoading(true)

        try {
            const filters = selectedLocation !== 'all' ? { location_id: selectedLocation } : {}
            const ordersData = await orderApi.getAllOrders(filters)
            setOrders(Array.isArray(ordersData) ? ordersData : ordersData.orders || [])
        } catch (error) {
            console.error('Error loading orders:', error)
            showToast('Failed to load orders', 'error')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        loadOrders()
    }, [selectedLocation])

    // Auto refresh every 30 seconds for kitchen operations
    useEffect(() => {
        const interval = setInterval(() => loadOrders(true), 30000)
        return () => clearInterval(interval)
    }, [selectedLocation])

    const handleRefresh = () => {
        loadOrders(true)
        showToast('Kitchen display refreshed', 'success')
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

    const formatTime = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }

    const formatOrderNumber = (orderId) => `#${orderId?.slice(-6).toUpperCase()}`

    // Show loading while data is loading
    if (isLoading) {
        return (
            <div className="kitchen-content">
                <LoadingSpinner size="large" message="Loading kitchen display..." />
            </div>
        )
    }

    // Filter orders for kitchen display (focus on orders that need kitchen attention)
    const kitchenOrders = orders.filter(o => ['confirmed', 'preparing'].includes(o.status))
    const pendingOrders = orders.filter(o => o.status === 'pending')
    const readyOrders = orders.filter(o => o.status === 'ready')

    return (
        <div className="kitchen-content">
            {/* Kitchen Header */}
            <div className="kitchen-header">
                <div className="kitchen-title">
                    <ChefHat size={32} />
                    <h1>Kitchen Display System</h1>
                </div>
                <div className="kitchen-controls">
                    <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="location-select"
                    >
                        <option value="all">All Locations</option>
                        {locations.map(location => (
                            <option key={location.id} value={location.id}>
                                {location.name}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="refresh-btn"
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Order Summary */}
            <div className="kitchen-summary">
                <div className="summary-item">
                    <div className="summary-icon pending">
                        <Clock size={20} />
                    </div>
                    <div className="summary-info">
                        <span className="summary-value">{pendingOrders.length}</span>
                        <span className="summary-label">Pending Confirmation</span>
                    </div>
                </div>
                <div className="summary-item">
                    <div className="summary-icon preparing">
                        <ChefHat size={20} />
                    </div>
                    <div className="summary-info">
                        <span className="summary-value">{kitchenOrders.length}</span>
                        <span className="summary-label">In Preparation</span>
                    </div>
                </div>
                <div className="summary-item">
                    <div className="summary-icon ready">
                        <Package size={20} />
                    </div>
                    <div className="summary-info">
                        <span className="summary-value">{readyOrders.length}</span>
                        <span className="summary-label">Ready for Pickup</span>
                    </div>
                </div>
            </div>

            {/* Kitchen Orders Display */}
            <div className="kitchen-orders">
                {kitchenOrders.length === 0 ? (
                    <div className="no-orders">
                        <ChefHat size={48} />
                        <p>No orders currently in preparation</p>
                    </div>
                ) : (
                    <div className="orders-grid">
                        {kitchenOrders.map(order => {
                            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.preparing
                            const StatusIcon = status.icon

                            return (
                                <div key={order.id} className="kitchen-order-card">
                                    <div className="order-header">
                                        <span className="order-number">{formatOrderNumber(order.id)}</span>
                                        <span className="order-status" style={{ backgroundColor: status.color }}>
                                            <StatusIcon size={14} />
                                            {status.label}
                                        </span>
                                    </div>

                                    <div className="order-time">
                                        <Clock size={14} />
                                        Ordered at {formatTime(order.created_at)}
                                    </div>

                                    <div className="order-customer">
                                        <strong>{order.customer_name}</strong>
                                    </div>

                                    <div className="order-items">
                                        {(order.items || []).slice(0, 4).map((item, idx) => (
                                            <span key={idx} className="item-tag">
                                                {item.quantity}× {item.name}
                                            </span>
                                        ))}
                                        {order.items?.length > 4 && (
                                            <span className="more-items">+{order.items.length - 4} more</span>
                                        )}
                                    </div>

                                    {order.notes && (
                                        <div className="order-notes">
                                            <strong>Notes:</strong> {order.notes}
                                        </div>
                                    )}

                                    <div className="order-actions">
                                        {order.status === 'confirmed' && (
                                            <button
                                                className="action-btn start-prep"
                                                onClick={() => updateOrderStatus(order.id, 'preparing')}
                                            >
                                                Start Preparation
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                className="action-btn mark-ready"
                                                onClick={() => updateOrderStatus(order.id, 'ready')}
                                            >
                                                Mark as Ready
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminKitchenPage
