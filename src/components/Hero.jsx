import React from 'react'
import { Link } from 'react-router-dom'
import './Hero.css'

const Hero = () => {
  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <img
          src="/images/hero/mosburritosheroimage.webp"
          alt="Mo's Burritos Food"
          className="hero-bg-image"
        />
      </div>
      <div className="hero-overlay"></div>

      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              ¡Bienvenidos a <span>Mo's Burritos!</span>
            </h1>
            <p className="hero-subtitle">
              Authentic Mexican and Salvadorian cuisine crafted with passion, tradition, and the finest ingredients.
            </p>

            <div className="hero-buttons">
              <Link to="/menu" className="cta-button">
                Order Online
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero 