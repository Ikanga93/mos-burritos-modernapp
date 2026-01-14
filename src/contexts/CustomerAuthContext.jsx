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

  // Initialize auth state from Supabase
  useEffect(() => {
    const initAuth = async () => {
      if (isSupabaseEnabled()) {
        const session = await getSupabaseSession()
        if (session) {
          setAccessToken(session.access_token)
          setRefreshToken(session.refresh_token)
          fetchCurrentUser(session.access_token)
        } else {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // Fetch current user info
  const fetchCurrentUser = async (token) => {
    console.log('[CustomerAuth] Fetching current user with token prefix:', token?.substring(0, 10));
    try {
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[CustomerAuth] Current user fetched successfully:', data.email, 'Role:', data.role);
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

  // Login using Supabase Auth
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
      console.log('[CustomerAuth] Login successful for email:', data.user?.email);

      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      
      const loggedInUser = data.user
      setCustomer(loggedInUser)
      setIsAuthenticated(true)

      // Wait a bit for state to propagate
      await new Promise(resolve => setTimeout(resolve, 100))

      return { success: true, user: loggedInUser }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }

  // Register using Supabase Auth
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

      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      
      const registeredUser = data.user
      setCustomer(registeredUser)
      setIsAuthenticated(true)

      // Wait a bit for state to propagate
      await new Promise(resolve => setTimeout(resolve, 100))

      return { success: true, user: registeredUser }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: error.message }
    }
  }

  // Logout using Supabase Auth
  const logout = useCallback(async () => {
    if (isSupabaseEnabled()) {
      await signOutSupabase()
    }
    clearAuth()
  }, [])

  // Clear authentication
  const clearAuth = () => {
    setAccessToken(null)
    setRefreshToken(null)
    setCustomer(null)
    setIsAuthenticated(false)
  }

  // Refresh access token using Supabase Auth
  const refreshAccessTokenInternal = async () => {
    if (!isSupabaseEnabled()) return null

    try {
      const response = await fetch(`${apiUrl}/api/auth/supabase/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: refreshToken })
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()

      const newAccessToken = data.accessToken || data.access_token
      const newRefreshToken = data.refreshToken || data.refresh_token

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
  const signInWithGoogle = async (returnTo = null) => {
    if (!isSupabaseEnabled()) {
      return {
        success: false,
        error: 'Supabase is not configured'
      }
    }

    try {
      if (returnTo) {
        sessionStorage.setItem('authReturnTo', JSON.stringify(returnTo))
      }
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
