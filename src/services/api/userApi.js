import { adminClient, customerClient } from './apiClient'

export const userApi = {
  // === ADMIN ENDPOINTS ===

  /**
   * Get all users (admin/owner only)
   */
  getAllUsers: async (filters = {}) => {
    const response = await adminClient.get('/users', {
      params: filters
    })
    return response.data
  },

  /**
   * Get a single user by ID (admin)
   */
  getUser: async (userId) => {
    const response = await adminClient.get(`/users/${userId}`)
    return response.data
  },

  /**
   * Create a new user (admin/owner only)
   */
  createUser: async (userData) => {
    const response = await adminClient.post('/users', userData)
    return response.data
  },

  /**
   * Update a user (admin/owner only)
   */
  updateUser: async (userId, userData) => {
    const response = await adminClient.put(`/users/${userId}`, userData)
    return response.data
  },

  /**
   * Delete a user (admin/owner only)
   */
  deleteUser: async (userId) => {
    const response = await adminClient.delete(`/users/${userId}`)
    return response.data
  },

  /**
   * Get user's assigned locations (admin)
   */
  getUserLocations: async (userId) => {
    const response = await adminClient.get(`/users/${userId}/locations`)
    return response.data
  },

  /**
   * Assign user to a location (admin/owner only)
   */
  assignLocation: async (userId, locationId, role = 'staff') => {
    const response = await adminClient.post('/users/assign-location', {
      user_id: userId,
      location_id: locationId,
      role
    })
    return response.data
  },

  /**
   * Unassign user from a location (admin/owner only)
   */
  unassignLocation: async (userId, locationId) => {
    const response = await adminClient.delete(`/users/unassign/${userId}/${locationId}`)
    return response.data
  },

  /**
   * Get all customers (admin)
   */
  getCustomers: async () => {
    const response = await adminClient.get('/admin/customers')
    return response.data
  },

  /**
   * Delete a customer (admin/owner only)
   */
  deleteCustomer: async (customerId) => {
    const response = await adminClient.delete(`/admin/customers/${customerId}`)
    return response.data
  },

  // === CUSTOMER ENDPOINTS ===

  /**
   * Update customer profile
   */
  updateProfile: async (profileData) => {
    const response = await customerClient.put('/users/profile', profileData)
    return response.data
  },

  /**
   * Update customer password
   */
  updatePassword: async (currentPassword, newPassword) => {
    const response = await customerClient.put('/users/password', {
      current_password: currentPassword,
      new_password: newPassword
    })
    return response.data
  },

  /**
   * Delete customer account
   */
  deleteAccount: async () => {
    const response = await customerClient.delete('/users/account')
    return response.data
  }
}

export default userApi
