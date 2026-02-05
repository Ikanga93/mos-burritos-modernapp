import React, { useEffect, useState, useRef } from 'react'
import { MapPin, Truck, Home, AlertCircle, ChevronDown, Check } from 'lucide-react'
import { useLocation } from '../../contexts/LocationContext'
import { useCart } from '../../contexts/CartContext'
import { useToast } from '../../contexts/ToastContext'
import './LocationSelector.css'

const LocationSelector = ({ onLocationChange }) => {
  const { locations, selectedLocation, setLocation, isLoading } = useLocation()
  const { locationId: cartLocationId, itemCount, validateLocation } = useCart()
  const { showToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    // Auto-select first location if none selected
    // Auto-select first location logic removed to force user selection
    // if (!selectedLocation && locations.length > 0 && !cartLocationId) {
    //   setLocation(locations[0].id)
    // }
    // If cart has a location, make sure that's selected
    if (cartLocationId && (!selectedLocation || selectedLocation.id !== cartLocationId)) {
      setLocation(cartLocationId)
    }
  }, [locations, selectedLocation, cartLocationId, setLocation])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    setIsOpen(false)

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

  const isDisabled = itemCount > 0 && cartLocationId;

  return (
    <div className="location-selector-custom" ref={dropdownRef}>
      <div
        className={`location-trigger ${isOpen ? 'open' : ''} ${isDisabled ? 'disabled' : ''}`}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
      >
        <div className="trigger-icon">
          <MapPin size={20} />
        </div>

        <div className="trigger-info">
          <span className="trigger-label">Ordering from</span>
          <span className="trigger-value">
            {selectedLocation ? selectedLocation.name : 'Select a location'}
          </span>
        </div>

        <div className="trigger-arrow">
          <ChevronDown size={20} />
        </div>
      </div>

      {isOpen && (
        <div className="location-dropdown-menu">
          {locations.map((location) => (
            <div
              key={location.id}
              className={`location-option ${selectedLocation?.id === location.id ? 'selected' : ''}`}
              onClick={() => handleLocationSelect(location)}
            >
              <div className="option-icon">
                {getLocationIcon(location.type)}
              </div>
              <div className="option-info">
                <span className="option-name">{location.name}</span>
                {location.address && (
                  <span className="option-address">{location.address.split(',')[0]}</span>
                )}
              </div>
              {selectedLocation?.id === location.id && (
                <div className="option-check">
                  <Check size={16} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isDisabled && (
        <div className="location-locked-msg">
          <AlertCircle size={14} />
          <span>Location locked while cart has items</span>
        </div>
      )}
    </div>
  )
}

export default LocationSelector
