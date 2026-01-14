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
    <div className="location-selector-minimal">
      <div className="location-bar">
        <div className="location-icon">
          <MapPin size={18} />
        </div>
        
        <select
          className="location-dropdown"
          value={selectedLocation?.id || ''}
          onChange={(e) => {
            const location = locations.find(l => l.id === e.target.value)
            if (location) handleLocationSelect(location)
          }}
          disabled={itemCount > 0 && cartLocationId}
        >
          {!selectedLocation && <option value="">Select a location...</option>}
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {getLocationIcon(location.type) ? '🏪 ' : ''}
              {location.name}
              {location.address ? ` • ${location.address.split(',')[0]}` : ''}
            </option>
          ))}
        </select>

        {selectedLocation && (
          <div className="location-details">
            <span className="location-type">
              {selectedLocation.type === 'restaurant' ? '🏪' : '🚚'}
            </span>
          </div>
        )}
      </div>

      {itemCount > 0 && cartLocationId && (
        <div className="location-cart-badge">
          <AlertCircle size={14} />
          {itemCount} item{itemCount !== 1 ? 's' : ''} in cart
        </div>
      )}
    </div>
  )
}

export default LocationSelector
