import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, ShoppingBag, Package, MapPin, Users, UserCircle, BarChart3, LogOut, Menu, X
} from 'lucide-react'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { useToast } from '../../contexts/ToastContext'
import './AdminLayout.css'

const AdminLayout = ({ children }) => {
    const location = useLocation()
    const navigate = useNavigate()
    const { admin, logout, isAuthenticated, isLoading, role, assignedLocations, currentLocation, switchLocation } = useAdminAuth()
    const { showToast } = useToast()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/admin/login')
        showToast('Logged out successfully', 'info')
    }

    const handleLocationSwitch = (e) => {
        const newLocationId = e.target.value
        switchLocation(newLocationId)
        showToast('Location switched', 'success')
    }

    const isActive = (path) => location.pathname === path
    const isOwner = role === 'owner'

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    const closeSidebar = () => {
        setIsSidebarOpen(false)
    }

    // Don't show layout if not authenticated or loading
    if (isLoading || !isAuthenticated) {
        return children
    }

    return (
        <div className="admin-layout">
            {/* Mobile Menu Toggle Button */}
            <button 
                className="mobile-menu-toggle" 
                onClick={toggleSidebar}
                aria-label="Toggle menu"
            >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={closeSidebar}></div>
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <button className="sidebar-close-btn" onClick={closeSidebar} aria-label="Close menu">
                        <X size={20} />
                    </button>
                    <img src="/images/logo/burritos-logo.png" alt="Mo's Burritos" className="sidebar-logo" />
                    <h2>Mo's Burritos</h2>
                    <span className="role-badge">{admin?.role || 'Admin'}</span>

                    {/* Location Switcher for Staff/Manager with multiple locations */}
                    {!isOwner && assignedLocations && assignedLocations.length > 1 && (
                        <div className="location-switcher">
                            <label>Location:</label>
                            <select
                                value={currentLocation?.id || ''}
                                onChange={handleLocationSwitch}
                                className="location-switch-select"
                            >
                                {assignedLocations.map(al => (
                                    <option key={al.location_id} value={al.location_id}>
                                        {al.location_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {!isOwner && assignedLocations && assignedLocations.length === 1 && currentLocation && (
                        <div className="single-location-badge">
                            <MapPin size={14} />
                            {currentLocation.name}
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    <Link 
                        to="/admin/dashboard" 
                        className={`nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <Link 
                        to="/admin/analytics" 
                        className={`nav-item ${isActive('/admin/analytics') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <BarChart3 size={20} />
                        <span>Analytics</span>
                    </Link>
                    <Link 
                        to="/admin/orders" 
                        className={`nav-item ${isActive('/admin/orders') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <ShoppingBag size={20} />
                        <span>Orders</span>
                    </Link>
                    <Link 
                        to="/admin/menu" 
                        className={`nav-item ${isActive('/admin/menu') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <Package size={20} />
                        <span>Menu</span>
                    </Link>
                    <Link 
                        to="/admin/locations" 
                        className={`nav-item ${isActive('/admin/locations') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <MapPin size={20} />
                        <span>Locations</span>
                    </Link>
                    <Link 
                        to="/admin/staff" 
                        className={`nav-item ${isActive('/admin/staff') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <Users size={20} />
                        <span>Staff</span>
                    </Link>
                    <Link 
                        to="/admin/customers" 
                        className={`nav-item ${isActive('/admin/customers') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <UserCircle size={20} />
                        <span>Customers</span>
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <div className="admin-info">
                        <span className="admin-name">{admin?.first_name || 'Admin'}</span>
                        <span className="admin-email">{admin?.email}</span>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                {children}
            </main>
        </div>
    )
}

export default AdminLayout
