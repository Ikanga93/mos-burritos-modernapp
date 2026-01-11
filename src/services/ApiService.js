import API_BASE_URL from '../config/api.js'

export class ApiService {
  static BASE_URL = `${API_BASE_URL}/api`

  // ==================== Location Services ====================

  /**
   * Get all scheduled locations (restaurants and food trucks)
   */
  static async getLocations() {
    const response = await fetch(`${this.BASE_URL}/locations`)
    if (!response.ok) {
      throw new Error('Failed to fetch locations')
    }
    return response.json()
  }

  /**
   * Get live/real-time food truck locations
   */
  static async getLiveLocations() {
    const response = await fetch(`${this.BASE_URL}/live-locations`)
    if (!response.ok) {
      throw new Error('Failed to fetch live locations')
    }
    return response.json()
  }
}

export default ApiService
