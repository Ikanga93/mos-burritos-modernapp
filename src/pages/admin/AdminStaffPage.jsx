import React, { useState, useEffect } from 'react'
import { Users, Plus, Edit2, Trash2, X, Check, Mail, Phone, MapPin } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { adminClient } from '../../services/api/apiClient'
import { locationApi } from '../../services/api/locationApi'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import './AdminStaffPage.css'

const AdminStaffPage = () => {
    const { showToast } = useToast()

    const [staff, setStaff] = useState([])
    const [locations, setLocations] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingStaff, setEditingStaff] = useState(null)
    const [formData, setFormData] = useState({
        email: '', password: '', first_name: '', last_name: '', phone: '', role: 'staff', location_ids: []
    })


    useEffect(() => {
        if (true) loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [usersRes, locsRes] = await Promise.all([
                adminClient.get('/users', { params: { role_filter: null } }),
                locationApi.getAllLocations()
            ])
            const users = usersRes.data.filter(u => ['owner', 'manager', 'staff'].includes(u.role))
            setStaff(users)
            setLocations(Array.isArray(locsRes) ? locsRes : locsRes.locations || [])
        } catch (error) {
            console.error('Error loading data:', error)
            showToast('Failed to load staff', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const openAddModal = () => {
        setEditingStaff(null)
        setFormData({ email: '', password: '', first_name: '', last_name: '', phone: '', role: 'staff', location_ids: [] })
        setShowModal(true)
    }

    const openEditModal = async (user) => {
        setEditingStaff(user)
        let assignedLocations = []
        try {
            const res = await adminClient.get(`/users/${user.id}/locations`)
            assignedLocations = res.data.map(loc => loc.location_id)
        } catch (e) { console.error('Error fetching locations:', e) }

        setFormData({
            email: user.email || '', password: '', first_name: user.first_name || '',
            last_name: user.last_name || '', phone: user.phone || '', role: user.role || 'staff',
            location_ids: []
        })
        setShowModal(true)
    }

    const closeModal = () => { setShowModal(false); setEditingStaff(null) }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.email.trim() || !formData.first_name.trim()) {
            showToast('Email and first name are required', 'error')
            return
        }
        if (!editingStaff && !formData.password) {
            showToast('Password is required for new users', 'error')
            return
        }

        try {
            if (editingStaff) {
                await adminClient.put(`/users/${editingStaff.id}`, {
                    first_name: formData.first_name, last_name: formData.last_name, phone: formData.phone
                })
                for (const locId of formData.location_ids) {
                    await adminClient.post('/users/assign-location', {
                        user_id: editingStaff.id, location_id: locId,
                        role: formData.role === 'manager' ? 'manager' : 'staff'
                    })
                }
                showToast('Staff updated successfully', 'success')
            } else {
                const res = await adminClient.post('/users', {
                    email: formData.email, password: formData.password, first_name: formData.first_name,
                    last_name: formData.last_name, phone: formData.phone, role: formData.role
                })
                const newUserId = res.data.id
                for (const locId of formData.location_ids) {
                    await adminClient.post('/users/assign-location', {
                        user_id: newUserId, location_id: locId, role: formData.role === 'manager' ? 'manager' : 'staff'
                    })
                }
                showToast('Staff created successfully', 'success')
            }
            closeModal()
            loadData()
        } catch (error) {
            showToast(error.response?.data?.detail || 'Failed to save staff', 'error')
        }
    }

    const handleDelete = async (userId) => {
        if (!confirm('Are you sure you want to deactivate this staff member?')) return
        try {
            await adminClient.put(`/users/${userId}`, { is_active: false })
            showToast('Staff deactivated', 'success')
            loadData()
        } catch (error) {
            showToast('Failed to deactivate staff', 'error')
        }
    }

    const toggleLocationAssignment = (locationId) => {
        setFormData(prev => ({
            ...prev,
            location_ids: prev.location_ids.includes(locationId)
                ? prev.location_ids.filter(id => id !== locationId)
                : [...prev.location_ids, locationId]
        }))
    }

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'owner': return 'role-owner'
            case 'manager': return 'role-manager'
            default: return 'role-staff'
        }
    }

    if (isLoading) {
        return <div className="admin-staff-page"><LoadingSpinner size="large" message="Loading staff..." /></div>
    }

    return (
        <div className="admin-staff-page">
            <header className="page-header">
                <h1>Staff</h1>
                {true && <button className="add-btn" onClick={openAddModal}><Plus size={18} /> Add Staff</button>}
            </header>

            <div className="staff-grid">
                {staff.length === 0 ? (
                    <div className="empty-state">
                        <Users size={48} />
                        <p>No staff members yet</p>
                        {true && <button className="add-btn" onClick={openAddModal}>Add Your First Staff</button>}
                    </div>
                ) : (
                    staff.map(user => (
                        <div key={user.id} className={`staff-card ${!user.is_active ? 'inactive' : ''}`}>
                            <div className="staff-header">
                                <div className="staff-avatar">{(user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()}</div>
                                <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
                            </div>
                            <h3>{user.first_name} {user.last_name}</h3>
                            <div className="staff-detail"><Mail size={14} /><span>{user.email}</span></div>
                            {user.phone && <div className="staff-detail"><Phone size={14} /><span>{user.phone}</span></div>}
                            {true && false && (
                                <div className="staff-actions">
                                    <button className="edit-btn" onClick={() => openEditModal(user)}><Edit2 size={16} /> Edit</button>
                                    <button className="delete-btn" onClick={() => handleDelete(user.id)}><Trash2 size={16} /></button>
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
                            <h2>{editingStaff ? 'Edit Staff' : 'Add Staff'}</h2>
                            <button className="close-btn" onClick={closeModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name *</label>
                                    <input type="text" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input type="text" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!!editingStaff} required />
                            </div>
                            {!editingStaff && (
                                <div className="form-group">
                                    <label>Password *</label>
                                    <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Phone</label>
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} disabled={editingStaff?.role === 'owner'}>
                                    <option value="staff">Staff</option>
                                    <option value="manager">Manager</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Assigned Locations</label>
                                <div className="location-checkboxes">
                                    {locations.map(loc => (
                                        <label key={loc.id} className="location-checkbox">
                                            <input type="checkbox" checked={formData.location_ids.includes(loc.id)} onChange={() => toggleLocationAssignment(loc.id)} />
                                            <MapPin size={14} /> {loc.name}
                                        </label>
                                    ))}
                                    {locations.length === 0 && <p className="no-locations">No locations available. Create locations first.</p>}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="save-btn"><Check size={18} /> {editingStaff ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminStaffPage
