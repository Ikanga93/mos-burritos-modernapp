import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Shield, Save, Camera, LogOut } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import './AdminProfilePage.css'

const AdminProfilePage = () => {
    const { showToast } = useToast()
    const navigate = useNavigate()
    
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        current_password: '',
        new_password: '',
        confirm_password: ''
    })
    
    const [isLoading, setIsLoading] = useState(false)
    
    useEffect(() => {
        if (admin) {
            setFormData({
                first_name: admin.first_name || '',
                last_name: admin.last_name || '',
                email: admin.email || '',
                phone: admin.phone || '',
                current_password: '',
                new_password: '',
                confirm_password: ''
            })
        }
    }, [admin])
    
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        
        try {
            // API call to update profile
            showToast('Profile updated successfully', 'success')
        } catch (error) {
            showToast('Failed to update profile', 'error')
        } finally {
            setIsLoading(false)
        }
    }
    
    // Logout removed - no authentication required
    
    return (
        <div className="profile-page">
            <div className="profile-header">
                <h1>My Profile</h1>
                <p>Manage your account information</p>
            </div>
            
            <div className="profile-content">
                <div className="profile-avatar-section">
                    <div className="large-avatar">
                        <img src="/images/logo/burritos-logo.png" alt="Profile" />
                    </div>
                    <button className="change-photo-btn">
                        <Camera size={18} />
                        Change Photo
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-section">
                        <h2><User size={20} /> Personal Information</h2>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label><Mail size={16} /> Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label><Phone size={16} /> Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label><Shield size={16} /> Role</label>
                            <input
                                type="text"
                                value={role}
                                disabled
                                className="disabled-input"
                            />
                        </div>
                    </div>
                    
                    <div className="form-section">
                        <h2>Change Password</h2>
                        
                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                name="current_password"
                                value={formData.current_password}
                                onChange={handleInputChange}
                                placeholder="Enter current password"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                name="new_password"
                                value={formData.new_password}
                                onChange={handleInputChange}
                                placeholder="Enter new password"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                name="confirm_password"
                                value={formData.confirm_password}
                                onChange={handleInputChange}
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>
                    
                    <button type="submit" className="save-btn" disabled={isLoading}>
                        <Save size={18} />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
                
                {/* Logout removed - no authentication required */}
            </div>
        </div>
    )
}

export default AdminProfilePage
