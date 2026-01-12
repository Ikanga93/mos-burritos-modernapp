import axios from 'axios'
import { getSupabaseSession, isSupabaseEnabled } from '../supabaseClient'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const isProduction = import.meta.env.VITE_ENVIRONMENT === 'production'

/**
 * Create Axios client for customer authentication
 */
export const createCustomerClient = () => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Request interceptor - add access token (environment-aware)
  client.interceptors.request.use(
    async (config) => {
      let token = null
      
      if (isProduction && isSupabaseEnabled()) {
        // Production: Use Supabase session token
        const session = await getSupabaseSession()
        if (session?.access_token) {
          token = session.access_token
        }
      } else {
        // Development: Use JWT from localStorage
        token = localStorage.getItem('customerAccessToken')
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // Response interceptor - handle 401 errors (token expired)
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      // If 401 and we haven't already tried to refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          const refreshToken = localStorage.getItem('customerRefreshToken')

          if (!refreshToken) {
            // No refresh token, logout
            localStorage.removeItem('customerAccessToken')
            localStorage.removeItem('customerRefreshToken')
            window.location.href = '/login'
            return Promise.reject(error)
          }

          // Try to refresh the token
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken: refreshToken
          })

          const { accessToken } = response.data

          // Store new access token
          localStorage.setItem('customerAccessToken', accessToken)

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return client(originalRequest)
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.removeItem('customerAccessToken')
          localStorage.removeItem('customerRefreshToken')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }

      return Promise.reject(error)
    }
  )

  return client
}

/**
 * Create Axios client for admin authentication
 */
export const createAdminClient = () => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Request interceptor - add access token (environment-aware)
  client.interceptors.request.use(
    async (config) => {
      let token = null
      
      if (isProduction && isSupabaseEnabled()) {
        // Production: Use Supabase session token
        const session = await getSupabaseSession()
        if (session?.access_token) {
          token = session.access_token
        }
      } else {
        // Development: Use JWT from localStorage
        token = localStorage.getItem('adminAccessToken')
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // Response interceptor - handle 401 errors (token expired)
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      // If 401 and we haven't already tried to refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          const refreshToken = localStorage.getItem('adminRefreshToken')

          if (!refreshToken) {
            // No refresh token, logout
            localStorage.removeItem('adminAccessToken')
            localStorage.removeItem('adminRefreshToken')
            window.location.href = '/admin/login'
            return Promise.reject(error)
          }

          // Try to refresh the token
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken: refreshToken
          })

          const { accessToken } = response.data

          // Store new access token
          localStorage.setItem('adminAccessToken', accessToken)

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return client(originalRequest)
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.removeItem('adminAccessToken')
          localStorage.removeItem('adminRefreshToken')
          window.location.href = '/admin/login'
          return Promise.reject(refreshError)
        }
      }

      return Promise.reject(error)
    }
  )

  return client
}

/**
 * Create a public Axios client (no authentication)
 */
export const createPublicClient = () => {
  return axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// Export singleton instances
export const customerClient = createCustomerClient()
export const adminClient = createAdminClient()
export const publicClient = createPublicClient()

export default {
  customerClient,
  adminClient,
  publicClient,
  createCustomerClient,
  createAdminClient,
  createPublicClient
}
