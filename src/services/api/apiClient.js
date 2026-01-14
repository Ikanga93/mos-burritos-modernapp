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

  // Request interceptor - add access token
  client.interceptors.request.use(
    async (config) => {
      let token = null

      if (isSupabaseEnabled()) {
        const session = await getSupabaseSession()
        if (session?.access_token) {
          token = session.access_token
        }
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
          if (isSupabaseEnabled()) {
            console.log('[Customer Auth] Session might be expired, attempting refresh via Supabase...')
            const session = await getSupabaseSession()
            if (session?.access_token) {
              originalRequest.headers.Authorization = `Bearer ${session.access_token}`
              return client(originalRequest)
            }
          }

          // If no session after refresh or Supabase not enabled
          window.location.href = '/login'
          return Promise.reject(error)
        } catch (refreshError) {
          console.error('[Customer Auth] Session refresh failed:', refreshError)
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

  // No authentication required for admin routes
  // We simply return the client without adding any auth tokens

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
