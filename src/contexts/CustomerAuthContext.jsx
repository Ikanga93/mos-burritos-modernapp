import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getSupabaseSession,
  isSupabaseEnabled,
  signOutSupabase,
  handleOAuthCallback as handleSupabaseOAuthCallback,
  signInWithGoogle as supabaseSignInWithGoogle
} from '../services/supabaseClient'
import { getApiBaseUrl } from '../utils/apiConfig'

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

  const apiUrl = getApiBaseUrl()
  const isProduction = import.meta.env.VITE_ENVIRONMENT === 'production'

  // Initialize auth state from localStorage or Supabase
  useEffect(() => {
    const initAuth = async () => {
      // Clean up any old auth type tracking from previous hybrid system
      localStorage.removeItem('authType')

      if (isProduction && isSupabaseEnabled()) {
        // Production: Check for OAuth callback in URL first
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const hasOAuthParams = hashParams.has('access_token') || hashParams.has('error')
        
        if (hasOAuthParams) {
          // Handle OAuth callback explicitly
          console.log('Detected OAuth callback in URL, processing...')
          const session = await handleSupabaseOAuthCallback()
          if (session) {
            setAccessToken(session.access_token)
            setRefreshToken(session.refresh_token)
            await fetchCurrentUser(session.access_token)
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname)
          } else {
            setIsLoading(false)
          }
        } else {
          // Check existing Supabase session
          const session = await getSupabaseSession()
          if (session) {
            setAccessToken(session.access_token)
            setRefreshToken(session.refresh_token)
            fetchCurrentUser(session.access_token)
          } else {
            setIsLoading(false)
          }
        }
      } else {
        // Development: Check localStorage for JWT
        const storedAccessToken = localStorage.getItem('customerAccessToken')
        const storedRefreshToken = localStorage.getItem('customerRefreshToken')

        if (storedAccessToken && storedRefreshToken) {
          setAccessToken(storedAccessToken)
          setRefreshToken(storedRefreshToken)
          fetchCurrentUser(storedAccessToken)
        } else {
          setIsLoading(false)
        }
      }
    }

    initAuth()
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

  // Login (environment-aware)
  const login = async (email, password) => {
    try {
      // Use different endpoints based on environment
      const endpoint = isProduction && isSupabaseEnabled()
        ? `${apiUrl}/api/auth/supabase/login`
        : `${apiUrl}/api/auth/login`

      const response = await fetch(endpoint, {
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

      // Store tokens (localStorage for dev, Supabase handles storage for prod)
      if (!isProduction) {
        localStorage.setItem('customerAccessToken', data.accessToken)
        localStorage.setItem('customerRefreshToken', data.refreshToken)
      }

      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      
      // Ensure customer data is fully set before resolving
      // This prevents race conditions where redirect happens before customer is available
      const loggedInUser = data.user
      setCustomer(loggedInUser)
      setIsAuthenticated(true)

      // Wait a bit for state to propagate (React batches updates)
      await new Promise(resolve => setTimeout(resolve, 100))

      return { success: true, user: loggedInUser }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }

  // Register (environment-aware)
  const register = async (userData) => {
    try {
      // Use different endpoints based on environment
      const endpoint = isProduction && isSupabaseEnabled()
        ? `${apiUrl}/api/auth/supabase/register`
        : `${apiUrl}/api/auth/register`

      const response = await fetch(endpoint, {
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

      // Store tokens (localStorage for dev, Supabase handles storage for prod)
      if (!isProduction) {
        localStorage.setItem('customerAccessToken', data.accessToken)
        localStorage.setItem('customerRefreshToken', data.refreshToken)
      }

      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      
      // Ensure customer data is fully set before resolving
      // This prevents race conditions where redirect happens before customer is available
      const registeredUser = data.user
      setCustomer(registeredUser)
      setIsAuthenticated(true)

      // Wait a bit for state to propagate (React batches updates)
      await new Promise(resolve => setTimeout(resolve, 100))

      return { success: true, user: registeredUser }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: error.message }
    }
  }

  // Logout (environment-aware)
  const logout = useCallback(async () => {
    if (isProduction && isSupabaseEnabled()) {
      await signOutSupabase()
    }
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

  // Refresh access token (environment-aware)
  const refreshAccessTokenInternal = async () => {
    const currentRefreshToken = refreshToken || localStorage.getItem('customerRefreshToken')

    if (!currentRefreshToken) {
      clearAuth()
      return null
    }

    try {
      // Use different endpoints based on environment
      const endpoint = isProduction && isSupabaseEnabled()
        ? `${apiUrl}/api/auth/supabase/refresh`
        : `${apiUrl}/api/auth/refresh`

      const response = await fetch(endpoint, {
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

      // Store new tokens (different field names for JWT vs Supabase)
      const newAccessToken = data.accessToken || data.access_token
      const newRefreshToken = data.refreshToken || data.refresh_token

      if (!isProduction) {
        localStorage.setItem('customerAccessToken', newAccessToken)
        localStorage.setItem('customerRefreshToken', newRefreshToken)
      }

      setAccessToken(newAccessToken)
      setRefreshToken(newRefreshToken)

      return newAccessToken
    } catch (error) {
      console.error('Token refresh error:', error)
      clearAuth()
      return null
    }
  }

  // Public refresh function
  const refreshAccessToken = refreshAccessTokenInternal

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    if (!isProduction || !isSupabaseEnabled()) {
      return {
        success: false,
        error: 'Google sign-in is only available in production mode'
      }
    }

    try {
      await supabaseSignInWithGoogle()
      // Redirects to Google - execution stops here
      return { success: true }
    } catch (error) {
      console.error('Google sign-in error:', error)
      return {
        success: false,
        error: error.message || 'Failed to sign in with Google'
      }
    }
  }

  // Handle OAuth callback after redirect
  const handleOAuthCallback = async () => {
    try {
      // Get session from Supabase (Supabase automatically detects OAuth session in URL)
      const session = await handleSupabaseOAuthCallback()

      if (!session) {
        return { success: false, error: 'No session found' }
      }

      // Fetch user data from backend using the session token
      // The existing fetchCurrentUser function already handles this
      setAccessToken(session.access_token)
      setRefreshToken(session.refresh_token)

      await fetchCurrentUser(session.access_token)

      return { success: true }
    } catch (error) {
      console.error('OAuth callback error:', error)
      return {
        success: false,
        error: error.message || 'Authentication failed'
      }
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
    refreshAccessToken,
    signInWithGoogle,
    handleOAuthCallback
  }

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export default CustomerAuthProvider
