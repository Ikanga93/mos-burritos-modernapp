import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { useToast } from '../../contexts/ToastContext'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import './AuthCallbackPage.css'

const AuthCallbackPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { handleOAuthCallback } = useCustomerAuth()
  const { showToast } = useToast()

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        const result = await handleOAuthCallback()

        if (result.success) {
          showToast('Successfully signed in with Google!', 'success')

          // Check for stored return path
          let returnTo = { pathname: '/menu' }
          const storedReturnTo = sessionStorage.getItem('authReturnTo')
          if (storedReturnTo) {
            try {
              returnTo = JSON.parse(storedReturnTo)
              sessionStorage.removeItem('authReturnTo')
            } catch (e) {
              console.error('Error parsing stored return path:', e)
            }
          }

          // Redirect to intended page or menu
          navigate(returnTo.pathname || '/menu', { 
            replace: true, 
            state: { 
              openCart: returnTo.openCart,
              triggerCheckout: returnTo.triggerCheckout
            } 
          })
        } else {
          showToast(result.error || 'Authentication failed', 'error')
          navigate('/login', { replace: true })
        }
      } catch (error) {
        console.error('OAuth callback error:', error)
        showToast('Authentication failed. Please try again.', 'error')
        navigate('/login', { replace: true })
      }
    }

    processOAuthCallback()
  }, [])

  return (
    <div className="auth-callback-page">
      <div className="auth-callback-container">
        <LoadingSpinner />
        <p className="auth-callback-message">Completing sign in...</p>
      </div>
    </div>
  )
}

export default AuthCallbackPage
