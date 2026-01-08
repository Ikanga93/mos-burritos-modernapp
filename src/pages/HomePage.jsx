import React, { useState, useEffect } from 'react'
import { ChefHat, Leaf, Award, Heart, User } from 'lucide-react'
import Hero from '../components/Hero'
import Contact from '../components/Contact'
import LocationMap from '../components/LocationMap'
import Statistics from '../components/Statistics'
import ApiService from '../services/ApiService'

const HomePage = () => {
  const [scheduledLocations, setScheduledLocations] = useState([])
  const [liveLocations, setLiveLocations] = useState([])

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const scheduledData = await ApiService.getLocations()
        setScheduledLocations(scheduledData.filter(location => location.status === 'active'))
      } catch (error) {
        console.warn('Scheduled locations not available:', error)
      }
    }

    const fetchLiveLocations = async () => {
      try {
        const liveData = await ApiService.getLiveLocations()
        setLiveLocations(liveData.filter(location => location.is_active))
      } catch (error) {
        console.warn('Live locations not available:', error)
      }
    }

    fetchLocations()
    fetchLiveLocations()
  }, [])

  return (
    <>
      <Hero />

      {/* Locations - Map Section */}
      <section className="map-section section">
        <div className="container">
          <h2 className="section-title">Locations</h2>
          <p className="section-subtitle">
            Visit our restaurant or catch our food trucks around town
          </p>
          <LocationMap
            locations={scheduledLocations}
            liveLocations={liveLocations}
          />
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
    </>
  )
}

export default HomePage 