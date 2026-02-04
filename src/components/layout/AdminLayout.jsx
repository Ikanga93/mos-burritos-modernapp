import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, ShoppingBag, Package, MapPin, Users, UserCircle, BarChart3, Menu, X, Building2, Settings
} from 'lucide-react'
import './AdminLayout.css'

const AdminLayout = ({ children }) => {
    const location = useLocation()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const isActive = (path) => location.pathname === path

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    const closeMenu = () => {
        setIsMenuOpen(false)
    }

    return (
        <div className="admin-layout">
            {/* Top Navbar */}
            <nav className="dashboard-navbar">
                <div className="navbar-left">
                    <img src="/images/logo/burritos-logo.png" alt="Mo's Burritos" className="navbar-logo" />
                    <h1 className="navbar-brand">Mo's Burritos</h1>
                </div>

                <div className="navbar-right">
                    <button className="hamburger-btn" onClick={toggleMenu}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Horizontal Navigation Tabs */}
            <nav className="horizontal-nav">
                <div className="horizontal-nav-container">
                    <Link
                        to="/admin/dashboard"
                        className={`nav-tab ${isActive('/admin/dashboard') ? 'active' : ''}`}
                    >
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <Link
                        to="/admin/orders"
                        className={`nav-tab ${isActive('/admin/orders') ? 'active' : ''}`}
                    >
                        <ShoppingBag size={20} />
                        <span>Orders</span>
                    </Link>
                    <Link
                        to="/admin/menu"
                        className={`nav-tab ${isActive('/admin/menu') ? 'active' : ''}`}
                    >
                        <Package size={20} />
                        <span>Menu</span>
                    </Link>
                    <Link
                        to="/admin/locations"
                        className={`nav-tab ${isActive('/admin/locations') ? 'active' : ''}`}
                    >
                        <MapPin size={20} />
                        <span>Locations</span>
                    </Link>
                    <Link
                        to="/admin/customers"
                        className={`nav-tab ${isActive('/admin/customers') ? 'active' : ''}`}
                    >
                        <UserCircle size={20} />
                        <span>Customers</span>
                    </Link>
                    <Link
                        to="/admin/analytics"
                        className={`nav-tab ${isActive('/admin/analytics') ? 'active' : ''}`}
                    >
                        <BarChart3 size={20} />
                        <span>Analytics</span>
                    </Link>
                    <Link
                        to="/admin/settings"
                        className={`nav-tab ${isActive('/admin/settings') ? 'active' : ''}`}
                    >
                        <Settings size={20} />
                        <span>Settings</span>
                    </Link>
                </div>
            </nav>

            {/* Slide-out Menu (Mobile) */}
            {isMenuOpen && (
                <div className="menu-overlay" onClick={toggleMenu}>
                    <div className="menu-panel" onClick={(e) => e.stopPropagation()}>
                        {/* Admin Panel Header */}
                        <div className="menu-profile">
                            <div className="profile-avatar">
                                <img src="/images/logo/burritos-logo.png" alt="Profile" className="profile-logo" />
                            </div>
                            <div className="profile-info">
                                <h3>Admin Panel</h3>
                                <span className="profile-role">Manager</span>
                            </div>
                        </div>

                        {/* Menu Navigation */}
                        <nav className="menu-nav">
                            <Link to="/admin/locations" className="menu-item" onClick={closeMenu}>
                                <Building2 size={20} />
                                <span>Restaurant</span>
                            </Link>

                            <Link to="/admin/staff" className="menu-item" onClick={closeMenu}>
                                <Users size={20} />
                                <span>Staff</span>
                            </Link>

                            <Link to="/admin/settings" className="menu-item" onClick={closeMenu}>
                                <Settings size={20} />
                                <span>Settings</span>
                            </Link>
                        </nav>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="admin-main">
                {children}
            </main>
        </div>
    )
}

export default AdminLayout
