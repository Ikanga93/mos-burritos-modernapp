import React from 'react'
import { Link } from 'react-router-dom'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react'
import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="customer-footer">
      <div className="footer-container">
        {/* About Section */}
        <div className="footer-section">
          <h3>Mo's Burritos</h3>
          <p>
            Serving authentic and delicious burritos in Champaign-Urbana since day one.
            Fresh ingredients, bold flavors, and a passion for great food.
          </p>
          <div className="footer-social">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <Facebook size={20} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram size={20} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Twitter size={20} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/menu">Menu</Link></li>
            <li><Link to="/location">Locations</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/catering">Catering</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section">
          <h4>Contact Us</h4>
          <ul className="footer-contact">
            <li>
              <Phone size={16} />
              <a href="tel:+12175551234">(217) 555-1234</a>
            </li>
            <li>
              <Mail size={16} />
              <a href="mailto:info@mosburritos.com">info@mosburritos.com</a>
            </li>
            <li>
              <MapPin size={16} />
              <span>705 N Neil St, Champaign, IL</span>
            </li>
          </ul>
        </div>

        {/* Hours */}
        <div className="footer-section">
          <h4>Hours</h4>
          <ul className="footer-hours">
            <li>Monday - Thursday: 10am - 9pm</li>
            <li>Friday - Saturday: 10am - 10pm</li>
            <li>Sunday: 11am - 8pm</li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-container">
          <p>&copy; {currentYear} Mo's Burritos. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
