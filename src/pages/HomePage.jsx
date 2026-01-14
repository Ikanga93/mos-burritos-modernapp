import React from 'react'
import { Link } from 'react-router-dom'
import { User, MapPin, Utensils, ShoppingBag, Truck, ArrowRight, X, Navigation, Phone, Clock } from 'lucide-react'
import Hero from '../components/Hero'
import MostOrdered from '../components/MostOrdered'
import WhyChooseUs from '../components/WhyChooseUs'
import { businessConfig } from '../config/businessConfig'
import './HomePage.css'
import '../components/Testimonials.css'

const DiningLocationsModal = ({ onClose }) => {
  // Show only the two main physical restaurant locations (ID 1 and 7) as requested
  // ID 1: 705 N Neil St
  // ID 7: 723 S Neil St
  const restaurants = businessConfig.locations.filter(
    loc => (loc.id === 1 || loc.id === 7) && loc.status === 'active'
  );

  return (
    <div className="dining-modal-overlay" onClick={onClose}>
      <div className="dining-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          <X size={24} />
        </button>
        <h3>Dine With Us</h3>
        <p className="modal-subtitle">Visit one of our restaurant locations</p>
        <div className="modal-location-list">
          {restaurants.map(loc => (
            <div key={loc.id} className="modal-location-item">
              <div className="modal-location-logo">
                <img src="/images/logo/burritos-logo.png" alt="Mo's Burritos" />
              </div>
              <div className="modal-location-info">
                <h4>
                  <MapPin size={16} />
                  {loc.name}
                </h4>
                <p>
                  <span style={{ width: '16px' }}></span>
                  {loc.address}
                </p>
                <div className="modal-location-hours">
                  <Clock size={14} />
                  <span className="hours-label">Open:</span> {loc.hours}
                </div>
              </div>
              <div className="modal-actions-group">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${loc.coordinates.lat},${loc.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-directions-btn"
                >
                  <Navigation size={16} />
                  Directions
                </a>
                <a
                  href={`tel:${loc.phone.replace(/\D/g, '')}`}
                  className="modal-call-btn"
                >
                  <Phone size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PickupLocationsModal = ({ onClose }) => {
  // Show all active locations (restaurants and food trucks)
  const allLocations = businessConfig.locations.filter(loc => loc.status === 'active');

  return (
    <div className="dining-modal-overlay" onClick={onClose}>
      <div className="dining-modal-content pickup-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          <X size={24} />
        </button>
        <h3>Pick Up Locations</h3>
        <p className="modal-subtitle">Order online from any of our locations</p>
        <div className="modal-location-list">
          {allLocations.map(loc => (
            <div key={loc.id} className="modal-location-item">
              <div className="modal-location-logo">
                <img src="/images/logo/burritos-logo.png" alt="Mo's Burritos" />
              </div>
              <div className="modal-location-info">
                <h4>
                  <MapPin size={16} />
                  {loc.name}
                  {loc.type === 'mobile' && <span className="location-badge">Food Truck</span>}
                </h4>
                <p>
                  <span style={{ width: '16px' }}></span>
                  {loc.address}
                </p>
                <div className="modal-location-hours">
                  <Clock size={14} />
                  <span className="hours-label">Open:</span> {loc.hours}
                </div>
              </div>
              <div className="modal-actions-group">
                <a
                  href={`tel:${loc.phone.replace(/\D/g, '')}`}
                  className="modal-order-btn"
                >
                  <Phone size={16} />
                  Call to Order
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${loc.coordinates.lat},${loc.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-directions-btn"
                >
                  <Navigation size={16} />
                  Directions
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DeliveryModal = ({ onClose }) => {
  const deliveryPlatforms = [
    {
      name: 'DoorDash',
      url: "https://www.doordash.com/store/mo's-burritos-bar-&-grill-champaign-30563328/40838749/?pickup=true",
      logo: '/images/delivery-logos/doordash-logo.png',
      backgroundColor: '#FFFFFF',
      description: 'Fast delivery from DoorDash'
    },
    {
      name: 'Grubhub',
      url: 'https://www.grubhub.com/restaurant/mos-burritos-restaurant-705-n-neil-st-champaign/1465452',
      logo: '/images/delivery-logos/grubhub-logo.png',
      backgroundColor: '#FFFFFF',
      description: 'Order on Grubhub'
    },
    {
      name: 'Uber Eats',
      url: 'https://www.ubereats.com/store/mos-burritos-restaurant/b4R-vj8SRZ-1KShbKuGvZg?srsltid=AfmBOorb3mDKCngT6x4CNix0cTn_9qzHZzDRzAbzil5EEfRxsq57MvHE',
      logo: '/images/delivery-logos/ubereats-logo.png',
      backgroundColor: '#FFFFFF',
      description: 'Delivered by Uber Eats'
    }
  ];

  return (
    <div className="dining-modal-overlay" onClick={onClose}>
      <div className="dining-modal-content delivery-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          <X size={24} />
        </button>
        <h3>Delivery Options</h3>
        <p className="modal-subtitle">Choose your preferred delivery platform</p>
        <div className="delivery-platform-list">
          {deliveryPlatforms.map(platform => (
            <a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="delivery-platform-item"
            >
              <div className="delivery-platform-icon" style={{ backgroundColor: platform.backgroundColor }}>
                <img
                  src={platform.logo}
                  alt={`${platform.name} logo`}
                  className="delivery-logo"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<span style="font-weight: 700; font-size: 0.9rem; color: #333;">${platform.name}</span>`;
                  }}
                />
              </div>
              <div className="delivery-platform-info">
                <h4>{platform.name}</h4>
                <p>{platform.description}</p>
              </div>
              <ArrowRight size={20} className="delivery-arrow" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [showDiningModal, setShowDiningModal] = React.useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = React.useState(false);

  return (
    <>
      <Hero />

      {/* Most Ordered Section */}
      <MostOrdered />

      {/* Ways to Order Section */}
      <section className="ordering-section">
        <div className="container">
          <h2 className="section-title text-center">Ways to Order</h2>
          <p className="section-subtitle text-center">
            Choose the most convenient way to enjoy our authentic flavors
          </p>

          <div className="ordering-grid">
            {/* Pick Up */}
            <div className="ordering-card card-pickup">
              <div className="ordering-icon-wrapper">
                <ShoppingBag size={36} strokeWidth={1.5} />
              </div>
              <h3>Pick Up</h3>
              <p>Order ahead and skip the line. Your food will be hot and ready when you arrive at our restaurant or food trucks.</p>
              <Link to="/menu" className="ordering-link">
                Order Now <ArrowRight size={16} />
              </Link>
            </div>

            <div className="ordering-card card-dining">
              <div className="ordering-icon-wrapper">
                <Utensils size={36} strokeWidth={1.5} />
              </div>
              <h3>Dining In</h3>
              <p>Experience our warm atmosphere and fresh food served right to your table. Perfect for family dinners and gatherings.</p>
              <button
                className="ordering-link"
                onClick={(e) => {
                  e.preventDefault();
                  setShowDiningModal(true);
                }}
              >
                Find Location <ArrowRight size={16} />
              </button>
            </div>

            {/* Food Delivery */}
            <div className="ordering-card card-delivery">
              <div className="ordering-icon-wrapper">
                <Truck size={36} strokeWidth={1.5} />
              </div>
              <h3>Food Delivery</h3>
              <p>Craving Mo's Burritos but can't make it out? We'll bring the fiesta to your doorstep with our fast delivery partners.</p>
              <button
                className="ordering-link"
                onClick={(e) => {
                  e.preventDefault();
                  setShowDeliveryModal(true);
                }}
              >
                Order Delivery <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Locations Section with Logo Background */}
      <section className="locations-section">
        <div className="container">
          <h2 className="section-title">Our Locations</h2>
          <p className="section-subtitle">
            Mo's Burritos has two restaurants and three food trucks that serve the Champaign County area and surrounding places.
          </p>
          <div className="locations-button-container">
            <Link to="/location" className="locations-cta-button">
              <MapPin size={20} />
              See Locations
            </Link>
          </div>
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="testimonials section">
        <div className="container">
          <div className="testimonials-header">
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">
              Over 500+ five-star reviews from happy customers
            </p>
            <div className="rating-summary">
              <div className="stars">★★★★★</div>
              <span className="rating-text">4.8 out of 5 stars</span>
            </div>
          </div>

          <div className="reviews-container">
            <div className="reviews-scroll">
              <div className="review-card featured">
                <div className="review-bg-image" style={{backgroundImage: 'url(/images/most-ordered-images/quesabirria.avif)'}}></div>
                <div className="review-content">
                  <div className="quote-mark">"</div>
                  <div className="stars-rating">★★★★★</div>
                  <p className="review-text">Amazing food! The tortas are the best I've ever had with crispy, savory cheese. Employees are super nice and prices are great!</p>
                  <div className="review-footer">
                    <div className="reviewer-avatar"><User size={20} /></div>
                    <div className="reviewer-info">
                      <strong>Cas Beadell</strong>
                      <span>Local Guide</span>
                    </div>
                  </div>
                  <div className="featured-badge">Top Review</div>
                </div>
              </div>

              <div className="review-card">
                <div className="review-bg-image" style={{backgroundImage: 'url(/images/most-ordered-images/taco-dinner.avif)'}}></div>
                <div className="review-content">
                  <div className="quote-mark">"</div>
                  <div className="stars-rating">★★★★★</div>
                  <p className="review-text">Incredible tacos and so reasonably priced! The chorizo is unreal, pastor is bomb!</p>
                  <div className="review-footer">
                    <div className="reviewer-avatar"><User size={20} /></div>
                    <div className="reviewer-info">
                      <strong>Sarah Fogel</strong>
                      <span>Local Guide</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="review-card">
                <div className="review-bg-image" style={{backgroundImage: 'url(/images/most-ordered-images/burrito.avif)'}}></div>
                <div className="review-content">
                  <div className="quote-mark">"</div>
                  <div className="stars-rating">★★★★★</div>
                  <p className="review-text">Best tacos I've tried in the US! The al pastor tacos are my favorite. Highly recommend!</p>
                  <div className="review-footer">
                    <div className="reviewer-avatar"><User size={20} /></div>
                    <div className="reviewer-info">
                      <strong>Johanna</strong>
                      <span>Verified Customer</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="review-card">
                <div className="review-bg-image" style={{backgroundImage: 'url(/images/most-ordered-images/taco-dinner.avif)'}}></div>
                <div className="review-content">
                  <div className="quote-mark">"</div>
                  <div className="stars-rating">★★★★★</div>
                  <p className="review-text">Growing up in Mexico, these are authentic as any street taco back home. Best in Champaign!</p>
                  <div className="review-footer">
                    <div className="reviewer-avatar"><User size={20} /></div>
                    <div className="reviewer-info">
                      <strong>HyeonR</strong>
                      <span>Verified Customer</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="review-card">
                <div className="review-bg-image" style={{backgroundImage: 'url(/images/most-ordered-images/nachos.avif)'}}></div>
                <div className="review-content">
                  <div className="quote-mark">"</div>
                  <div className="stars-rating">★★★★★</div>
                  <p className="review-text">Best quick Mexican food in town. Amazing portions and incredible tacos!</p>
                  <div className="review-footer">
                    <div className="reviewer-avatar"><User size={20} /></div>
                    <div className="reviewer-info">
                      <strong>Duke Yin</strong>
                      <span>Local Guide</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="review-card">
                <div className="review-bg-image" style={{backgroundImage: 'url(/images/most-ordered-images/burrito-dinner.avif)'}}></div>
                <div className="review-content">
                  <div className="quote-mark">"</div>
                  <div className="stars-rating">★★★★★</div>
                  <p className="review-text">Been eating here 10+ years! Consistent quality every time.</p>
                  <div className="review-footer">
                    <div className="reviewer-avatar"><User size={20} /></div>
                    <div className="reviewer-info">
                      <strong>No Fears Transport</strong>
                      <span>Loyal Customer</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Book Food Truck Section */}
      <section className="book-truck-section">
        <div className="container">
          <div className="book-truck-content">
            <div className="book-truck-image">
              <img src="/images/party-truck.JPG" alt="Mo's Burritos Food Truck" />
              <div className="truck-image-overlay"></div>
            </div>
            <div className="book-truck-info">
              <h2 className="book-truck-title">Call to Book Our Food Truck</h2>
              <p className="book-truck-subtitle">Bring the Fiesta to Your Event!</p>
              <p className="book-truck-description">
                Make your next event unforgettable with Mo's Burritos food truck! Whether it's a corporate gathering, wedding, birthday party, or community event, we bring authentic Mexican and Salvadorian flavors right to your doorstep.
              </p>
              <div className="book-truck-features">
                <div className="truck-feature">
                  <div className="truck-feature-icon">🎉</div>
                  <span>Perfect for Any Event</span>
                </div>
                <div className="truck-feature">
                  <div className="truck-feature-icon">🌮</div>
                  <span>Fresh Made-to-Order Food</span>
                </div>
                <div className="truck-feature">
                  <div className="truck-feature-icon">👥</div>
                  <span>Serves Groups of All Sizes</span>
                </div>
              </div>
              <a href="tel:+12173843600" className="book-truck-btn">
                Call Now to Book
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Mo's Burritos Section */}
      <WhyChooseUs />

      {/* Modals */}
      {showDiningModal && <DiningLocationsModal onClose={() => setShowDiningModal(false)} />}
      {showDeliveryModal && <DeliveryModal onClose={() => setShowDeliveryModal(false)} />}
    </>
  )
}

export default HomePage 