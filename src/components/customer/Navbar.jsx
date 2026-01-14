import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Menu as MenuIcon, X, LogOut, Home, UtensilsCrossed, MapPin, Info, Truck } from 'lucide-react'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { useCart } from '../../contexts/CartContext'
import './Navbar.css'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { isAuthenticated, customer, logout } = useCustomerAuth()
  const { itemCount, setIsCartOpen } = useCart()
  const navigate = useNavigate()

  // Scroll detection for transparent/solid navbar transition
  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = 50
      setIsScrolled(window.scrollY > scrollThreshold)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Set initial state

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMenuOpen(false)
  }

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <nav className={`customer-navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <img src="/images/logo/bobos-logo.jpg" alt="Bobo's Barbecue" />
          <span className="navbar-logo-text">Bobo's Barbecue</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-links desktop">
          {isAuthenticated ? (
            <>
              {/* Logged-in user links */}
              <Link to="/menu" className="navbar-link">Menu</Link>
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
            <button
              className="navbar-cart-btn"
              onClick={() => {
                closeMenu();
                setIsCartOpen(true);
              }}
              aria-label={`Cart with ${itemCount} items`}
            >
              <ShoppingCart size={24} />
              {itemCount > 0 && (
                <span className="cart-badge">{itemCount}</span>
              )}
            </button>
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

      {/* Mobile Menu - Vertical Icon Menu */}
      {isMenuOpen && (
        <div className="navbar-icon-menu">
          {isAuthenticated ? (
            <>
              {/* Logged-in user icon menu */}
              <Link to="/menu" className="icon-menu-item" onClick={closeMenu}>
                <UtensilsCrossed size={24} />
                <span className="icon-label">Menu</span>
              </Link>
              <button
                className="icon-menu-item"
                onClick={() => {
                  closeMenu();
                  setIsCartOpen(true);
                }}
              >
                <ShoppingCart size={24} />
                <span className="icon-label">Cart</span>
              </button>
              <Link to="/my-orders" className="icon-menu-item" onClick={closeMenu}>
                <Truck size={24} />
                <span className="icon-label">My Orders</span>
              </Link>
              <Link to="/profile" className="icon-menu-item" onClick={closeMenu}>
                <User size={24} />
                <span className="icon-label">Profile</span>
              </Link>
              <button className="icon-menu-item logout-icon" onClick={handleLogout}>
                <LogOut size={24} />
                <span className="icon-label">Logout</span>
              </button>
            </>
          ) : (
            <>
              {/* Public icon menu */}
              <Link to="/" className="icon-menu-item" onClick={closeMenu}>
                <Home size={24} />
                <span className="icon-label">Home</span>
              </Link>
              <Link to="/menu" className="icon-menu-item" onClick={closeMenu}>
                <UtensilsCrossed size={24} />
                <span className="icon-label">Menu</span>
              </Link>
              <Link to="/location" className="icon-menu-item" onClick={closeMenu}>
                <MapPin size={24} />
                <span className="icon-label">Locations</span>
              </Link>
              <Link to="/about" className="icon-menu-item" onClick={closeMenu}>
                <Info size={24} />
                <span className="icon-label">About</span>
              </Link>
              <Link to="/catering" className="icon-menu-item" onClick={closeMenu}>
                <Truck size={24} />
                <span className="icon-label">Catering</span>
              </Link>
              <Link to="/login" className="icon-menu-item" onClick={closeMenu}>
                <User size={24} />
                <span className="icon-label">Login</span>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar
