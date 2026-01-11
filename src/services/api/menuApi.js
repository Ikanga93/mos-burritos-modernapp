import { publicClient, adminClient } from './apiClient'

export const menuApi = {
  /**
   * Get full menu for a location (public)
   */
  getLocationMenu: async (locationId) => {
    const response = await publicClient.get(`/menu/location/${locationId}`)
    return response.data
  },

  /**
   * Get menu items for a location
   */
  getMenuItems: async (locationId, availableOnly = true) => {
    const response = await publicClient.get(`/menu/items/${locationId}`, {
      params: { available_only: availableOnly }
    })
    return response.data
  },

  /**
   * Get categories for a location
   */
  getCategories: async (locationId) => {
    const response = await publicClient.get(`/menu/categories/${locationId}`)
    return response.data
  },

  /**
   * Get a single menu item by ID
   */
  getMenuItem: async (itemId) => {
    const response = await publicClient.get(`/menu/items/item/${itemId}`)
    return response.data
  },

  // === ADMIN ONLY ENDPOINTS ===

  /**
   * Create a new menu item (admin)
   */
  createMenuItem: async (itemData) => {
    const response = await adminClient.post('/menu/items', itemData)
    return response.data
  },

  /**
   * Update a menu item (admin)
   */
  updateMenuItem: async (itemId, itemData) => {
    const response = await adminClient.put(`/menu/items/${itemId}`, itemData)
    return response.data
  },

  /**
   * Delete a menu item (admin)
   */
  deleteMenuItem: async (itemId) => {
    const response = await adminClient.delete(`/menu/items/${itemId}`)
    return response.data
  },

  /**
   * Toggle menu item availability (admin)
   */
  toggleItemAvailability: async (itemId) => {
    const response = await adminClient.patch(`/menu/items/${itemId}/toggle`)
    return response.data
  },

  /**
   * Create a new category (admin)
   */
  createCategory: async (categoryData) => {
    const response = await adminClient.post('/menu/categories', categoryData)
    return response.data
  },

  /**
   * Update a category (admin)
   */
  updateCategory: async (categoryId, categoryData) => {
    const response = await adminClient.put(`/menu/categories/${categoryId}`, categoryData)
    return response.data
  },

  /**
   * Delete a category (admin)
   */
  deleteCategory: async (categoryId) => {
    const response = await adminClient.delete(`/menu/categories/${categoryId}`)
    return response.data
  },

  /**
   * Reorder menu items within a category (admin)
   */
  reorderItems: async (categoryId, itemOrders) => {
    const response = await adminClient.post(`/menu/categories/${categoryId}/reorder`, {
      item_orders: itemOrders
    })
    return response.data
  },

  /**
   * Upload image for menu item (admin)
   */
  uploadMenuImage: async (itemId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await adminClient.post(`/menu/items/${itemId}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  /**
   * Get option groups for a menu item (public)
   */
  getItemOptionGroups: async (itemId) => {
    const response = await publicClient.get(`/menu/items/${itemId}/option-groups`)
    return response.data
  },

  /**
   * Create option group for menu item (admin)
   */
  createOptionGroup: async (itemId, groupData) => {
    const response = await adminClient.post(`/menu/items/${itemId}/option-groups`, groupData)
    return response.data
  },

  /**
   * Update option group (admin)
   */
  updateOptionGroup: async (groupId, groupData) => {
    const response = await adminClient.put(`/menu/option-groups/${groupId}`, groupData)
    return response.data
  },

  /**
   * Delete option group (admin)
   */
  deleteOptionGroup: async (groupId) => {
    const response = await adminClient.delete(`/menu/option-groups/${groupId}`)
    return response.data
  },

  /**
   * Add option to option group (admin)
   */
  createOption: async (groupId, optionData) => {
    const response = await adminClient.post(`/menu/option-groups/${groupId}/options`, optionData)
    return response.data
  },

  /**
   * Delete option (admin)
   */
  deleteOption: async (optionId) => {
    const response = await adminClient.delete(`/menu/options/${optionId}`)
    return response.data
  }
}

export default menuApi
