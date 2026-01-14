import React, { useState, useEffect } from 'react'
import { MapPin, Plus, Edit2, Trash2, Phone, X, Check, Store, Truck, Building2, MapPinned } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { locationApi } from '../../services/api/locationApi'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import './AdminLocationsPage.css'

const AdminLocationsPage = () => {
    const { showToast } = useToast()

    const [locations, setLocations] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingLocation, setEditingLocation] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        type: 'restaurant',
        is_active: true
    })


    const loadLocations = async () => {
        setIsLoading(true)
        try {
            const data = await locationApi.getAllLocations(false)
            setLocations(Array.isArray(data) ? data : data.locations || [])
        } catch (error) {
            console.error('Error loading locations:', error)
            showToast('Failed to load locations', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (true) {
            loadLocations()
        }
    }, [])

    const openAddModal = () => {
        setEditingLocation(null)
        setFormData({ name: '', address: '', phone: '', type: 'restaurant', is_active: true })
        setShowModal(true)
    }

    const openEditModal = (location) => {
        setEditingLocation(location)
        setFormData({
            name: location.name || '',
            address: location.address || '',
            phone: location.phone || '',
            type: location.type || 'restaurant',
            is_active: location.is_active !== false
        })
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingLocation(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim() || !formData.address.trim()) {
            showToast('Name and address are required', 'error')
            return
        }

        try {
            if (editingLocation) {
                await locationApi.updateLocation(editingLocation.id, formData)
                showToast('Location updated successfully', 'success')
            } else {
                await locationApi.createLocation(formData)
                showToast('Location created successfully', 'success')
            }
            closeModal()
            loadLocations()
        } catch (error) {
            console.error('Location save error:', error)
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to save location'
            
            // Check if it's an authentication error
            if (error.response?.status === 401) {
                showToast('Session expired. Please try again or log in again.', 'error')
            } else if (error.response?.status === 403) {
                showToast('You do not have permission to perform this action', 'error')
            } else {
                showToast(errorMessage, 'error')
            }
        }
    }

    const handleDelete = async (locationId) => {
        if (!confirm('Are you sure you want to delete this location?')) return
        try {
            await locationApi.deleteLocation(locationId)
            showToast('Location deleted', 'success')
            loadLocations()
        } catch (error) {
            showToast('Failed to delete location', 'error')
        }
    }

    if (isLoading) {
        return (
            <div className="admin-locations-page">
                <LoadingSpinner size="large" message="Loading locations..." />
            </div>
        )
    }

    const getLocationIcon = (type) => {
        switch (type) {
            case 'food_truck':
                return <Truck size={24} />
            case 'kiosk':
                return <Building2 size={24} />
            default:
                return <Store size={24} />
        }
    }

    const formatLocationType = (type) => {
        switch (type) {
            case 'food_truck':
                return 'Food Truck'
            case 'kiosk':
                return 'Kiosk'
            default:
                return 'Restaurant'
        }
    }

    return (
        <div className="admin-locations-page">
            <header className="page-header">
                <div className="header-title">
                    <MapPinned size={32} strokeWidth={2} />
                    <h1>Locations</h1>
                </div>
                {true && (
                    <button className="add-btn" onClick={openAddModal}>
                        <Plus size={20} strokeWidth={2} />
                        <span>Add Location</span>
                    </button>
                )}
            </header>

            <div className="locations-grid">
                {locations.length === 0 ? (
                    <div className="empty-state">
                        <MapPin size={64} strokeWidth={1.5} />
                        <h3>No locations yet</h3>
                        <p>Start by adding your first location</p>
                        {true && (
                            <button className="add-btn-large" onClick={openAddModal}>
                                <Plus size={20} />
                                <span>Add Your First Location</span>
                            </button>
                        )}
                    </div>
                ) : (
                    locations.map(location => (
                        <div key={location.id} className={`location-card ${!location.is_active ? 'inactive' : ''}`}>
                            <div className="location-icon">
                                {getLocationIcon(location.type)}
                            </div>
                            <div className="location-content">
                                <div className="location-header">
                                    <div className="location-type-badge">
                                        {formatLocationType(location.type)}
                                    </div>
                                    {!location.is_active && (
                                        <span className="inactive-badge">Inactive</span>
                                    )}
                                </div>
                                <h3>{location.name}</h3>
                                <div className="location-detail">
                                    <MapPin size={16} strokeWidth={2} />
                                    <span>{location.address}</span>
                                </div>
                                {location.phone && (
                                    <div className="location-detail">
                                        <Phone size={16} strokeWidth={2} />
                                        <span>{location.phone}</span>
                                    </div>
                                )}
                            </div>
                            {true && (
                                <div className="location-actions">
                                    <button className="icon-btn edit-btn" onClick={() => openEditModal(location)} title="Edit">
                                        <Edit2 size={18} strokeWidth={2} />
                                    </button>
                                    <button className="icon-btn delete-btn" onClick={() => handleDelete(location.id)} title="Delete">
                                        <Trash2 size={18} strokeWidth={2} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingLocation ? 'Edit Location' : 'Add Location'}</h2>
                            <button className="close-btn" onClick={closeModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name *</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Address *</label>
                                <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="restaurant">Restaurant</option>
                                    <option value="food_truck">Food Truck</option>
                                </select>
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                                    Active
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="save-btn"><Check size={18} /> {editingLocation ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminLocationsPage
