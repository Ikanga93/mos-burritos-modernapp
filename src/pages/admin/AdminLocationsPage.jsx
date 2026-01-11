import React, { useState, useEffect } from 'react'
import { MapPin, Plus, Edit2, Trash2, Phone, X, Check } from 'lucide-react'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { useToast } from '../../contexts/ToastContext'
import { locationApi } from '../../services/api/locationApi'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import './AdminLocationsPage.css'

const AdminLocationsPage = () => {
    const { isAuthenticated, isLoading: authLoading, role } = useAdminAuth()
    const { showToast } = useToast()

    const [locations, setLocations] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingLocation, setEditingLocation] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        location_type: 'restaurant',
        is_active: true
    })

    const isOwner = role === 'owner'

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
        if (!authLoading && isAuthenticated) {
            loadLocations()
        }
    }, [authLoading, isAuthenticated])

    const openAddModal = () => {
        setEditingLocation(null)
        setFormData({ name: '', address: '', phone: '', location_type: 'restaurant', is_active: true })
        setShowModal(true)
    }

    const openEditModal = (location) => {
        setEditingLocation(location)
        setFormData({
            name: location.name || '',
            address: location.address || '',
            phone: location.phone || '',
            location_type: location.location_type || 'restaurant',
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
            showToast(error.message || 'Failed to save location', 'error')
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

    if (authLoading || isLoading) {
        return (
            <div className="admin-locations-page">
                <LoadingSpinner size="large" message="Loading locations..." />
            </div>
        )
    }

    return (
        <div className="admin-locations-page">
            <header className="page-header">
                <h1>Locations</h1>
                {isOwner && (
                    <button className="add-btn" onClick={openAddModal}>
                        <Plus size={18} /> Add Location
                    </button>
                )}
            </header>

            <div className="locations-grid">
                {locations.length === 0 ? (
                    <div className="empty-state">
                        <MapPin size={48} />
                        <p>No locations yet</p>
                        {isOwner && <button className="add-btn" onClick={openAddModal}>Add Your First Location</button>}
                    </div>
                ) : (
                    locations.map(location => (
                        <div key={location.id} className={`location-card ${!location.is_active ? 'inactive' : ''}`}>
                            <div className="location-header">
                                <div className="location-type">{location.location_type || 'Restaurant'}</div>
                                {!location.is_active && <span className="inactive-badge">Inactive</span>}
                            </div>
                            <h3>{location.name}</h3>
                            <p className="address">{location.address}</p>
                            {location.phone && (
                                <div className="location-detail">
                                    <Phone size={14} />
                                    <span>{location.phone}</span>
                                </div>
                            )}
                            {isOwner && (
                                <div className="location-actions">
                                    <button className="edit-btn" onClick={() => openEditModal(location)}>
                                        <Edit2 size={16} /> Edit
                                    </button>
                                    <button className="delete-btn" onClick={() => handleDelete(location.id)}>
                                        <Trash2 size={16} />
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
                                <select value={formData.location_type} onChange={e => setFormData({ ...formData, location_type: e.target.value })}>
                                    <option value="restaurant">Restaurant</option>
                                    <option value="food_truck">Food Truck</option>
                                    <option value="kiosk">Kiosk</option>
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
