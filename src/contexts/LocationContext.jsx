import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getApiBaseUrl } from '../utils/apiConfig'

const LocationContext = createContext(null)

export const useLocation = () => {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}

export const LocationProvider = ({ children }) => {
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocationState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load locations from API
  const loadLocations = useCallback(async () => {
    setIsLoading(true)
    try {
      const apiUrl = getApiBaseUrl()
      const response = await fetch(`${apiUrl}/api/locations`)

      if (!response.ok) {
        throw new Error('Failed to fetch locations')
      }

      const data = await response.json()
      setLocations(data.locations || data)

      // If there's a saved location ID, restore it
      const savedLocationId = localStorage.getItem('selected_location_id')
      if (savedLocationId) {
        const savedLocation = (data.locations || data).find(
          (loc) => loc.id === savedLocationId
        )
        if (savedLocation) {
          setSelectedLocationState(savedLocation)
        }
      }
    } catch (error) {
      console.error('Error loading locations:', error)
      setLocations([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initialize locations on mount
  useEffect(() => {
    loadLocations()
  }, [loadLocations])

  // Set selected location and persist to localStorage
  const setLocation = useCallback((locationId) => {
    const location = locations.find((loc) => loc.id === locationId)
    if (location) {
      setSelectedLocationState(location)
      localStorage.setItem('selected_location_id', locationId)
    }
  }, [locations])

  // Get location by ID
  const getLocationById = useCallback((id) => {
    return locations.find((loc) => loc.id === id)
  }, [locations])

  const value = {
    locations,
    selectedLocation,
    isLoading,
    setLocation,
    getLocationById,
    loadLocations
  }

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}

export default LocationProvider
