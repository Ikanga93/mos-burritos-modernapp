import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { MapPin, Clock, Phone } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { businessConfig } from '../config/businessConfig'
import './LocationMap.css'

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom icon for all Mo's Burritos locations (unified green pin)
const mosBurritosIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path fill="#2E7D32" stroke="#1B5E20" stroke-width="2" d="M16,2 C9.4,2 4,7.4 4,14 C4,22 16,38 16,38 S28,22 28,14 C28,7.4 22.6,2 16,2 Z"/>
      <circle cx="16" cy="14" r="5" fill="#FFFFFF"/>
      <text x="16" y="17" text-anchor="middle" font-size="12" font-weight="bold" fill="#2E7D32">M</text>
    </svg>
  `),
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40]
})

const LocationMap = ({ locations = [], liveLocations = [] }) => {
    // Default center (Champaign, IL - Mo's Burritos Restaurant)
    const defaultCenter = [40.1164, -88.2434]
    const defaultZoom = 13

    // Combine all locations for rendering
    const allMarkers = []

    // Add all active locations from business config
    businessConfig.locations.filter(loc => loc.isActive).forEach(location => {
        allMarkers.push({
            id: `config-${location.id}`,
            name: location.name,
            position: [location.coordinates.lat, location.coordinates.lng],
            address: location.address,
            phone: location.phone,
            hours: location.hours,
            description: location.description,
            image: location.image,
            type: location.type === 'restaurant' ? 'restaurant' : 'foodtruck',
            locationType: location.type === 'restaurant' ? 'Restaurant' : 'Food Truck',
            icon: mosBurritosIcon
        })
    })
    // Add live food truck locations
    liveLocations.forEach(location => {
        if (location.latitude && location.longitude) {
            allMarkers.push({
                id: `live-${location.id}`,
                name: location.truck_name || 'Food Truck',
                position: [parseFloat(location.latitude), parseFloat(location.longitude)],
                address: location.current_address,
                hours: location.hours_today,
                description: location.description,
                type: 'foodtruck',
                locationType: 'Food Truck',
                icon: mosBurritosIcon,
                isLive: true
            })
        }
    })

    // Add scheduled locations if they have coordinates
    locations.forEach(location => {
        if (location.latitude && location.longitude) {
            allMarkers.push({
                id: `scheduled-${location.id}`,
                name: location.name,
                position: [parseFloat(location.latitude), parseFloat(location.longitude)],
                address: location.current_location,
                hours: location.schedule,
                phone: location.phone,
                type: location.type === 'restaurant' ? 'restaurant' : 'foodtruck',
                locationType: location.type === 'restaurant' ? 'Restaurant' : 'Food Truck',
                icon: mosBurritosIcon
            })
        }
    })

    return (
        <div className="location-map-wrapper">
            <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                scrollWheelZoom={false}
                className="location-map"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {allMarkers.map((marker) => (
                    <Marker
                        key={marker.id}
                        position={marker.position}
                        icon={marker.icon}
                    >
                        <Popup>
                            <div className="map-popup">
                                {marker.isLive && (
                                    <div className="live-badge-popup">
                                        <span className="live-indicator">●</span> LIVE NOW
                                    </div>
                                )}
                                {marker.locationType && (
                                    <div className="location-type-badge">
                                        {marker.locationType}
                                    </div>
                                )}
                                <h3 className="popup-title">{marker.name}</h3>
                                {marker.image && (
                                    <div className="popup-image-container">
                                        <img src={marker.image} alt={marker.name} className="popup-image" />
                                    </div>
                                )}
                                <div className="popup-details">
                                    {marker.address && (
                                        <p className="popup-address">
                                            <MapPin size={16} className="popup-icon" />
                                            {marker.address}
                                        </p>
                                    )}
                                    {marker.hours && (
                                        <p className="popup-hours">
                                            <Clock size={16} className="popup-icon" />
                                            {marker.hours}
                                        </p>
                                    )}
                                    {marker.phone && (
                                        <p className="popup-phone">
                                            <Phone size={16} className="popup-icon" />
                                            <a href={`tel:${marker.phone}`}>{marker.phone}</a>
                                        </p>
                                    )}
                                    {marker.description && (
                                        <p className="popup-description">{marker.description}</p>
                                    )}
                                </div>
                                <div className="popup-actions">
                                    <a
                                        href="/menu"
                                        className="popup-order-btn"
                                    >
                                        Order Online
                                    </a>
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${marker.position[0]},${marker.position[1]}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="popup-directions-btn"
                                    >
                                        Get Directions
                                    </a>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}

export default LocationMap
