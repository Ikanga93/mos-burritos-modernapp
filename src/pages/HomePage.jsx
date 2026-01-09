import React from 'react'
import { Link } from 'react-router-dom'
import { ChefHat, Leaf, Award, Heart, User, MapPin, Utensils, ShoppingBag, Truck, ArrowRight, X, Navigation, Phone, Clock } from 'lucide-react'
import Hero from '../components/Hero'
import Contact from '../components/Contact'
import Statistics from '../components/Statistics'
import MostOrdered from '../components/MostOrdered'
import { businessConfig } from '../config/businessConfig'
import './HomePage.css'

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

const HomePage = () => {
  const [showDiningModal, setShowDiningModal] = React.useState(false);

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
              <a href="/menu" className="ordering-link">
                Order Now <ArrowRight size={16} />
              </a>
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
              <a href="/menu" className="ordering-link">
                Order Delivery <ArrowRight size={16} />
              </a>
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
          <h2 className="section-title">What Our Customers Say</h2>
          <p className="section-subtitle">
            Don't just take our word for it - hear from our satisfied customers
          </p>

          <div className="reviews-container">
            <div className="reviews-scroll">
              <div className="review-card">
                <div className="review-header">
                  <div className="reviewer-avatar"><User size={32} /></div>
                  <div className="reviewer-info">
                    <strong>Cas Beadell</strong>
                    <span>Local Guide · 20 reviews</span>
                    <div className="review-time">a year ago</div>
                  </div>
                </div>
                <p>Always genuinely amazing food. Tortas are the best I've ever had. I think they pan fry the bread with cheese to get this really crispy, savory cheese layer on it. It's so good. Employees are always super nice and efficient too. Best prices in town as well. 11/10 I've brought every friend who's visited me to this truck.</p>
              </div>

              <div className="review-card">
                <div className="review-header">
                  <div className="reviewer-avatar"><User size={32} /></div>
                  <div className="reviewer-info">
                    <strong>Sarah Fogel</strong>
                    <span>Local Guide · 39 reviews · 6 photos</span>
                    <div className="review-time">2 years ago</div>
                  </div>
                </div>
                <p>Holy moly these are some good tacos. And so reasonably priced!!!! The chorizo especially was unreal, but the pastor was bomb and the asada was solid too! Will definitely come back if I'm in Champaign again.</p>
              </div>

              <div className="review-card">
                <div className="review-header">
                  <div className="reviewer-avatar"><User size={32} /></div>
                  <div className="reviewer-info">
                    <strong>No Fears Transport LLC</strong>
                    <span>7 reviews</span>
                    <div className="review-time">2 months ago</div>
                  </div>
                </div>
                <p>Great food and always prepared to order. I've been eating here for 10+ years!</p>
              </div>

              <div className="review-card">
                <div className="review-header">
                  <div className="reviewer-avatar"><User size={32} /></div>
                  <div className="reviewer-info">
                    <strong>Johanna</strong>
                    <span>7 reviews · 1 photo</span>
                    <div className="review-time">a year ago</div>
                  </div>
                </div>
                <p>These are the best tacos I've tried in the US. The al pastor tacos are my favorite! And the burritos are great too. I would highly recommend Mo's Burritos!</p>
              </div>

              <div className="review-card">
                <div className="review-header">
                  <div className="reviewer-avatar"><User size={32} /></div>
                  <div className="reviewer-info">
                    <strong>Duke Yin</strong>
                    <span>Local Guide · 33 reviews · 3 photos</span>
                    <div className="review-time">a year ago</div>
                  </div>
                </div>
                <p>One of the best quick Mexican food places in Urbana Champaign. I tried almost all Mexican restaurants in this area, and usually I have tons of nachos remaining when the topping is gone. But here, the topping portion is a lot so I finish topping and nachos at the same time! I recommend avocado topping addition if you like avocado. Their tacos are amazing too. It is worth it.</p>
              </div>

              <div className="review-card">
                <div className="review-header">
                  <div className="reviewer-avatar"><User size={32} /></div>
                  <div className="reviewer-info">
                    <strong>Cathy Smith</strong>
                    <span>Local Guide · 140 reviews · 1,824 photos</span>
                    <div className="review-time">4 months ago</div>
                  </div>
                </div>
                <p>Food always Good. Truck was at Circle K on Mattis and Sangamon Dr.</p>
              </div>

              <div className="review-card">
                <div className="review-header">
                  <div className="reviewer-avatar"><User size={32} /></div>
                  <div className="reviewer-info">
                    <strong>HyeonR</strong>
                    <span>8 reviews · 4 photos</span>
                    <div className="review-time">2 years ago</div>
                  </div>
                </div>
                <p>As someone who grew up in Mexico, I have to say these are the best tacos in Champaign. They taste as good as any street taco you can get in Mexico. Also, the staff always greets you with a smile and makes you feel like a valued customer. Can't recommend this place enough.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <Statistics />

      {/* Why Choose Mo's Burritos Section */}
      <section className="why-choose-us">
        <div className="container">
          <h2 className="section-title">Why Choose Mo's Burritos?</h2>
          <p className="section-subtitle">
            Experience the authentic flavors of Mexico and El Salvador in every bite
          </p>

          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon"><ChefHat size={48} strokeWidth={1.5} /></div>
              <h3>Family Recipes</h3>
              <p>Passed down through three generations of Mexican cooking tradition, our recipes are authentic and time-tested.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon"><Leaf size={48} strokeWidth={1.5} /></div>
              <h3>Fresh Ingredients</h3>
              <p>We source the freshest local ingredients and authentic Mexican spices to ensure every bite is perfect.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon"><Award size={48} strokeWidth={1.5} /></div>
              <h3>Award Winning</h3>
              <p>Recognized by the local community for outstanding food quality and exceptional customer service.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon"><Heart size={48} strokeWidth={1.5} /></div>
              <h3>Made with Love</h3>
              <p>Every dish is prepared with passion and care, bringing you the true taste of Mexico with every meal.</p>
            </div>
          </div>
        </div>
      </section>

      <Contact />

      {/* Dining Modal */}
      {showDiningModal && <DiningLocationsModal onClose={() => setShowDiningModal(false)} />}
    </>
  )
}

export default HomePage 