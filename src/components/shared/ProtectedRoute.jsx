import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'

/**
 * Protected Route Component for Customer Authentication
 * Redirects to login page if user is not authenticated
 * Passes redirect parameter to login page to return to intended page after login
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useCustomerAuth()
  const location = useLocation()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // User is authenticated, render children
  return <>{children}</>
}

export default ProtectedRoute
