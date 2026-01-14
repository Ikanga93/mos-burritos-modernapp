import React from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../customer/Navbar'
import Footer from '../customer/Footer'
import CartDrawer from '../customer/CartDrawer'
import { useCart } from '../../contexts/CartContext'
import './CustomerLayout.css'

const CustomerLayout = ({ children, className = '' }) => {
  const location = useLocation()
  const { isCartOpen, setIsCartOpen } = useCart()
  // Pages WITHOUT navbar - only back buttons and page controls
  const pagesWithoutNavbar = ['/menu', '/location', '/about', '/catering']
  const showNavbar = !pagesWithoutNavbar.includes(location.pathname)
  
  // Pages with full-screen hero sections that should start at the top
  const isHeroPage = ['/', '/about', '/catering', '/location'].includes(location.pathname)
  
  return (
    <div className="customer-layout">
      {showNavbar && <Navbar />}
      <main className={`customer-main ${isHeroPage ? 'no-top-padding' : ''} ${className}`}>
        {children}
      </main>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <Footer />
    </div>
  )
}

export default CustomerLayout
