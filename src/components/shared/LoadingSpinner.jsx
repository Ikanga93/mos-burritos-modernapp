import React from 'react'
import './LoadingSpinner.css'

const LoadingSpinner = ({ size = 'medium', message = null }) => {
  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner loading-spinner-${size}`}>
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  )
}

export default LoadingSpinner
