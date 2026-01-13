/**
 * Get API Base URL for the application
 * - In production: uses same domain (empty string for relative URLs)
 * - In development: uses localhost:8000
 * - Can be overridden with VITE_API_URL environment variable
 */
export const getApiBaseUrl = () => {
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

export default getApiBaseUrl
