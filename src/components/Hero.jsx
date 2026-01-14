import React from 'react'
import { Link } from 'react-router-dom'
import './Hero.css'

const Hero = () => {
  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <img
          src="/images/hero/hero2.JPG"
          alt="Bobo's Barbecue Food"
          className="hero-bg-image"
        />
      </div>
      <div className="hero-overlay"></div>

      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Now Open: <span>Bobo's Barbecue!</span>
            </h1>
            <p className="hero-subtitle">
              Our new full-service restaurant is now open! Enjoy breakfast, lunch, dinner & late night eats with margaritas, craft cocktails, and your favorite barbecue specialties. Open daily from 7 AM until late!
            </p>

            <div className="hero-buttons">
              <Link to="/menu" className="cta-button">
                View Menu
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero 