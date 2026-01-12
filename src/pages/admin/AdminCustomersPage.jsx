import React, { useState, useEffect } from 'react'
import { Users, Search, Trash2, User, Mail, Phone, ShoppingBag, DollarSign, RefreshCw } from 'lucide-react'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { useToast } from '../../contexts/ToastContext'
import { userApi } from '../../services/api/userApi'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import './AdminCustomersPage.css'

const AdminCustomersPage = () => {
    const { isAuthenticated, isLoading: authLoading, role } = useAdminAuth()
    const { showToast } = useToast()

    const [customers, setCustomers] = useState([])
    const [stats, setStats] = useState({ total_customers: 0, registered_count: 0, guest_count: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [sortBy, setSortBy] = useState('total_spent')
    const [sortOrder, setSortOrder] = useState('desc')

    const isOwner = role === 'owner'

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            loadCustomers()
        }
    }, [authLoading, isAuthenticated])

    const loadCustomers = async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true)
        else setIsLoading(true)

        try {
            const data = await userApi.getCustomers()
            setCustomers(data.customers || [])
            setStats({
                total_customers: data.total_customers || 0,
                registered_count: data.registered_count || 0,
                guest_count: data.guest_count || 0
            })
        } catch (error) {
            console.error('Error loading customers:', error)
            showToast('Failed to load customers', 'error')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    const handleRefresh = () => {
        loadCustomers(true)
        showToast('Customers refreshed', 'success')
    }

    const handleDelete = async (customerId, customerName) => {
        if (!isOwner) {
            showToast('Only owners can delete customers', 'error')
            return
        }

        if (!confirm(`Are you sure you want to delete customer "${customerName}"? This will remove all their data.`)) {
            return
        }

        try {
            await userApi.deleteCustomer(customerId)
            showToast('Customer deleted successfully', 'success')
            loadCustomers(true)
        } catch (error) {
            showToast('Failed to delete customer', 'error')
        }
    }

    const formatPrice = (price) => `$${parseFloat(price || 0).toFixed(2)}`
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A'
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    // Filter and sort customers
    const filteredCustomers = customers
        .filter(customer => {
            // Type filter
            if (typeFilter !== 'all' && customer.type !== typeFilter) return false

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                return (
                    customer.name?.toLowerCase().includes(query) ||
                    customer.email?.toLowerCase().includes(query) ||
                    customer.phone?.includes(query)
                )
            }
            return true
        })
        .sort((a, b) => {
            let compareValue = 0

            switch (sortBy) {
                case 'name':
                    compareValue = (a.name || '').localeCompare(b.name || '')
                    break
                case 'order_count':
                    compareValue = (a.order_count || 0) - (b.order_count || 0)
                    break
                case 'total_spent':
                    compareValue = (a.total_spent || 0) - (b.total_spent || 0)
                    break
                case 'last_order':
                    compareValue = new Date(a.last_order_date || 0) - new Date(b.last_order_date || 0)
                    break
                default:
                    compareValue = 0
            }

            return sortOrder === 'desc' ? -compareValue : compareValue
        })

    const toggleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(column)
            setSortOrder('desc')
        }
    }

    if (authLoading || isLoading) {
        return (
            <div className="admin-customers-page">
                <LoadingSpinner size="large" message="Loading customers..." />
            </div>
        )
    }

    return (
        <div className="admin-customers-page">
            {/* Header */}
            <header className="page-header">
                <h1>Customers</h1>
                <button className="refresh-btn" onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshCw size={18} className={isRefreshing ? 'spin' : ''} />
                    Refresh
                </button>
            </header>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon total">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.total_customers}</span>
                        <span className="stat-label">Total Customers</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon registered">
                        <User size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.registered_count}</span>
                        <span className="stat-label">Registered</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon guest">
                        <ShoppingBag size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.guest_count}</span>
                        <span className="stat-label">Guest Orders</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon revenue">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">
                            {formatPrice(customers.reduce((sum, c) => sum + (c.total_spent || 0), 0))}
                        </span>
                        <span className="stat-label">Total Revenue</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="all">All Types</option>
                    <option value="registered">Registered</option>
                    <option value="guest">Guest</option>
                </select>
            </div>

            {/* Customers Table */}
            <div className="customers-table-container">
                {filteredCustomers.length === 0 ? (
                    <div className="empty-state">
                        <Users size={48} />
                        <p>No customers found</p>
                    </div>
                ) : (
                    <table className="customers-table">
                        <thead>
                            <tr>
                                <th onClick={() => toggleSort('name')} className="sortable">
                                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Contact</th>
                                <th>Type</th>
                                <th onClick={() => toggleSort('order_count')} className="sortable">
                                    Orders {sortBy === 'order_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => toggleSort('total_spent')} className="sortable">
                                    Total Spent {sortBy === 'total_spent' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => toggleSort('last_order')} className="sortable">
                                    Last Order {sortBy === 'last_order' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Joined</th>
                                {isOwner && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(customer => (
                                <tr key={customer.id}>
                                    <td className="customer-name">
                                        <div className="name-cell">
                                            <User size={16} />
                                            <strong>{customer.name}</strong>
                                        </div>
                                    </td>
                                    <td className="contact-cell">
                                        {customer.email && (
                                            <div className="contact-item">
                                                <Mail size={14} />
                                                <span>{customer.email}</span>
                                            </div>
                                        )}
                                        {customer.phone && (
                                            <div className="contact-item">
                                                <Phone size={14} />
                                                <span>{customer.phone}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`type-badge ${customer.type}`}>
                                            {customer.type === 'registered' ? 'Registered' : 'Guest'}
                                        </span>
                                    </td>
                                    <td className="orders-cell">{customer.order_count || 0}</td>
                                    <td className="spent-cell">{formatPrice(customer.total_spent)}</td>
                                    <td className="date-cell">{formatDate(customer.last_order_date)}</td>
                                    <td className="date-cell">{formatDate(customer.created_at)}</td>
                                    {isOwner && (
                                        <td className="actions-cell">
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDelete(customer.id, customer.name)}
                                                title="Delete customer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default AdminCustomersPage
