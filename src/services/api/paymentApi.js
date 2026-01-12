import { customerClient, publicClient } from './apiClient'

export const paymentApi = {
  /**
   * Create a Stripe payment intent
   */
  createPaymentIntent: async (amount, currency = 'usd', customerInfo, items) => {
    const response = await publicClient.post('/create-payment-intent', {
      amount,
      currency,
      customerInfo: customerInfo,
      items
    })
    return response.data
  },

  /**
   * Verify payment after completion
   */
  verifyPayment: async (sessionId, orderId) => {
    const response = await publicClient.post('/verify-payment', {
      sessionId: sessionId,
      orderId: orderId
    })
    return response.data
  },

  /**
   * Get payment status for an order
   */
  getPaymentStatus: async (orderId) => {
    const response = await customerClient.get(`/payments/status/${orderId}`)
    return response.data
  },

  /**
   * Process refund (admin only - would use adminClient)
   */
  processRefund: async (orderId, amount, reason) => {
    const response = await customerClient.post(`/payments/refund/${orderId}`, {
      amount,
      reason
    })
    return response.data
  },

  /**
   * Create a Stripe Checkout Session and get redirect URL
   */
  createCheckoutSession: async (amount, currency, customerInfo, items, locationId, notes) => {
    const response = await publicClient.post('/create-checkout-session', {
      amount,
      currency,
      customerInfo: customerInfo,
      items,
      locationId: locationId,
      notes: notes || ''
    })
    return response.data
  }
}

export default paymentApi
