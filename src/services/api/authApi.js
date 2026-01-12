import { customerClient, adminClient, publicClient } from './apiClient'

export const authApi = {
  /**
   * Customer login
   */
  customerLogin: async (email, password) => {
    const response = await publicClient.post('/auth/login', {
      email,
      password
    })
    return response.data
  },

  /**
   * Customer registration
   */
  customerRegister: async (userData) => {
    const response = await publicClient.post('/auth/register', userData)
    return response.data
  },

  /**
   * Customer token refresh
   */
  customerRefresh: async (refreshToken) => {
    const response = await publicClient.post('/auth/refresh', {
      refresh_token: refreshToken
    })
    return response.data
  },

  /**
   * Admin login
   */
  adminLogin: async (email, password) => {
    const response = await publicClient.post('/auth/login', {
      email,
      password
    })

    // Verify user has admin role
    if (response.data.user.role === 'customer') {
      throw new Error('This account does not have admin access')
    }

    return response.data
  },

  /**
   * Admin token refresh
   */
  adminRefresh: async (refreshToken) => {
    const response = await publicClient.post('/auth/refresh', {
      refresh_token: refreshToken
    })
    return response.data
  },

  /**
   * Get current user (customer)
   */
  getCurrentCustomer: async () => {
    const response = await customerClient.get('/auth/me')
    return response.data
  },

  /**
   * Get current user (admin)
   */
  getCurrentAdmin: async () => {
    const response = await adminClient.get('/auth/me')
    return response.data
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email) => {
    const response = await publicClient.post('/auth/request-password-reset', {
      email
    })
    return response.data
  },

  /**
   * Reset password
   */
  resetPassword: async (token, newPassword) => {
    const response = await publicClient.post('/auth/reset-password', {
      token,
      new_password: newPassword
    })
    return response.data
  }
}

export default authApi
