// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD
  ? window.location.origin  // Use same domain in production (if monolithic)
  : 'http://localhost:8000')  // New Python FastAPI backend runs on 8000

export const API_ENDPOINTS = {
  orders: `${API_BASE_URL}/api/orders`,
  dashboard: `${API_BASE_URL}/api/dashboard`,
  stripe: `${API_BASE_URL}/api/stripe`,
  auth: `${API_BASE_URL}/api/auth`
}

export { API_BASE_URL }
export default API_BASE_URL 