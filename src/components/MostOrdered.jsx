import React from 'react'
import { Star } from 'lucide-react'
import './MostOrdered.css'

const MostOrdered = () => {
  const mostOrderedItems = [
    {
      id: 1,
      name: "Pupusas Plate",
      description: "3 corn Salvadoran tortillas filled with cheese, revueltas, or chicken. Served with curtido and homemade salsa.",
      image: "/images/most-ordered-images/pupusas-plate.avif",
      rating: "100%"
    },
    {
      id: 2,
      name: "Quesabirria",
      description: "Corn tortillas grilled with cheese and birria with a side of birria sauce, cilantro, onions, radish and rice.",
      image: "/images/most-ordered-images/quesabirria.avif",
      rating: "95%"
    },
    {
      id: 3,
      name: "Nachos",
      description: "Homemade nachos topped with cheese sauce, your choice of meat, beans, lettuce, tomatoes, onions, jalapeños, cilantro, and sour cream.",
      image: "/images/most-ordered-images/nachos.avif",
      rating: "90%"
    },
    {
      id: 4,
      name: "Steak Fries",
      description: "Crispy fries topped with succulent steak pieces, cheese, and signature sauce.",
      image: "/images/most-ordered-images/steak-fries.avif",
      rating: "88%"
    },
    {
      id: 5,
      name: "Guacamole",
      description: "8 oz cup of fresh, creamy avocado dip, seasoned with lime, salt, onion, tomato and cilantro with tortilla chips.",
      image: "/images/most-ordered-images/guacamole.avif",
      rating: "85%"
    },
    {
      id: 6,
      name: "Elote",
      description: "8 oz of delicious prepared corn, topped with mayonnaise, cotija cheese, and a sprinkle of chili seasoning.",
      image: "/images/most-ordered-images/elote.avif",
      rating: "81%"
    },
    {
      id: 7,
      name: "Burrito Dinner",
      description: "Large flour tortilla filled with your choice of meat, rice, beans, cheese, lettuce, and sour cream. Served with sides.",
      image: "/images/most-ordered-images/burrito-dinner.avif",
      rating: "Popular"
    },
    {
      id: 8,
      name: "Burrito",
      description: "Large flour tortilla filled with your choice of meat, rice, beans, cheese, lettuce, tomato, onion, cilantro, and sour cream.",
      image: "/images/most-ordered-images/burrito.avif",
      rating: "Popular"
    },
    {
      id: 9,
      name: "Taco Dinner",
      description: "3 tacos with your choice of meat on corn or flour tortillas, topped with cilantro, onions, and lime. Served with rice and beans.",
      image: "/images/most-ordered-images/taco-dinner.avif",
      rating: "Popular"
    },
    {
      id: 10,
      name: "Cheese Dip",
      description: "Warm, creamy cheese dip served with crispy tortilla chips. Perfect for sharing!",
      image: "/images/most-ordered-images/cheese-dip.avif",
      rating: "Popular"
    }
  ]

  return (
    <section className="most-ordered-section">
      <div className="container">
        <h2 className="section-title">Most Ordered</h2>
        <p className="section-subtitle">
          Our customers' favorites - these dishes keep bringing people back for more
        </p>

        <div className="most-ordered-scroll-container">
          <div className="most-ordered-scroll">
            {mostOrderedItems.map((item) => (
              <div key={item.id} className="most-ordered-item">
                <div className="most-ordered-image-wrapper">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="most-ordered-image"
                  />
                  <div className="most-ordered-rating">
                    <Star size={14} fill="currentColor" />
                    <span>{item.rating}</span>
                  </div>
                </div>
                <h3 className="most-ordered-name">{item.name}</h3>
                <p className="most-ordered-description">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MostOrdered
