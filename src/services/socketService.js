/**
 * Mo's Burritos - Socket.IO Client Service
 * Manages WebSocket connections for real-time order updates
 */
import { io } from 'socket.io-client'

// Get Socket.IO server URL from environment or default to API URL
const SOCKET_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://web-production-93566.up.railway.app')

class SocketService {
  constructor() {
    this.socket = null
    this.connectionStatus = 'disconnected' // 'connected' | 'disconnected' | 'reconnecting'
    this.statusCallbacks = []
    this.activeRooms = [] // Rooms to maintain (rejoin on reconnect)
    this.connectedPromise = null
    this.eventListeners = [] // Track event listeners for reconnection
  }

  /**
   * Connect to Socket.IO server
   * Returns a promise that resolves when connected
   */
  connect() {
    if (this.socket?.connected) {
      console.log('Socket already connected')
      return Promise.resolve(this.socket)
    }

    // If already connecting, return the existing promise
    if (this.connectedPromise) {
      return this.connectedPromise
    }

    console.log('Connecting to Socket.IO server:', SOCKET_URL)

    this.connectedPromise = new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
      })

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('Socket.IO connected:', this.socket.id)
        this.updateConnectionStatus('connected')

        // Join all active rooms
        this.activeRooms.forEach(({ type, id }) => {
          if (type === 'order') {
            this._emitJoinOrderRoom(id)
          } else if (type === 'kitchen') {
            this._emitJoinKitchenRoom(id)
          }
        })

        // Attach all tracked event listeners
        this.eventListeners.forEach(({ event, callback }) => {
          console.log('Attaching listener for:', event)
          this.socket.on(event, callback)
        })

        resolve(this.socket)
      })

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason)
        this.updateConnectionStatus('disconnected')
      })

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error.message)
        this.updateConnectionStatus('reconnecting')
      })

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Socket.IO reconnected after', attemptNumber, 'attempts')
        this.updateConnectionStatus('connected')

        // Re-join all active rooms on reconnection
        this.activeRooms.forEach(({ type, id }) => {
          if (type === 'order') {
            this._emitJoinOrderRoom(id)
          } else if (type === 'kitchen') {
            this._emitJoinKitchenRoom(id)
          }
        })

        // Re-attach all event listeners on reconnection
        this.eventListeners.forEach(({ event, callback }) => {
          console.log('Re-attaching listener for:', event)
          this.socket.on(event, callback)
        })
      })

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Socket.IO reconnection attempt:', attemptNumber)
        this.updateConnectionStatus('reconnecting')
      })

      this.socket.on('reconnect_failed', () => {
        console.error('Socket.IO reconnection failed')
        this.updateConnectionStatus('disconnected')
        reject(new Error('Socket.IO reconnection failed'))
      })

      // Timeout for initial connection
      setTimeout(() => {
        if (!this.socket?.connected) {
          console.error('Socket.IO connection timeout')
        }
      }, 20000)
    })

    return this.connectedPromise
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connectedPromise = null
      this.activeRooms = []
      this.eventListeners = []
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
   * Internal method to emit join order room
   */
  _emitJoinOrderRoom(orderId) {
    console.log('Emitting join_order_room:', orderId)
    this.socket.emit('join_order_room', { order_id: orderId }, (response) => {
      if (response?.success) {
        console.log('Successfully joined order room:', response.room)
      } else {
        console.error('Failed to join order room:', response?.error)
      }
    })
  }

  /**
   * Internal method to emit join kitchen room
   */
  _emitJoinKitchenRoom(locationId) {
    console.log('Emitting join_kitchen_room:', locationId)
    this.socket.emit('join_kitchen_room', { location_id: locationId }, (response) => {
      if (response?.success) {
        console.log('Successfully joined kitchen room:', response.room)
      } else {
        console.error('Failed to join kitchen room:', response?.error)
      }
    })
  }

  /**
   * Join order room to receive updates for specific order
   */
  joinOrderRoom(orderId) {
    // Track this room for reconnection
    if (!this.activeRooms.find(r => r.type === 'order' && r.id === orderId)) {
      this.activeRooms.push({ type: 'order', id: orderId })
    }

    if (!this.socket?.connected) {
      console.log('Socket not connected yet, will join order room on connect:', orderId)
      return
    }

    this._emitJoinOrderRoom(orderId)
  }

  /**
   * Leave order room
   */
  leaveOrderRoom(orderId) {
    // Remove from active rooms
    this.activeRooms = this.activeRooms.filter(r => !(r.type === 'order' && r.id === orderId))

    if (!this.socket?.connected) return

    console.log('Leaving order room:', orderId)
    this.socket.emit('leave_order_room', { order_id: orderId })
  }

  /**
   * Join kitchen room to receive new order notifications
   */
  joinKitchenRoom(locationId) {
    // Track this room for reconnection
    if (!this.activeRooms.find(r => r.type === 'kitchen' && r.id === locationId)) {
      this.activeRooms.push({ type: 'kitchen', id: locationId })
    }

    if (!this.socket?.connected) {
      console.log('Socket not connected yet, will join kitchen room on connect:', locationId)
      return
    }

    this._emitJoinKitchenRoom(locationId)
  }

  /**
   * Leave kitchen room
   */
  leaveKitchenRoom(locationId) {
    // Remove from active rooms
    this.activeRooms = this.activeRooms.filter(r => !(r.type === 'kitchen' && r.id === locationId))

    if (!this.socket?.connected) return

    console.log('Leaving kitchen room:', locationId)
    this.socket.emit('leave_kitchen_room', { location_id: locationId })
  }

  /**
   * Subscribe to order status updates
   */
  onOrderStatusUpdate(callback) {
    // Track listener for reconnection
    const listener = { event: 'order_status_updated', callback }
    if (!this.eventListeners.find(l => l.event === listener.event && l.callback === callback)) {
      this.eventListeners.push(listener)
    }

    if (!this.socket) {
      console.log('Socket not ready yet, listener will be attached on connect')
      return
    }

    console.log('Attaching order_status_updated listener')
    this.socket.on('order_status_updated', callback)
  }

  /**
   * Unsubscribe from order status updates
   */
  offOrderStatusUpdate(callback) {
    // Remove from tracked listeners
    this.eventListeners = this.eventListeners.filter(
      l => !(l.event === 'order_status_updated' && l.callback === callback)
    )

    if (!this.socket) return
    this.socket.off('order_status_updated', callback)
  }

  /**
   * Subscribe to new order events (for kitchen)
   */
  onNewOrder(callback) {
    // Track listener for reconnection
    const listener = { event: 'new_order_created', callback }
    if (!this.eventListeners.find(l => l.event === listener.event && l.callback === callback)) {
      this.eventListeners.push(listener)
    }

    if (!this.socket) {
      console.log('Socket not ready yet, listener will be attached on connect')
      return
    }

    console.log('Attaching new_order_created listener')
    this.socket.on('new_order_created', callback)
  }

  /**
   * Unsubscribe from new order events
   */
  offNewOrder(callback) {
    // Remove from tracked listeners
    this.eventListeners = this.eventListeners.filter(
      l => !(l.event === 'new_order_created' && l.callback === callback)
    )

    if (!this.socket) return
    this.socket.off('new_order_created', callback)
  }
}

// Export singleton instance
const socketService = new SocketService()
export default socketService
