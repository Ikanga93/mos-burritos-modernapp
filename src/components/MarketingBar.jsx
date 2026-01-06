import React from 'react'
import { Smartphone } from 'lucide-react'
import './MarketingBar.css'

const MarketingBar = () => {
  const handleBufferClick = () => {
    window.open('https://buffer.com', '_blank')
  }

  return (
    <div className="marketing-bar">
      <div className="marketing-bar-content">
        <div className="marketing-bar-icon">
          <Smartphone size={24} />
        </div>
        <div className="marketing-bar-text">
          <span>Boost your social media presence and grow your business!</span>
        </div>
        <button 
          className="marketing-bar-button"
          onClick={handleBufferClick}
        >
          Get Started with Buffer
        </button>
      </div>
    </div>
  )
}

export default MarketingBar 