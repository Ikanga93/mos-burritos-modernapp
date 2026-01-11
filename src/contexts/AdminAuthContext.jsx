import React, { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/api'

const AdminAuthContext = createContext(null)

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check for stored admin tokens on mount
    const accessToken = localStorage.getItem('adminAccessToken')
    const refreshToken = localStorage.getItem('adminRefreshToken')

    if (accessToken) {
      fetchUser(accessToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 403 || response.status === 401) {
        // Token might be expired, try to refresh
        console.log('Access token expired, attempting refresh...')
        try {
          const newToken = await refreshAccessToken()
          // Retry with new token
          const retryResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          })
          
          if (!retryResponse.ok) {
            throw new Error('Failed to fetch user after token refresh')
          }
          
          const userData = await retryResponse.json()

          // Only set user if they are an admin (owner, manager, or staff)
          if (userData.role === 'owner' || userData.role === 'manager' || userData.role === 'staff') {
            setUser(userData)
          } else {
            // If customer, clear tokens
            localStorage.removeItem('adminAccessToken')
            localStorage.removeItem('adminRefreshToken')
          }
          return
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          // Clear tokens and continue with error handling
          localStorage.removeItem('adminAccessToken')
          localStorage.removeItem('adminRefreshToken')
          throw new Error('Session expired. Please log in again.')
        }
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }

      const userData = await response.json()

      // Only set user if they are an admin (owner, manager, or staff)
      if (userData.role === 'owner' || userData.role === 'manager' || userData.role === 'staff') {
        setUser(userData)
      } else {
        // If customer, clear tokens
        localStorage.removeItem('adminAccessToken')
        localStorage.removeItem('adminRefreshToken')
      }
    } catch (error) {
      console.error('Error fetching admin user:', error)
      // Only clear storage if it's a session/auth error
      if (error.message.includes('Session expired') || error.message.includes('authentication')) {
        localStorage.removeItem('adminAccessToken')
        localStorage.removeItem('adminRefreshToken')
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setError(null)

      // Note: Backend register endpoint creates CUSTOMER accounts only
      // For admin accounts, use the backend's admin user creation endpoint
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Verify the registered user is an admin (owner, manager, or staff)
      if (data.user && data.user.role !== 'owner' && data.user.role !== 'manager' && data.user.role !== 'staff') {
        throw new Error('Invalid registration - not an admin account')
      }

      // Store admin tokens
      localStorage.setItem('adminAccessToken', data.accessToken)
      localStorage.setItem('adminRefreshToken', data.refreshToken)
      
      // Store user information with location data
      const userInfo = {
        ...data.user,
        assignedLocations: data.assignedLocations || [],
        currentLocation: data.currentLocation || null
      }
      localStorage.setItem('currentUser', JSON.stringify(userInfo))
      setUser(userInfo)

      return data
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const login = async (credentials) => {
    try {
      setError(null)
      console.log('🔐 Attempting login with:', credentials.email)
      console.log('🔐 API URL:', `${API_BASE_URL}/api/auth/login`)

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      console.log('🔐 Login response status:', response.status)
      const data = await response.json()
      console.log('🔐 Login response data:', data)

      if (!response.ok) {
        console.error('🔐 Login failed:', data)
        throw new Error(data.detail || data.error || 'Login failed')
      }

      console.log('🔐 User role:', data.user?.role)

      // Verify the logged in user is an admin (owner, manager, or staff - not customer)
      if (!data.user || (data.user.role !== 'owner' && data.user.role !== 'manager' && data.user.role !== 'staff')) {
        console.error('🔐 Access denied. User role:', data.user?.role)
        throw new Error('Access denied. Admin credentials required.')
      }

      console.log('🔐 Storing tokens and user data...')

      // Store admin tokens
      localStorage.setItem('adminAccessToken', data.accessToken)
      localStorage.setItem('adminRefreshToken', data.refreshToken)

      // Store user information with location data
      const userInfo = {
        ...data.user,
        assignedLocations: data.assignedLocations || [],
        currentLocation: data.currentLocation || null
      }
      localStorage.setItem('currentUser', JSON.stringify(userInfo))
      setUser(userInfo)

      console.log('🔐 Login successful! User:', userInfo)
      return data
    } catch (error) {
      console.error('🔐 Login error:', error)
      setError(error.message)
      throw error
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('adminRefreshToken')
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminAccessToken')}`
          },
          body: JSON.stringify({ refreshToken })
        })
      }
    } catch (error) {
      console.error('Admin logout error:', error)
    } finally {
      // Clear admin storage and state regardless of API call success
      localStorage.removeItem('adminAccessToken')
      localStorage.removeItem('adminRefreshToken')
      localStorage.removeItem('currentUser')
      setUser(null)
    }
  }

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('adminRefreshToken')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Token refresh failed')
      }

      // Verify refreshed user is still an admin (owner, manager, or staff)
      if (!data.user || (data.user.role !== 'owner' && data.user.role !== 'manager' && data.user.role !== 'staff')) {
        throw new Error('Invalid user role after refresh')
      }

      // Store new tokens
      localStorage.setItem('adminAccessToken', data.accessToken)
      localStorage.setItem('adminRefreshToken', data.refreshToken)

      // Store user information with location data
      const userInfo = {
        ...data.user,
        assignedLocations: data.assignedLocations || [],
        currentLocation: data.currentLocation || null
      }
      localStorage.setItem('currentUser', JSON.stringify(userInfo))
      setUser(userInfo)

      return data.accessToken
    } catch (error) {
      console.error('Admin token refresh error:', error)
      // If refresh fails, logout
      logout()
      throw error
    }
  }

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    refreshAccessToken
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
} 