import React from 'react'
import { Link } from 'react-router-dom'
import './Hero.css'

const Hero = () => {
  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <img
          src="/images/hero/new-location-mos-burritos.PNG"
          alt="Mo's Burritos Food"
          className="hero-bg-image"
        />
      </div>
      <div className="hero-overlay"></div>

      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Now Open: <span>Mo's Burritos Bar & Grill!</span>
            </h1>
            <p className="hero-subtitle">
              Our new full-service restaurant is now open! Enjoy breakfast, lunch, dinner & late night eats with margaritas, craft cocktails, and your favorite Salvadoran specialties. Open daily from 7 AM until late!
            </p>

            <div className="hero-buttons">
              <Link to="/menu" className="cta-button">
                View Menu
              </Link>
              <a href="tel:+12175551234" className="cta-button transparent-outline">
                Call Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero 