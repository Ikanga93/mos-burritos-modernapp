import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import './ConnectionStatus.css'

const ConnectionStatus = ({ isConnected }) => {
  const [visible, setVisible] = useState(true)
  const [status, setStatus] = useState('disconnected')

  useEffect(() => {
    // Determine status from isConnected prop
    if (isConnected === true) {
      setStatus('connected')
      // Auto-hide after 3 seconds when connected
      const timer = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(timer)
    } else if (isConnected === false) {
      setStatus('disconnected')
      setVisible(true) // Always show when disconnected
    } else {
      setStatus('reconnecting')
      setVisible(true) // Always show when reconnecting
    }
  }, [isConnected])

  // Don't render if not visible
  if (!visible && status === 'connected') {
    return null
  }

  const statusConfig = {
    connected: {
      icon: Wifi,
      label: 'Connected',
      color: '#28a745',
      bgColor: '#d4edda'
    },
    disconnected: {
      icon: WifiOff,
      label: 'Disconnected',
      color: '#dc3545',
      bgColor: '#f8d7da'
    },
    reconnecting: {
      icon: RefreshCw,
      label: 'Reconnecting...',
      color: '#ffc107',
      bgColor: '#fff3cd'
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={`connection-status connection-status-${status}`}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.color
      }}
    >
      <Icon
        size={16}
        color={config.color}
        className={status === 'reconnecting' ? 'spin' : ''}
      />
      <span style={{ color: config.color }}>{config.label}</span>
    </div>
  )
}

export default ConnectionStatus
