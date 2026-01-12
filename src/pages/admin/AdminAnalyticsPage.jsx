import React, { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, ShoppingBag, Package, Clock, RefreshCw, Calendar } from 'lucide-react'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { useToast } from '../../contexts/ToastContext'
import { orderApi } from '../../services/api/orderApi'
import { locationApi } from '../../services/api/locationApi'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import './AdminAnalyticsPage.css'

const AdminAnalyticsPage = () => {
    const { isAuthenticated, isLoading: authLoading, role, assignedLocations } = useAdminAuth()
    const { showToast } = useToast()

    const [locations, setLocations] = useState([])
    const [selectedLocation, setSelectedLocation] = useState('all')
    const [dateRange, setDateRange] = useState('today')
    const [orders, setOrders] = useState([])
    const [analytics, setAnalytics] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const isOwner = role === 'owner'

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            loadLocations()
        }
    }, [authLoading, isAuthenticated])

    // Auto-select first assigned location for non-owners
    useEffect(() => {
        if (!isOwner && assignedLocations.length > 0 && selectedLocation === 'all') {
            setSelectedLocation(assignedLocations[0].location_id)
        }
    }, [role, assignedLocations, selectedLocation])

    const loadLocations = async () => {
        try {
            const data = await locationApi.getAllLocations()
            setLocations(Array.isArray(data) ? data : data.locations || [])
        } catch (error) {
            console.error('Error loading locations:', error)
        }
    }

    const loadAnalytics = async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true)
        else setIsLoading(true)

        try {
            const filters = {}
            if (selectedLocation !== 'all') filters.location_id = selectedLocation

            // Get date range
            const { startDate, endDate } = getDateRange(dateRange)
            if (startDate) filters.date_from = startDate
            if (endDate) filters.date_to = endDate

            const ordersData = await orderApi.getAllOrders(filters)
            const allOrders = Array.isArray(ordersData) ? ordersData : ordersData.orders || []
            setOrders(allOrders)

            // Calculate analytics
            const calculatedAnalytics = calculateAnalytics(allOrders)
            setAnalytics(calculatedAnalytics)
        } catch (error) {
            console.error('Error loading analytics:', error)
            showToast('Failed to load analytics', 'error')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            loadAnalytics()
        }
    }, [authLoading, isAuthenticated, selectedLocation, dateRange])

    const getDateRange = (range) => {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        let startDate, endDate

        switch (range) {
            case 'today':
                startDate = today.toISOString()
                endDate = now.toISOString()
                break
            case 'week':
                const weekStart = new Date(today)
                weekStart.setDate(today.getDate() - 7)
                startDate = weekStart.toISOString()
                endDate = now.toISOString()
                break
            case 'month':
                const monthStart = new Date(today)
                monthStart.setDate(today.getDate() - 30)
                startDate = monthStart.toISOString()
                endDate = now.toISOString()
                break
            default:
                startDate = null
                endDate = null
        }

        return { startDate, endDate }
    }

    const calculateAnalytics = (orders) => {
        const totalRevenue = orders
            .filter(o => o.status === 'completed')
            .reduce((sum, o) => sum + (o.total || 0), 0)

        const totalOrders = orders.length
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

        // Status breakdown
        const statusBreakdown = {
            pending: orders.filter(o => o.status === 'pending').length,
            confirmed: orders.filter(o => o.status === 'confirmed').length,
            preparing: orders.filter(o => o.status === 'preparing').length,
            ready: orders.filter(o => o.status === 'ready').length,
            completed: orders.filter(o => o.status === 'completed').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length
        }

        // Top selling items
        const itemCounts = {}
        orders.forEach(order => {
            (order.items || []).forEach(item => {
                if (!itemCounts[item.name]) {
                    itemCounts[item.name] = { name: item.name, quantity: 0, revenue: 0 }
                }
                itemCounts[item.name].quantity += item.quantity
                itemCounts[item.name].revenue += item.price * item.quantity
            })
        })

        const topItems = Object.values(itemCounts)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5)

        // Orders by hour (for today/week)
        const ordersByHour = {}
        orders.forEach(order => {
            const hour = new Date(order.created_at).getHours()
            ordersByHour[hour] = (ordersByHour[hour] || 0) + 1
        })

        return {
            totalRevenue,
            totalOrders,
            avgOrderValue,
            statusBreakdown,
            topItems,
            ordersByHour
        }
    }

    const handleRefresh = () => {
        loadAnalytics(true)
        showToast('Analytics refreshed', 'success')
    }

    const formatPrice = (price) => `$${parseFloat(price || 0).toFixed(2)}`

    if (authLoading || isLoading) {
        return (
            <div className="admin-analytics-page">
                <LoadingSpinner size="large" message="Loading analytics..." />
            </div>
        )
    }

    return (
        <div className="admin-analytics-page">
            {/* Header */}
            <header className="page-header">
                <div className="header-left">
                    <h1>Analytics</h1>
                    {isOwner && (
                        <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="location-select"
                        >
                            <option value="all">All Locations</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    )}
                    {!isOwner && currentLocation && (
                        <span className="current-location-badge">{currentLocation.name}</span>
                    )}
                </div>
                <div className="header-right">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="date-range-select"
                    >
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                    </select>
                    <button className="refresh-btn" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw size={18} className={isRefreshing ? 'spin' : ''} />
                        Refresh
                    </button>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon revenue">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{formatPrice(analytics?.totalRevenue)}</span>
                        <span className="stat-label">Total Revenue</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon orders">
                        <ShoppingBag size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{analytics?.totalOrders || 0}</span>
                        <span className="stat-label">Total Orders</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon average">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{formatPrice(analytics?.avgOrderValue)}</span>
                        <span className="stat-label">Avg Order Value</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon completed">
                        <Package size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{analytics?.statusBreakdown.completed || 0}</span>
                        <span className="stat-label">Completed Orders</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-container">
                {/* Orders by Status */}
                <div className="chart-card">
                    <h3>Orders by Status</h3>
                    <div className="status-chart">
                        {Object.entries(analytics?.statusBreakdown || {}).map(([status, count]) => (
                            count > 0 && (
                                <div key={status} className="status-bar-item">
                                    <div className="status-bar-label">
                                        <span className={`status-dot ${status}`}></span>
                                        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                                    </div>
                                    <div className="status-bar-wrapper">
                                        <div
                                            className={`status-bar ${status}`}
                                            style={{
                                                width: `${(count / analytics.totalOrders) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                                    <span className="status-count">{count}</span>
                                </div>
                            )
                        ))}
                    </div>
                </div>

                {/* Top Selling Items */}
                <div className="chart-card">
                    <h3>Top Selling Items</h3>
                    <div className="top-items-chart">
                        {analytics?.topItems.length > 0 ? (
                            analytics.topItems.map((item, idx) => (
                                <div key={idx} className="top-item">
                                    <div className="item-rank">{idx + 1}</div>
                                    <div className="item-details">
                                        <span className="item-name">{item.name}</span>
                                        <span className="item-stats">
                                            {item.quantity} sold • {formatPrice(item.revenue)}
                                        </span>
                                    </div>
                                    <div className="item-bar-wrapper">
                                        <div
                                            className="item-bar"
                                            style={{
                                                width: `${(item.quantity / analytics.topItems[0].quantity) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-chart">No data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Orders by Time */}
            <div className="chart-card full-width">
                <h3>Orders by Hour</h3>
                <div className="hour-chart">
                    {Object.keys(analytics?.ordersByHour || {}).length > 0 ? (
                        Array.from({ length: 24 }, (_, hour) => {
                            const count = analytics.ordersByHour[hour] || 0
                            const maxCount = Math.max(...Object.values(analytics.ordersByHour))
                            const height = maxCount > 0 ? (count / maxCount) * 100 : 0

                            return (
                                <div key={hour} className="hour-bar-item">
                                    <div
                                        className="hour-bar"
                                        style={{ height: `${height}%` }}
                                        title={`${count} orders at ${hour}:00`}
                                    >
                                        {count > 0 && <span className="bar-value">{count}</span>}
                                    </div>
                                    <span className="hour-label">{hour}</span>
                                </div>
                            )
                        })
                    ) : (
                        <div className="empty-chart">No data available</div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminAnalyticsPage
