import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

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

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('adminAccessToken')
    const storedRefreshToken = localStorage.getItem('adminRefreshToken')
    const storedCurrentLocation = localStorage.getItem('adminCurrentLocation')

    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken)
      setRefreshToken(storedRefreshToken)

      if (storedCurrentLocation) {
        try {
          setCurrentLocation(JSON.parse(storedCurrentLocation))
        } catch (e) {
          console.error('Error parsing stored location:', e)
        }
      }

      // Fetch current user
      fetchCurrentUser(storedAccessToken)
    } else {
      setIsLoading(false)
    }
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

      // Only allow staff roles (owner, manager, staff)
      if (data.user.role === 'customer') {
        throw new Error('This account does not have admin access')
      }

      // Store tokens
      localStorage.setItem('adminAccessToken', data.accessToken)
      localStorage.setItem('adminRefreshToken', data.refreshToken)

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

  // Logout
  const logout = useCallback(() => {
    clearAuth()
  }, [])

  // Clear authentication
  const clearAuth = () => {
    localStorage.removeItem('adminAccessToken')
    localStorage.removeItem('adminRefreshToken')
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

  // Refresh access token
  const refreshAccessToken = async () => {
    const currentRefreshToken = refreshToken || localStorage.getItem('adminRefreshToken')

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
        body: JSON.stringify({ refreshToken: currentRefreshToken }) // Fixed: changed refresh_token to refreshToken to match schema
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()

      localStorage.setItem('adminAccessToken', data.accessToken) // Fixed: changed access_token to accessToken
      setAccessToken(data.accessToken) // Fixed: changed access_token to accessToken

      return data.accessToken // Fixed: changed access_token to accessToken
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
