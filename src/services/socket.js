// Socket.IO has been removed
// Real-time updates will be re-implemented using WebSockets with the new FastAPI backend
// For now, users will need to manually refresh to see updates

class SocketService {
  constructor() {
    this.isConnected = false
  }

  connect() {
    console.log('Socket.IO has been removed. Real-time updates disabled.')
    return null
  }

  disconnect() {
    // No-op
  }

  joinAdmin() {
    // No-op
  }

  onNewOrder(callback) {
    // No-op
  }

  onOrderUpdated(callback) {
    // No-op
  }

  joinOrderTracking(orderId) {
    // No-op
  }

  onOrderStatusUpdated(callback) {
    // No-op
  }

  removeAllListeners() {
    // No-op
  }

  removeListener(event) {
    // No-op
  }
}

export default new SocketService()
