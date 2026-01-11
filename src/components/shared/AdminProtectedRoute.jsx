import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import LoadingSpinner from './LoadingSpinner'

/**
 * AdminProtectedRoute - Route guard for admin/staff pages
 * Redirects to admin login if not authenticated as staff
 */
const AdminProtectedRoute = ({ children, requiredRole = null }) => {
    const { isAuthenticated, isLoading, role } = useAdminAuth()
    const location = useLocation()

    // Show loading while checking auth status
    if (isLoading) {
        return <LoadingSpinner size="large" message="Checking authentication..." />
    }

    // Redirect to admin login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />
    }

    // Check required role if specified
    if (requiredRole) {
        const roleHierarchy = ['staff', 'manager', 'owner']
        const userRoleLevel = roleHierarchy.indexOf(role)
        const requiredRoleLevel = roleHierarchy.indexOf(requiredRole)

        if (userRoleLevel < requiredRoleLevel) {
            // User doesn't have sufficient permissions
            return (
                <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <h1>Access Denied</h1>
                    <p>You don't have permission to view this page.</p>
                </div>
            )
        }
    }

    return children
}

export default AdminProtectedRoute
