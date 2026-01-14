import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Loader } from 'lucide-react'
import Navbar from '../customer/Navbar'
import Footer from '../customer/Footer'
import CartDrawer from '../customer/CartDrawer'
import { useCart } from '../../contexts/CartContext'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { useToast } from '../../contexts/ToastContext'
import './CustomerLayout.css'

const CustomerLayout = ({ children, className = '' }) => {
  const location = useLocation()
  const { isCartOpen, setIsCartOpen, triggerCheckout } = useCart()
  const { customer, isAuthenticated } = useCustomerAuth()
  const { showToast } = useToast()
  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false)

  // Handle auto-opening cart or triggering checkout after login redirect
  useEffect(() => {
    const handleReturnAction = async () => {
      if (location.state?.triggerCheckout && isAuthenticated && customer) {
        // Show loading overlay
        setIsRedirectingToPayment(true)
        
        // Trigger Stripe redirect immediately
        const result = await triggerCheckout(customer)
        if (!result.success) {
          // If checkout fails, hide loading and open cart drawer so user can see why
          setIsRedirectingToPayment(false)
          setIsCartOpen(true)
          showToast(result.error, 'error')
        }
        // Clear state to avoid reopening on every navigation
        window.history.replaceState({}, document.title)
      } else if (location.state?.openCart) {
        setIsCartOpen(true)
        // Clear state to avoid reopening on every navigation
        window.history.replaceState({}, document.title)
      }
    }

    handleReturnAction()
  }, [location.state, isAuthenticated, customer, setIsCartOpen, triggerCheckout, showToast])

  // Pages WITHOUT navbar - only back buttons and page controls
  const pagesWithoutNavbar = ['/menu', '/location', '/about', '/catering']
  const showNavbar = !pagesWithoutNavbar.includes(location.pathname)
  
  // Pages with full-screen hero sections that should start at the top
  const isHeroPage = ['/', '/about', '/catering', '/location'].includes(location.pathname)
  
  return (
    <div className="customer-layout">
      {/* Payment Redirect Loading Overlay */}
      {isRedirectingToPayment && (
        <div className="payment-redirect-overlay">
          <div className="payment-redirect-content">
            <Loader size={48} className="spin" />
            <h2>Redirecting to Payment</h2>
            <p>Please wait while we prepare your checkout session...</p>
          </div>
        </div>
      )}
      
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
