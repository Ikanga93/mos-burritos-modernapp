import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet'
import { MapPin, Clock, Phone, Home } from 'lucide-react'
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

// Custom icon for all Mo's Burritos locations using HTML DivIcon with logo
const mosBurritosIcon = new L.DivIcon({
    className: 'custom-div-icon',
    html: `
        <div class="map-pin-marker">
            <div class="pin-circle">
                <img src="/images/logo/burritos-logo.png" alt="Mo's Burritos" />
            </div>
            <div class="pin-point"></div>
        </div>
    `,
    iconSize: [50, 60],
    iconAnchor: [25, 60],
    popupAnchor: [0, -60]
})

// Reset View Button Component
const ResetViewButton = ({ center, zoom }) => {
    const map = useMap()

    const handleReset = () => {
        map.setView(center, zoom, {
            animate: true,
            duration: 0.5
        })
    }

    React.useEffect(() => {
        const resetButton = document.querySelector('.map-reset-button')
        if (resetButton) {
            resetButton.onclick = handleReset
        }
    }, [map])

    return null
}

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
            <button className="map-reset-button" title="Reset to default view">
                <Home size={20} />
            </button>
            <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                scrollWheelZoom={false}
                className="location-map"
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <ZoomControl position="topright" />
                <ResetViewButton center={defaultCenter} zoom={defaultZoom} />

                {allMarkers.map((marker) => (
                    <Marker
                        key={marker.id}
                        position={marker.position}
                        icon={marker.icon}
                    >
                        <Popup>
                            <div className="map-popup">
                                {marker.image && (
                                    <div className="popup-image-container">
                                        <img src={marker.image} alt={marker.name} className="popup-image" />
                                        <button className="popup-close-btn" onClick={(e) => {
                                            e.target.closest('.leaflet-popup').querySelector('.leaflet-popup-close-button').click();
                                        }}>×</button>
                                    </div>
                                )}
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
                                        className="popup-directions-btn popup-icon-btn"
                                        title="Get Directions"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                                        </svg>
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
