import { publicClient, adminClient } from './apiClient'

export const locationApi = {
  /**
   * Get all active locations (public)
   */
  getLocations: async () => {
    const response = await publicClient.get('/locations')
    return response.data
  },

  /**
   * Get a single location by ID (public)
   */
  getLocation: async (locationId) => {
    const response = await publicClient.get(`/locations/${locationId}`)
    return response.data
  },

  /**
   * Get live food truck locations (public)
   */
  getLiveLocations: async () => {
    const response = await publicClient.get('/live-locations')
    return response.data
  },

  /**
   * Update live food truck location (admin)
   */
  updateLiveLocation: async (locationId, latitude, longitude, address) => {
    const response = await adminClient.patch(`/live-locations/${locationId}`, {
      latitude,
      longitude,
      current_address: address
    })
    return response.data
  },

  // === ADMIN ONLY ENDPOINTS ===

  /**
   * Get all locations including inactive (admin)
   */
  getAllLocations: async (activeOnly = true) => {
    const response = await adminClient.get('/locations', {
      params: { active_only: activeOnly }
    })
    return response.data
  },

  /**
   * Create a new location (admin)
   */
  createLocation: async (locationData) => {
    const response = await adminClient.post('/locations', locationData)
    return response.data
  },

  /**
   * Update a location (admin)
   */
  updateLocation: async (locationId, locationData) => {
    const response = await adminClient.put(`/locations/${locationId}`, locationData)
    return response.data
  },

  /**
   * Delete a location (admin)
   */
  deleteLocation: async (locationId) => {
    const response = await adminClient.delete(`/locations/${locationId}`)
    return response.data
  },

  /**
   * Get staff assigned to a location (admin)
   */
  getLocationStaff: async (locationId) => {
    const response = await adminClient.get(`/locations/${locationId}/staff`)
    return response.data
  },

  /**
   * Get location hours (public)
   */
  getLocationHours: async (locationId) => {
    const response = await publicClient.get(`/locations/${locationId}/hours`)
    return response.data
  },

  /**
   * Update location hours (admin)
   */
  updateLocationHours: async (locationId, hours) => {
    const response = await adminClient.put(`/locations/${locationId}/hours`, {
      hours
    })
    return response.data
  }
}

export default locationApi
