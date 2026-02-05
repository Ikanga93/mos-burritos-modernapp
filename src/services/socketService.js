/**
 * Mo's Burritos - Socket.IO Client Service
 * Manages WebSocket connections for real-time order updates
 */
import { io } from 'socket.io-client'

// Get Socket.IO server URL from environment or default to API URL
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class SocketService {
  constructor() {
    this.socket = null
    this.connectionStatus = 'disconnected' // 'connected' | 'disconnected' | 'reconnecting'
    this.statusCallbacks = []
  }

  /**
   * Connect to Socket.IO server
   */
  connect() {
    if (this.socket?.connected) {
      console.log('Socket already connected')
      return this.socket
    }

    console.log('Connecting to Socket.IO server:', SOCKET_URL)

    this.socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling'], // Fallback to polling if WS fails
    })

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('Socket.IO connected:', this.socket.id)
      this.updateConnectionStatus('connected')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason)
      this.updateConnectionStatus('disconnected')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error)
      this.updateConnectionStatus('reconnecting')
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket.IO reconnected after', attemptNumber, 'attempts')
      this.updateConnectionStatus('connected')
    })

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket.IO reconnection attempt:', attemptNumber)
      this.updateConnectionStatus('reconnecting')
    })

    this.socket.on('reconnect_failed', () => {
      console.error('Socket.IO reconnection failed')
      this.updateConnectionStatus('disconnected')
    })

    return this.socket
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.updateConnectionStatus('disconnected')
    }
  }

  /**
   * Update connection status and notify callbacks
   */
  updateConnectionStatus(status) {
    this.connectionStatus = status
    this.statusCallbacks.forEach(callback => callback(status))
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(callback) {
    this.statusCallbacks.push(callback)
    // Immediately call with current status
    callback(this.connectionStatus)
  }

  /**
   * Unsubscribe from connection status changes
   */
  offStatusChange(callback) {
    this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback)
  }

  /**
   * Get current connection status
   */
  getConnectionStatus() {
    return this.connectionStatus
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return this.socket?.connected || false
  }

  /**
   * Join order room to receive updates for specific order
   */
  joinOrderRoom(orderId) {
    if (!this.socket) {
      console.warn('Cannot join order room: socket not connected')
      return
    }

    console.log('Joining order room:', orderId)
    this.socket.emit('join_order_room', { order_id: orderId })
  }

  /**
   * Leave order room
   */
  leaveOrderRoom(orderId) {
    if (!this.socket) return

    console.log('Leaving order room:', orderId)
    this.socket.emit('leave_order_room', { order_id: orderId })
  }

  /**
   * Join kitchen room to receive new order notifications
   */
  joinKitchenRoom(locationId) {
    if (!this.socket) {
      console.warn('Cannot join kitchen room: socket not connected')
      return
    }

    console.log('Joining kitchen room:', locationId)
    this.socket.emit('join_kitchen_room', { location_id: locationId })
  }

  /**
   * Leave kitchen room
   */
  leaveKitchenRoom(locationId) {
    if (!this.socket) return

    console.log('Leaving kitchen room:', locationId)
    this.socket.emit('leave_kitchen_room', { location_id: locationId })
  }

  /**
   * Subscribe to order status updates
   */
  onOrderStatusUpdate(callback) {
    if (!this.socket) {
      console.warn('Cannot listen for order updates: socket not connected')
      return
    }

    this.socket.on('order_status_updated', callback)
  }

  /**
   * Unsubscribe from order status updates
   */
  offOrderStatusUpdate(callback) {
    if (!this.socket) return
    this.socket.off('order_status_updated', callback)
  }

  /**
   * Subscribe to new order events (for kitchen)
   */
  onNewOrder(callback) {
    if (!this.socket) {
      console.warn('Cannot listen for new orders: socket not connected')
      return
    }

    this.socket.on('new_order_created', callback)
  }

  /**
   * Unsubscribe from new order events
   */
  offNewOrder(callback) {
    if (!this.socket) return
    this.socket.off('new_order_created', callback)
  }
}

// Export singleton instance
const socketService = new SocketService()
export default socketService
