import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getSupabaseSession, isSupabaseEnabled, signOutSupabase } from '../services/supabaseClient'

const AdminAuthContext = createContext(null)

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [refreshToken, setRefreshToken] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [assignedLocations, setAssignedLocations] = useState([])
  const [currentLocation, setCurrentLocation] = useState(null)
  const [role, setRole] = useState(null)

  // In production, use same domain; in development, use localhost:8000
  const getApiUrl = () => {
    const viteApiUrl = import.meta.env.VITE_API_URL
    const isProduction = import.meta.env.VITE_ENVIRONMENT === 'production'

    if (viteApiUrl !== undefined) return viteApiUrl
    if (isProduction) return ''
    return 'http://localhost:8000'
  }

  const apiUrl = getApiUrl()

  // Initialize auth state from Supabase
  useEffect(() => {
    const initAuth = async () => {
      const storedCurrentLocation = localStorage.getItem('adminCurrentLocation')

      if (isSupabaseEnabled()) {
        const session = await getSupabaseSession()
        if (session) {
          setAccessToken(session.access_token)
          setRefreshToken(session.refresh_token)

          if (storedCurrentLocation) {
            try {
              setCurrentLocation(JSON.parse(storedCurrentLocation))
            } catch (e) {
              console.error('Error parsing stored location:', e)
            }
          }

          await fetchCurrentUser(session.access_token)
        } else {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // Fetch current user info including assigned locations
  const fetchCurrentUser = async (token) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAdmin(data)
        setRole(data.role)
        setIsAuthenticated(true)

        // Fetch user's assigned locations
        if (data.role !== 'owner') {
          await fetchAssignedLocations(data.id, token)
        } else {
          // Owner has access to all locations
          await fetchAllLocations(token)
        }
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

  // Fetch assigned locations for manager/staff
  const fetchAssignedLocations = async (userId, token) => {
    try {
      const response = await fetch(`${apiUrl}/api/users/${userId}/locations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAssignedLocations(data.locations || [])

        // Set first location as current if not already set
        if (!currentLocation && data.locations && data.locations.length > 0) {
          switchLocation(data.locations[0].location_id)
        }
      }
    } catch (error) {
      console.error('Error fetching assigned locations:', error)
    }
  }

  // Fetch all locations for owner
  const fetchAllLocations = async (token) => {
    try {
      const response = await fetch(`${apiUrl}/api/locations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const locations = data.locations || data
        setAssignedLocations(
          locations.map(loc => ({
            location_id: loc.id,
            location_name: loc.name,
            role: 'owner'
          }))
        )
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  // Login using Supabase
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

      // Only allow staff roles (owner, manager, staff)
      if (data.user.role === 'customer') {
        throw new Error('This account does not have admin access')
      }

      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      setAdmin(data.user)
      setRole(data.user.role)
      setIsAuthenticated(true)
      
      // Fetch assigned locations
      if (data.user.role !== 'owner') {
        await fetchAssignedLocations(data.user.id, data.accessToken)
      } else {
        await fetchAllLocations(data.accessToken)
      }

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }

  // Logout using Supabase
  const logout = useCallback(async () => {
    if (isSupabaseEnabled()) {
      await signOutSupabase()
    }
    clearAuth()
  }, [])

  // Clear authentication
  const clearAuth = () => {
    localStorage.removeItem('adminCurrentLocation')
    setAccessToken(null)
    setRefreshToken(null)
    setAdmin(null)
    setRole(null)
    setIsAuthenticated(false)
    setAssignedLocations([])
    setCurrentLocation(null)
  }

  // Switch current location
  const switchLocation = (locationId) => {
    const location = assignedLocations.find(loc => loc.location_id === locationId)
    if (location) {
      const locationData = {
        id: location.location_id,
        name: location.location_name
      }
      setCurrentLocation(locationData)
      localStorage.setItem('adminCurrentLocation', JSON.stringify(locationData))
    }
  }

  // Check if user can access a location
  const canAccessLocation = useCallback((locationId) => {
    if (role === 'owner') return true
    return assignedLocations.some(loc => loc.location_id === locationId)
  }, [role, assignedLocations])

  // Refresh access token using Supabase
  const refreshAccessToken = async () => {
    if (!isSupabaseEnabled()) return null

    try {
      const response = await fetch(`${apiUrl}/api/auth/refresh`, {
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

      setAccessToken(data.accessToken)

      return data.accessToken
    } catch (error) {
      console.error('Token refresh error:', error)
      clearAuth()
      return null
    }
  }

  const value = {
    admin,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    role,
    assignedLocations,
    currentLocation,
    login,
    logout,
    switchLocation,
    canAccessLocation,
    refreshAccessToken
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export default AdminAuthProvider
