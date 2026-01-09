import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Facebook, Instagram } from 'lucide-react'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <img
                src="/images/logo/burritos-logo.png"
                alt="Mo's Burritos Logo"
                className="footer-logo-image"
              />
              <div className="footer-brand-text">
                <h3>Mo's Burritos</h3>
                <p>Authentic Mexican & Salvadorian cuisine made with love and tradition.</p>
              </div>
            </div>
            <div className="footer-social">
              <h4>Follow Us</h4>
              <div className="contact-icons">
                <a href="mailto:mosrestaurant19@gmail.com" className="contact-icon-link" title="Email us">
                  <Mail size={22} />
                </a>
                <a href="https://www.facebook.com/profile.php?id=100066724737090" target="_blank" rel="noopener noreferrer" className="contact-icon-link" title="Follow us on Facebook">
                  <Facebook size={22} />
                </a>
                <a href="https://www.instagram.com/burritosmos" target="_blank" rel="noopener noreferrer" className="contact-icon-link" title="Follow us on Instagram">
                  <Instagram size={22} />
                </a>
              </div>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/menu">Menu</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/catering">Events</Link></li>
                <li><Link to="/location">Location</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Hours</h4>
              <div className="business-hours">
                <p>Mon-Thu: 11AM-9PM</p>
                <p>Fri-Sat: 11AM-10PM</p>
                <p>Sun: 12PM-8PM</p>
              </div>
            </div>

            <div className="footer-section">
              <h4>Services</h4>
              <ul>
                <li>Dine-in</li>
                <li>Takeout</li>
                <li>In-store pickup</li>
                <li>Catering</li>
                <li>Private Events</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Mo's Burritos. Made with ❤️ by <a href="https://gekuke.com" target="_blank" rel="noopener noreferrer" className="developer-link">Gilchrist Ekuke</a></p>
        </div>
      </div>
    </footer>
  )
}

export default Footer 