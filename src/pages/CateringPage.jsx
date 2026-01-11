import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, ArrowLeft } from 'lucide-react'
import './CateringPage.css'

const CateringPage = () => {
  const navigate = useNavigate()

  return (
    <div className="catering-page">
      <div className="catering-hero fullscreen">
        <button onClick={() => navigate(-1)} className="back-button" aria-label="Go back">
          <ArrowLeft size={24} />
          <span>Back</span>
        </button>
        <div className="hero-image-overlay">
          <img
            src="/images/Gemini_Generated_Image_4navud4navud4nav.png"
            alt="Mo's Burritos Catering"
            className="hero-image"
          />
        </div>
        <div className="container hero-content">
          <h1 className="page-title">Catering Services</h1>
          <p className="page-subtitle">
            Bring authentic Mexican flavors to your special occasion!
          </p>
          <a href="tel:+12176078131" className="cta-call-button">
            <Phone size={28} />
            <span>Call for Catering</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export default CateringPage 