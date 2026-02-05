import React from 'react'
import { X, MapPin } from 'lucide-react'
import './LocationRequestModal.css'

const LocationRequestModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null

    return (
        <div className="location-request-modal-backdrop">
            <div className="location-request-modal">
                <button
                    className="location-request-close"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                <div className="location-request-icon">
                    <MapPin size={32} />
                </div>

                <h3>Select a Location</h3>
                <p>
                    Please select your nearest location to view the correct menu and pricing for your area.
                </p>

                <button className="location-request-btn" onClick={onClose}>
                    Got it
                </button>
            </div>
        </div>
    )
}

export default LocationRequestModal
