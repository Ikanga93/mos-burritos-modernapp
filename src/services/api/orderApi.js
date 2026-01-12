import { customerClient, adminClient, publicClient } from './apiClient'

export const orderApi = {
  // === CUSTOMER ENDPOINTS ===

  /**
   * Create a new order (authenticated - for logged-in customers)
   */
  createOrder: async (orderData) => {
    const response = await customerClient.post('/orders', orderData)
    return response.data
  },

  /**
   * Create a guest order (no authentication required)
   */
  createGuestOrder: async (orderData) => {
    const response = await publicClient.post('/orders', orderData)
    return response.data
  },

  /**
   * Get an order by ID (public - for tracking)
   */
  getOrder: async (orderId) => {
    const response = await publicClient.get(`/orders/${orderId}`)
    return response.data
  },

  /**
   * Get customer's orders
   */
  getCustomerOrders: async (customerId) => {
    const response = await customerClient.get(`/orders/customer/${customerId}`)
    return response.data
  },

  /**
   * Get customer's order history
   */
  getMyOrders: async () => {
    const response = await customerClient.get('/orders/my-orders')
    return response.data
  },

  // === ADMIN ENDPOINTS ===

  /**
   * Get all orders (admin - with filters)
   */
  getAllOrders: async (filters = {}) => {
    const response = await adminClient.get('/orders', {
      params: filters
    })
    return response.data
  },

  /**
   * Get orders for a specific location (admin)
   */
  getLocationOrders: async (locationId, filters = {}) => {
    const response = await adminClient.get('/orders', {
      params: {
        location_id: locationId,
        ...filters
      }
    })
    return response.data
  },

  /**
   * Update order status (admin)
   */
  updateOrderStatus: async (orderId, status, notes = null) => {
    const response = await adminClient.patch(`/orders/${orderId}/status`, {
      status,
      notes
    })
    return response.data
  },

  /**
   * Update payment status (admin)
   */
  updatePaymentStatus: async (orderId, paymentStatus) => {
    const response = await adminClient.patch(`/orders/${orderId}/payment-status`, {
      payment_status: paymentStatus
    })
    return response.data
  },

  /**
   * Get dashboard stats for a location (admin)
   */
  getDashboardStats: async (locationId) => {
    const response = await adminClient.get(`/orders/dashboard/${locationId}`)
    return response.data
  },

  /**
   * Get order analytics (admin)
   */
  getOrderAnalytics: async (locationId, startDate, endDate) => {
    const response = await adminClient.get(`/orders/analytics/${locationId}`, {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    })
    return response.data
  },

  /**
   * Cancel an order (admin or customer)
   */
  cancelOrder: async (orderId, reason) => {
    const response = await customerClient.patch(`/orders/${orderId}/cancel`, {
      reason
    })
    return response.data
  },

  /**
   * Get order receipt (admin or customer)
   */
  getOrderReceipt: async (orderId) => {
    const response = await customerClient.get(`/orders/${orderId}/receipt`)
    return response.data
  }
}

export default orderApi
