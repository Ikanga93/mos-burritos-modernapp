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
      } else {
        // Token is invalid, clear auth
        clearAuth()
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      clearAuth()
    } finally {
      setIsLoading(false)
    }
  }

  // Login
  const login = async (email, password) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Login failed')
      }

      const data = await response.json()

      // Store tokens
      localStorage.setItem('customerAccessToken', data.access_token)
      localStorage.setItem('customerRefreshToken', data.refresh_token)

      setAccessToken(data.access_token)
      setRefreshToken(data.refresh_token)
      setCustomer(data.user)
      setIsAuthenticated(true)

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }

  // Register
  const register = async (userData) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/register`, {
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

      // Auto-login after registration
      localStorage.setItem('customerAccessToken', data.access_token)
      localStorage.setItem('customerRefreshToken', data.refresh_token)

      setAccessToken(data.access_token)
      setRefreshToken(data.refresh_token)
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

  // Refresh access token
  const refreshAccessToken = async () => {
    const currentRefreshToken = refreshToken || localStorage.getItem('customerRefreshToken')

    if (!currentRefreshToken) {
      clearAuth()
      return null
    }

    try {
      const response = await fetch(`${apiUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: currentRefreshToken })
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()

      localStorage.setItem('customerAccessToken', data.access_token)
      setAccessToken(data.access_token)

      return data.access_token
    } catch (error) {
      console.error('Token refresh error:', error)
      clearAuth()
      return null
    }
  }

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
