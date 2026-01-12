import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import MenuItemModal from './MenuItemModal'
import './MenuItemCard.css'

const MenuItemCard = ({ item, locationId }) => {
  const [showModal, setShowModal] = useState(false)

  const { getItem } = useCart()

  const cartItem = getItem(item.id)
  const inCart = !!cartItem

  const handleCardClick = () => {
    setShowModal(true)
  }

  const handleAddButtonClick = (e) => {
    e.stopPropagation() // Prevent card click
    setShowModal(true)
  }

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`
  }

  return (
    <>
      <div 
        className={`menu-item-card ${!item.is_available ? 'unavailable' : ''}`}
        onClick={item.is_available ? handleCardClick : undefined}
        style={{ cursor: item.is_available ? 'pointer' : 'default' }}
      >
        {/* Item Info - Left Side */}
        <div className="menu-item-info">
          <div>
            <h3 className="menu-item-name">{item.name}</h3>
            {item.description && (
              <p className="menu-item-description">{item.description}</p>
            )}
            </div>
          <div className="menu-item-footer">
            <span className="menu-item-price">{formatPrice(item.price)}</span>
            {inCart && (
              <span className="in-cart-badge">
                {cartItem.quantity} in cart
              </span>
            )}
          </div>
        </div>

        {/* Item Image - Right Side, Touches Top/Right/Bottom */}
        <div className="menu-item-image-container">
          {item.image_url ? (
            <div className="menu-item-image">
              <img src={item.image_url} alt={item.name} />
        </div>
      ) : (
        <div className="menu-item-image-placeholder">
          <span className="menu-item-emoji">
            {item.emoji || '🌯'}
          </span>
            </div>
          )}
          
          {/* Floating Add Button */}
          {item.is_available && (
            <button
              className="menu-item-add-btn"
              onClick={handleAddButtonClick}
              aria-label="Add to cart"
            >
              <Plus size={20} />
            </button>
          )}
          
          {!item.is_available && (
            <div className="unavailable-overlay">
              <span>Unavailable</span>
            </div>
          )}
        </div>
      </div>

      {/* Customization Modal */}
      <MenuItemModal
        item={item}
        locationId={locationId}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}

export default MenuItemCard
