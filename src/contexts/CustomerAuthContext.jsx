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
      console.log('[CustomerAuth] 🔄 Initializing auth...')

      if (isSupabaseEnabled()) {
        console.log('[CustomerAuth] Supabase is enabled, checking for session...')
        const session = await getSupabaseSession()

        if (session) {
          console.log('[CustomerAuth] ✅ Found existing Supabase session')
          console.log('[CustomerAuth] Session expires at:', new Date(session.expires_at * 1000).toLocaleString())
          setAccessToken(session.access_token)
          setRefreshToken(session.refresh_token)
          fetchCurrentUser(session.access_token)
        } else {
          console.log('[CustomerAuth] ❌ No existing Supabase session found')
          setIsLoading(false)
        }
      } else {
        console.log('[CustomerAuth] Supabase is not enabled')
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

        // CRITICAL FIX: Ensure Supabase session is set when fetching user on init
        if (isSupabaseEnabled() && token && refreshToken) {
          try {
            const { getSupabaseClient } = await import('../services/supabaseClient')
            const supabase = getSupabaseClient()
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: refreshToken
            })

            if (sessionError) {
              console.error('[CustomerAuth] ❌ Supabase setSession error on user fetch:', sessionError)
            } else if (sessionData?.session) {
              console.log('[CustomerAuth] ✅ Supabase session synced on user fetch')
            } else {
              console.warn('[CustomerAuth] ⚠️ setSession returned no session on user fetch')
            }
          } catch (sessionError) {
            console.error('[CustomerAuth] ❌ Failed to sync Supabase session:', sessionError)
          }
        } else if (!refreshToken) {
          console.warn('[CustomerAuth] ⚠️ Cannot sync session: refreshToken is missing')
        }
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
            await clearAuth()
          }
        } else {
          // Refresh failed, clear auth
          await clearAuth()
        }
      } else {
        // Other error, clear auth
        await clearAuth()
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      await clearAuth()
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

      // CRITICAL FIX: Set the Supabase session so the API interceptor can find the token
      if (isSupabaseEnabled()) {
        try {
          const { getSupabaseClient } = await import('../services/supabaseClient')
          const supabase = getSupabaseClient()
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: data.accessToken,
            refresh_token: data.refreshToken
          })

          if (sessionError) {
            console.error('[CustomerAuth] Supabase setSession error:', sessionError)
            throw sessionError
          }

          if (sessionData?.session) {
            console.log('[CustomerAuth] ✅ Supabase session set successfully')
            console.log('[CustomerAuth] Session expires at:', new Date(sessionData.session.expires_at * 1000).toLocaleString())
          } else {
            console.warn('[CustomerAuth] ⚠️ setSession returned no session')
          }
        } catch (sessionError) {
          console.error('[CustomerAuth] ❌ Failed to set Supabase session:', sessionError)
          // Don't fail the login, but log the issue
        }
      }

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

      // CRITICAL FIX: Set the Supabase session so the API interceptor can find the token
      if (isSupabaseEnabled()) {
        try {
          const { getSupabaseClient } = await import('../services/supabaseClient')
          const supabase = getSupabaseClient()
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: data.accessToken,
            refresh_token: data.refreshToken
          })

          if (sessionError) {
            console.error('[CustomerAuth] Supabase setSession error:', sessionError)
            throw sessionError
          }

          if (sessionData?.session) {
            console.log('[CustomerAuth] ✅ Supabase session set successfully after registration')
            console.log('[CustomerAuth] Session expires at:', new Date(sessionData.session.expires_at * 1000).toLocaleString())
          } else {
            console.warn('[CustomerAuth] ⚠️ setSession returned no session')
          }
        } catch (sessionError) {
          console.error('[CustomerAuth] ❌ Failed to set Supabase session:', sessionError)
          // Don't fail the registration, but log the issue
        }
      }

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
  const clearAuth = async () => {
    setAccessToken(null)
    setRefreshToken(null)
    setCustomer(null)
    setIsAuthenticated(false)

    // Also clear Supabase session
    if (isSupabaseEnabled()) {
      try {
        await signOutSupabase()
        console.log('[CustomerAuth] Supabase session cleared')
      } catch (error) {
        console.error('[CustomerAuth] Error clearing Supabase session:', error)
      }
    }
  }

  // Refresh access token using Supabase Auth
  const refreshAccessTokenInternal = async () => {
    if (!isSupabaseEnabled()) {
      console.log('[CustomerAuth] Supabase not enabled, cannot refresh token')
      return null
    }

    if (!refreshToken) {
      console.error('[CustomerAuth] ❌ Cannot refresh: refreshToken is null')
      await clearAuth()
      return null
    }

    console.log('[CustomerAuth] 🔄 Attempting to refresh access token...')

    try {
      const response = await fetch(`${apiUrl}/api/auth/supabase/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: refreshToken })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[CustomerAuth] Token refresh failed:', response.status, errorData)
        throw new Error('Token refresh failed')
      }

      const data = await response.json()

      const newAccessToken = data.accessToken || data.access_token
      const newRefreshToken = data.refreshToken || data.refresh_token

      if (!newAccessToken || !newRefreshToken) {
        console.error('[CustomerAuth] ❌ Refresh response missing tokens:', data)
        throw new Error('Invalid refresh response')
      }

      console.log('[CustomerAuth] ✅ Token refresh successful')

      setAccessToken(newAccessToken)
      setRefreshToken(newRefreshToken)

      // CRITICAL FIX: Update the Supabase session with the new tokens
      if (isSupabaseEnabled()) {
        try {
          const { getSupabaseClient } = await import('../services/supabaseClient')
          const supabase = getSupabaseClient()
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: newAccessToken,
            refresh_token: newRefreshToken
          })

          if (sessionError) {
            console.error('[CustomerAuth] Supabase setSession error after refresh:', sessionError)
          } else if (sessionData?.session) {
            console.log('[CustomerAuth] ✅ Supabase session updated after token refresh')
          }
        } catch (sessionError) {
          console.error('[CustomerAuth] ❌ Failed to update Supabase session:', sessionError)
        }
      }

      return newAccessToken
    } catch (error) {
      console.error('Token refresh error:', error)
      await clearAuth()
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
