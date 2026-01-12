import React, { useEffect } from 'react'
import { MapPin, Truck, Home, AlertCircle } from 'lucide-react'
import { useLocation } from '../../contexts/LocationContext'
import { useCart } from '../../contexts/CartContext'
import { useToast } from '../../contexts/ToastContext'
import './LocationSelector.css'

const LocationSelector = ({ onLocationChange }) => {
  const { locations, selectedLocation, setLocation, isLoading } = useLocation()
  const { locationId: cartLocationId, itemCount, validateLocation } = useCart()
  const { showToast } = useToast()

  useEffect(() => {
    // Auto-select first location if none selected
    if (!selectedLocation && locations.length > 0 && !cartLocationId) {
      setLocation(locations[0].id)
    }
    // If cart has a location, make sure that's selected
    else if (cartLocationId && (!selectedLocation || selectedLocation.id !== cartLocationId)) {
      setLocation(cartLocationId)
    }
  }, [locations, selectedLocation, cartLocationId, setLocation])

  const handleLocationSelect = (location) => {
    // Check if changing location with items in cart
    if (itemCount > 0 && cartLocationId && cartLocationId !== location.id) {
      const validation = validateLocation(location.id)

      if (!validation.valid) {
        showToast(
          'Your cart contains items from a different location. Please clear your cart first.',
          'warning'
        )
        return
      }
    }

    setLocation(location.id)

    if (onLocationChange) {
      onLocationChange(location)
    }

    showToast(`Location changed to ${location.name}`, 'success')
  }

  if (isLoading) {
    return (
      <div className="location-selector loading">
        <div className="location-selector-spinner"></div>
        <span>Loading locations...</span>
      </div>
    )
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="location-selector empty">
        <AlertCircle size={20} />
        <span>No locations available</span>
      </div>
    )
  }

  const getLocationIcon = (type) => {
    switch (type) {
      case 'restaurant':
        return <Home size={18} />
      case 'mobile':
      case 'foodtruck':
        return <Truck size={18} />
      default:
        return <MapPin size={18} />
    }
  }

  return (
    <div className="location-selector">
      <div className="location-selector-header">
        <MapPin size={20} />
        <h3>Select Location</h3>
      </div>

      <div className="location-grid">
        {locations.map((location) => {
          const isSelected = selectedLocation?.id === location.id
          const isCartLocation = cartLocationId === location.id
          const hasCartConflict = itemCount > 0 && cartLocationId && cartLocationId !== location.id

          return (
            <button
              key={location.id}
              className={`location-card ${isSelected ? 'selected' : ''} ${hasCartConflict ? 'disabled' : ''}`}
              onClick={() => handleLocationSelect(location)}
              disabled={hasCartConflict}
            >
              <div className="location-card-icon">
                {getLocationIcon(location.type)}
              </div>

              <div className="location-card-content">
                <h4>{location.name}</h4>
                <p className="location-address">
                  <MapPin size={14} />
                  {location.address}
                </p>
                {location.type && (
                  <span className="location-type-badge">
                    {location.type === 'restaurant' ? 'Restaurant' : 'Food Truck'}
                  </span>
                )}
              </div>

              {isCartLocation && itemCount > 0 && (
                <div className="cart-indicator">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
                </div>
              )}

              {isSelected && (
                <div className="selected-indicator">
                  ✓
                </div>
              )}
            </button>
          )
        })}
      </div>

      {itemCount > 0 && cartLocationId && (
        <div className="location-cart-notice">
          <AlertCircle size={16} />
          You have {itemCount} item{itemCount !== 1 ? 's' : ''} from{' '}
          {locations.find(l => l.id === cartLocationId)?.name}. Clear your cart to order from another location.
        </div>
      )}
    </div>
  )
}

export default LocationSelector
