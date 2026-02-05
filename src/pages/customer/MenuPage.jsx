import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, ArrowLeft } from 'lucide-react'

import Navbar from '../../components/customer/Navbar'
import LocationSelector from '../../components/customer/LocationSelector'
import MenuItemCard from '../../components/customer/MenuItemCard'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { useLocation } from '../../contexts/LocationContext'
import { useCart } from '../../contexts/CartContext'
import { useToast } from '../../contexts/ToastContext'
import { menuApi } from '../../services/api/menuApi'
import './MenuPage.css'

const MenuPage = () => {
  const navigate = useNavigate()
  const [menuData, setMenuData] = useState({ categories: [], items: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)

  const { selectedLocation } = useLocation()
  const { itemCount, setIsCartOpen } = useCart()
  const { showToast } = useToast()

  // Load menu when location changes
  useEffect(() => {
    if (selectedLocation) {
      loadMenu(selectedLocation.id)
    }
  }, [selectedLocation])

  const loadMenu = async (locationId) => {
    setIsLoading(true)
    try {
      const data = await menuApi.getLocationMenu(locationId)

      // Extract categories and flatten items from nested structure
      const categories = data.categories || []
      const allItems = categories.flatMap(category =>
        (category.items || []).map(item => ({
          ...item,
          category_id: category.id
        }))
      )

      setMenuData({
        categories: categories,
        items: allItems
      })

      // Auto-select first category
      if (categories.length > 0) {
        setSelectedCategory(categories[0].id)
      }
    } catch (error) {
      console.error('Error loading menu:', error)
      showToast('Failed to load menu. Please try again.', 'error')
      setMenuData({ categories: [], items: [] })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter items by selected category
  const filteredItems = selectedCategory
    ? menuData.items.filter(item => item.category_id === selectedCategory)
    : menuData.items

  return (
    <>
      <Navbar />

      {/* Mobile-only secondary navbar with Location and Cart */}
      <div className="menu-secondary-navbar">
        <div className="menu-secondary-navbar-content">
          <div className="menu-secondary-location">
            <LocationSelector />
          </div>
          <button
            className="menu-secondary-cart-btn"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Cart with ${itemCount} items`}
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="menu-secondary-cart-badge">{itemCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="menu-page">
        <div className="menu-header-container">
          {/* Location Selector - Hidden on mobile, shown on desktop */}
          <div className="menu-header-location-desktop">
            <LocationSelector />
          </div>
        </div>

      {/* Floating Cart Button (Mobile) */}
      {itemCount > 0 && (
        <button
          className="floating-cart-btn"
          onClick={() => setIsCartOpen(true)}
          aria-label="Open cart"
        >
          <ShoppingCart size={24} />
          <span className="cart-count">{itemCount}</span>
        </button>
      )}

      {/* Menu Content */}
      {!selectedLocation ? (
        <div className="menu-empty-state">
          <h2>Select a location to view the menu</h2>
          <p>Choose your preferred location above to start ordering</p>
        </div>
      ) : isLoading ? (
        <LoadingSpinner size="large" message="Loading menu..." />
      ) : (
        <>
          {/* Category Tabs */}
          {menuData.categories.length > 0 && (
            <div className="category-tabs">
              {menuData.categories.map((category) => (
                <button
                  key={category.id}
                  className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.emoji && <span className="category-emoji">{category.emoji}</span>}
                  {category.name}
                </button>
              ))}
            </div>
          )}

          {/* Menu Grid */}
          {filteredItems.length === 0 ? (
            <div className="menu-empty-state">
              <h3>No items available</h3>
              <p>Check back soon for delicious options!</p>
            </div>
          ) : (
            <div className="menu-grid">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  locationId={selectedLocation.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* View Cart Button (Desktop) */}
      {itemCount > 0 && (
        <div className="view-cart-section">
          <button
            className="view-cart-btn"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart size={20} />
            <span>View Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          </button>
        </div>
      )}
      </div>
    </>
  )
}

export default MenuPage
