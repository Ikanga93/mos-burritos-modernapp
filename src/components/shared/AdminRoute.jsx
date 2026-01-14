import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

/**
 * Admin Route Component for Admin Authentication
 * Redirects to admin login page if user is not authenticated
 * Can optionally check for specific roles or location access
 */
const AdminRoute = ({ children, requiredRole = null, requiredLocation = null }) => {
  const location = useLocation()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="admin-route-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Redirect to admin login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // Check role if required
  if (requiredRole) {
    const roleHierarchy = {
      'owner': 3,
      'manager': 2,
      'staff': 1
    }

    const userRoleLevel = roleHierarchy[role] || 0
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="admin-route-forbidden">
          <h2>Access Denied</h2>
          <p>You do not have permission to access this page.</p>
          <p>Required role: {requiredRole}</p>
        </div>
      )
    }
  }

  // Check location access if required
  if (requiredLocation && !canAccessLocation(requiredLocation)) {
    return (
      <div className="admin-route-forbidden">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this location.</p>
      </div>
    )
  }

  // User is authenticated and authorized, render children
  return <>{children}</>
}

export default AdminRoute
