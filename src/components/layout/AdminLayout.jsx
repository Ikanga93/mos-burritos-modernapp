import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, ShoppingBag, Package, MapPin, Users, UserCircle, BarChart3, LogOut, Menu, X, Building2, Settings,
    ChefHat, Truck, CalendarCheck, CreditCard, Megaphone, UtensilsCrossed, Award
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
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/admin/login')
        showToast('Logged out successfully', 'info')
        setIsMenuOpen(false)
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

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    const closeMenu = () => {
        setIsMenuOpen(false)
    }

    // Don't show layout if not authenticated or loading
    if (isLoading || !isAuthenticated) {
        return children
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

            {/* Slide-out Menu */}
            {isMenuOpen && (
                <div className="menu-overlay" onClick={toggleMenu}>
                    <div className="menu-panel" onClick={(e) => e.stopPropagation()}>
                        {/* User Profile Section */}
                        <Link to="/admin/profile" className="menu-profile" onClick={closeMenu}>
                            <div className="profile-avatar">
                                <img src="/images/logo/burritos-logo.png" alt="Profile" className="profile-logo" />
                            </div>
                            <div className="profile-info">
                                <h3>{admin?.first_name} {admin?.last_name}</h3>
                                <span className="profile-role">{role}</span>
                            </div>
                        </Link>
                        
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

            {/* Sidebar */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <button className="sidebar-close-btn" onClick={closeSidebar} aria-label="Close menu">
                    <X size={20} />
                </button>

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
                        to="/admin/customers" 
                        className={`nav-item ${isActive('/admin/customers') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <UserCircle size={20} />
                        <span>Customers</span>
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
                        to="/admin/kitchen" 
                        className={`nav-item ${isActive('/admin/kitchen') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <ChefHat size={20} />
                        <span>Kitchen</span>
                    </Link>
                    <Link 
                        to="/admin/delivery" 
                        className={`nav-item ${isActive('/admin/delivery') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <Truck size={20} />
                        <span>Delivery</span>
                    </Link>
                    <Link 
                        to="/admin/reservations" 
                        className={`nav-item ${isActive('/admin/reservations') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <CalendarCheck size={20} />
                        <span>Reservations</span>
                    </Link>
                    <Link 
                        to="/admin/payments" 
                        className={`nav-item ${isActive('/admin/payments') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <CreditCard size={20} />
                        <span>Payments</span>
                    </Link>
                    <Link 
                        to="/admin/settings" 
                        className={`nav-item ${isActive('/admin/settings') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <Settings size={20} />
                        <span>Settings</span>
                    </Link>
                    <Link 
                        to="/admin/marketing" 
                        className={`nav-item ${isActive('/admin/marketing') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <Megaphone size={20} />
                        <span>Marketing</span>
                    </Link>
                    <Link 
                        to="/admin/catering" 
                        className={`nav-item ${isActive('/admin/catering') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <UtensilsCrossed size={20} />
                        <span>Catering</span>
                    </Link>
                    <Link 
                        to="/admin/loyalty" 
                        className={`nav-item ${isActive('/admin/loyalty') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <Award size={20} />
                        <span>Loyalty</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                {children}
            </main>
        </div>
    )
}

export default AdminLayout
