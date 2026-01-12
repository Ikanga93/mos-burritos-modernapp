import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CustomerAuthContext = createContext(null)

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext)
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider')
  }
  return context
}

export const CustomerAuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [refreshToken, setRefreshToken] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // Initialize auth state from localStorage
  useEffect(() => {
    // Clean up any old auth type tracking from previous hybrid system
    localStorage.removeItem('authType')

    const storedAccessToken = localStorage.getItem('customerAccessToken')
    const storedRefreshToken = localStorage.getItem('customerRefreshToken')

    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken)
      setRefreshToken(storedRefreshToken)
      // Fetch current user
      fetchCurrentUser(storedAccessToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  // Fetch current user info
  const fetchCurrentUser = async (token) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCustomer(data)
        setIsAuthenticated(true)
      } else if (response.status === 401) {
        // Token expired, try to refresh
        console.log('Access token expired, attempting refresh...')
        const newToken = await refreshAccessTokenInternal()

        if (newToken) {
          // Retry with new token
          const retryResponse = await fetch(`${apiUrl}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          })

          if (retryResponse.ok) {
            const data = await retryResponse.json()
            setCustomer(data)
            setIsAuthenticated(true)
          } else {
            // Still failed, clear auth
            clearAuth()
          }
        } else {
          // Refresh failed, clear auth
          clearAuth()
        }
      } else {
        // Other error, clear auth
        clearAuth()
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      clearAuth()
    } finally {
      setIsLoading(false)
    }
  }

  // Login (Supabase only)
  const login = async (email, password) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/supabase/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Invalid login credentials')
      }

      const data = await response.json()

      // Store Supabase tokens
      localStorage.setItem('customerAccessToken', data.accessToken)
      localStorage.setItem('customerRefreshToken', data.refreshToken)

      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      setCustomer(data.user)
      setIsAuthenticated(true)

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }

  // Register (using Supabase)
  const register = async (userData) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/supabase/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Registration failed')
      }

      const data = await response.json()

      // Auto-login after registration with Supabase tokens
      localStorage.setItem('customerAccessToken', data.accessToken)
      localStorage.setItem('customerRefreshToken', data.refreshToken)

      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      setCustomer(data.user)
      setIsAuthenticated(true)

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: error.message }
    }
  }

  // Logout
  const logout = useCallback(() => {
    clearAuth()
  }, [])

  // Clear authentication
  const clearAuth = () => {
    localStorage.removeItem('customerAccessToken')
    localStorage.removeItem('customerRefreshToken')
    setAccessToken(null)
    setRefreshToken(null)
    setCustomer(null)
    setIsAuthenticated(false)
  }

  // Refresh access token (Supabase only)
  const refreshAccessTokenInternal = async () => {
    const currentRefreshToken = refreshToken || localStorage.getItem('customerRefreshToken')

    if (!currentRefreshToken) {
      clearAuth()
      return null
    }

    try {
      const response = await fetch(`${apiUrl}/api/auth/supabase/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: currentRefreshToken })
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()

      // Store new Supabase tokens
      localStorage.setItem('customerAccessToken', data.access_token)
      localStorage.setItem('customerRefreshToken', data.refresh_token)

      setAccessToken(data.access_token)
      setRefreshToken(data.refresh_token)

      return data.access_token
    } catch (error) {
      console.error('Token refresh error:', error)
      clearAuth()
      return null
    }
  }

  // Public refresh function
  const refreshAccessToken = refreshAccessTokenInternal

  const value = {
    customer,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshAccessToken
  }

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export default CustomerAuthProvider
