import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Lock, Save, LogOut } from 'lucide-react'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { useToast } from '../../contexts/ToastContext'
import './ProfilePage.css'

const ProfilePage = () => {
    const navigate = useNavigate()
    const { customer, logout, updateProfile } = useCustomerAuth()
    const { showToast } = useToast()

    const [formData, setFormData] = useState({
        first_name: customer?.first_name || '',
        last_name: customer?.last_name || '',
        email: customer?.email || '',
        phone: customer?.phone || ''
    })
    const [isUpdating, setIsUpdating] = useState(false)
    const [errors, setErrors] = useState({})

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }))
        }
    }

    const validateForm = () => {
        const newErrors = {}
        if (!formData.first_name.trim()) newErrors.first_name = 'First name is required'
        if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required'
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsUpdating(true)
        try {
            if (updateProfile) {
                await updateProfile(formData)
                showToast('Profile updated successfully', 'success')
            } else {
                showToast('Profile update not available', 'info')
            }
        } catch (error) {
            showToast(error.message || 'Failed to update profile', 'error')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/')
        showToast('You have been logged out', 'info')
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* Header */}
                <div className="profile-header">
                    <div className="profile-avatar">
                        <User size={40} />
                    </div>
                    <div className="profile-info">
                        <h1>{formData.first_name} {formData.last_name}</h1>
                        <p>{formData.email}</p>
                    </div>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-section">
                        <h2>Personal Information</h2>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="first_name"><User size={16} /> First Name</label>
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className={errors.first_name ? 'error' : ''}
                                    disabled={isUpdating}
                                />
                                {errors.first_name && <span className="field-error">{errors.first_name}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="last_name"><User size={16} /> Last Name</label>
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className={errors.last_name ? 'error' : ''}
                                    disabled={isUpdating}
                                />
                                {errors.last_name && <span className="field-error">{errors.last_name}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email"><Mail size={16} /> Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={errors.email ? 'error' : ''}
                                disabled={isUpdating}
                            />
                            {errors.email && <span className="field-error">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone"><Phone size={16} /> Phone</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="(217) 555-1234"
                                disabled={isUpdating}
                            />
                        </div>
                    </div>

                    <button type="submit" className="save-btn" disabled={isUpdating}>
                        <Save size={18} />
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>

                {/* Logout Section */}
                <div className="logout-section">
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProfilePage
