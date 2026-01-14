import axios from 'axios'
import { getSupabaseSession, isSupabaseEnabled } from '../supabaseClient'

// In production, use same domain (empty string means relative URLs)
// In development, use localhost:8000
const getApiBaseUrl = () => {
  const viteApiUrl = import.meta.env.VITE_API_URL
  const isProduction = import.meta.env.VITE_ENVIRONMENT === 'production'

  // If explicitly set, use it (even if empty string)
  if (viteApiUrl !== undefined) {
    return viteApiUrl
  }

  // In production without explicit URL, use same domain (relative)
  if (isProduction) {
    return ''
  }

  // Development default
  return 'http://localhost:8000'
}

const API_BASE_URL = getApiBaseUrl()
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
            console.error('[Customer Auth] No refresh token available')
            // No refresh token, logout
            localStorage.removeItem('customerAccessToken')
            localStorage.removeItem('customerRefreshToken')
            window.location.href = '/login'
            return Promise.reject(error)
          }

          console.log('[Customer Auth] Attempting to refresh token...')

          // Try to refresh the token
          const response = await axios.post(`${API_BASE_URL}/api/auth/customer/refresh`, {
            refreshToken: refreshToken
          })

          const { accessToken, refreshToken: newRefreshToken } = response.data

          // Store new tokens
          localStorage.setItem('customerAccessToken', accessToken)
          if (newRefreshToken) {
            localStorage.setItem('customerRefreshToken', newRefreshToken)
          }

          console.log('[Customer Auth] Token refreshed successfully')

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return client(originalRequest)
        } catch (refreshError) {
          console.error('[Customer Auth] Token refresh failed:', refreshError)
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
        console.log(`[Admin API] Making request to ${config.url} with token: ${token.substring(0, 20)}...`)
      } else {
        console.warn(`[Admin API] No token available for request to ${config.url}`)
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
            console.error('[Admin Auth] No refresh token available')
            // No refresh token, logout
            localStorage.removeItem('adminAccessToken')
            localStorage.removeItem('adminRefreshToken')
            localStorage.removeItem('adminCurrentLocation')
            window.location.href = '/admin/login'
            return Promise.reject(error)
          }

          console.log('[Admin Auth] Attempting to refresh token...')

          // Try to refresh the token
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken: refreshToken
          })

          const { accessToken, refreshToken: newRefreshToken } = response.data

          // Store new tokens
          localStorage.setItem('adminAccessToken', accessToken)
          if (newRefreshToken) {
            localStorage.setItem('adminRefreshToken', newRefreshToken)
          }

          console.log('[Admin Auth] Token refreshed successfully')

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return client(originalRequest)
        } catch (refreshError) {
          console.error('[Admin Auth] Token refresh failed:', refreshError)
          // Refresh failed, logout
          localStorage.removeItem('adminAccessToken')
          localStorage.removeItem('adminRefreshToken')
          localStorage.removeItem('adminCurrentLocation')
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
