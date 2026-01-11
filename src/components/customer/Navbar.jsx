import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Menu as MenuIcon, X, LogOut } from 'lucide-react'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { useCart } from '../../contexts/CartContext'
import './Navbar.css'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, customer, logout } = useCustomerAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMenuOpen(false)
  }

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <nav className="customer-navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <img src="/images/logo/burritos-logo.png" alt="Mo's Burritos" />
          <span className="navbar-logo-text">Mo's Burritos</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-links desktop">
          {isAuthenticated ? (
            <>
              {/* Logged-in user links */}
              <Link to="/my-orders" className="navbar-link">My Orders</Link>
              <Link to="/profile" className="navbar-link">Profile</Link>
            </>
          ) : (
            <>
              {/* Public navigation links */}
              <Link to="/" className="navbar-link">Home</Link>
              <Link to="/menu" className="navbar-link">Menu</Link>
              <Link to="/location" className="navbar-link">Locations</Link>
              <Link to="/about" className="navbar-link">About</Link>
              <Link to="/catering" className="navbar-link">Catering</Link>
            </>
          )}
        </div>

        {/* Right Actions */}
        <div className="navbar-actions">
          {/* Cart Icon - only show when authenticated */}
          {isAuthenticated && (
            <Link to="/cart" className="navbar-cart" onClick={closeMenu}>
              <ShoppingCart size={24} />
              {itemCount > 0 && (
                <span className="cart-badge">{itemCount}</span>
              )}
            </Link>
          )}

          {/* User Menu */}
          {isAuthenticated ? (
            <button className="navbar-logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          ) : (
            <Link to="/login" className="navbar-login-btn" onClick={closeMenu}>
              <User size={20} />
              <span>Login</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="navbar-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="navbar-mobile-menu">
          {isAuthenticated ? (
            <>
              {/* Logged-in user mobile links */}
              <Link to="/my-orders" className="mobile-menu-link" onClick={closeMenu}>
                My Orders
              </Link>
              <Link to="/profile" className="mobile-menu-link" onClick={closeMenu}>
                Profile
              </Link>
              <div className="mobile-menu-divider"></div>
              <button className="mobile-menu-link logout-link" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Public mobile links */}
              <Link to="/" className="mobile-menu-link" onClick={closeMenu}>
                Home
              </Link>
              <Link to="/menu" className="mobile-menu-link" onClick={closeMenu}>
                Menu
              </Link>
              <Link to="/location" className="mobile-menu-link" onClick={closeMenu}>
                Locations
              </Link>
              <Link to="/about" className="mobile-menu-link" onClick={closeMenu}>
                About
              </Link>
              <Link to="/catering" className="mobile-menu-link" onClick={closeMenu}>
                Catering
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar
