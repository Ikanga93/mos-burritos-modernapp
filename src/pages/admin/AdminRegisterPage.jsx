import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Lock, Mail, Phone, Building, Loader, CheckCircle } from 'lucide-react'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { useToast } from '../../contexts/ToastContext'
import { getApiBaseUrl } from '../../utils/apiConfig'
import './AdminRegisterPage.css'

const AdminRegisterPage = () => {
    const navigate = useNavigate()
    const { login, isAuthenticated } = useAdminAuth()
    const { showToast } = useToast()

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        phone: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [ownerExists, setOwnerExists] = useState(false)
    const [checkingOwner, setCheckingOwner] = useState(true)

    const apiUrl = getApiBaseUrl()

    // Check if an owner already exists
    useEffect(() => {
        const checkOwnerExists = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/users/check-owner-exists`)
                if (response.ok) {
                    const data = await response.json()
                    setOwnerExists(data.exists)
                }
            } catch (error) {
                console.error('Error checking owner:', error)
                // If endpoint doesn't exist, assume no owner yet
                setOwnerExists(false)
            } finally {
                setCheckingOwner(false)
            }
        }
        checkOwnerExists()
    }, [apiUrl])

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/admin/dashboard')
        }
    }, [isAuthenticated, navigate])

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
            newErrors.email = 'Invalid email format'
        }

        if (!formData.password) {
            newErrors.password = 'Password is required'
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters'
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        try {
            // Register as owner
            const response = await fetch(`${apiUrl}/api/users/register-owner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone || null
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.detail || 'Registration failed')
            }

            showToast('Account created successfully!', 'success')

            // Auto-login after registration
            const loginResult = await login(formData.email, formData.password)
            if (loginResult.success) {
                navigate('/admin/dashboard')
            } else {
                navigate('/admin/login')
            }
        } catch (error) {
            setErrors({ general: error.message })
            showToast(error.message, 'error')
        } finally {
            setIsLoading(false)
        }
    }

    if (checkingOwner) {
        return (
            <div className="admin-register-page">
                <div className="admin-register-card">
                    <Loader size={32} className="spin" />
                    <p>Checking system status...</p>
                </div>
            </div>
        )
    }

    if (ownerExists) {
        return (
            <div className="admin-register-page">
                <div className="admin-register-card">
                    <div className="owner-exists-message">
                        <CheckCircle size={48} />
                        <h2>Owner Account Exists</h2>
                        <p>An owner account has already been created for this system.</p>
                        <p>Please contact your administrator if you need staff access.</p>
                        <Link to="/admin/login" className="login-link-btn">
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="admin-register-page">
            <div className="admin-register-card">
                <div className="register-header">
                    <img src="/images/logo/burritos-logo.png" alt="Mo's Burritos" className="register-logo" />
                    <h1>Create Owner Account</h1>
                    <p>Set up your restaurant management system</p>
                </div>

                <form onSubmit={handleSubmit} className="register-form">
                    {errors.general && (
                        <div className="form-error-banner">{errors.general}</div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="first_name"><User size={16} /> First Name</label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="Mo"
                                className={errors.first_name ? 'error' : ''}
                                disabled={isLoading}
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
                                placeholder="Owner"
                                className={errors.last_name ? 'error' : ''}
                                disabled={isLoading}
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
                            placeholder="owner@yourbusiness.com"
                            className={errors.email ? 'error' : ''}
                            disabled={isLoading}
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
                            placeholder="(555) 123-4567"
                            className={errors.phone ? 'error' : ''}
                            disabled={isLoading}
                        />
                        {errors.phone && <span className="field-error">{errors.phone}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password"><Lock size={16} /> Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="At least 8 characters"
                            className={errors.password ? 'error' : ''}
                            disabled={isLoading}
                        />
                        {errors.password && <span className="field-error">{errors.password}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword"><Lock size={16} /> Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            className={errors.confirmPassword ? 'error' : ''}
                            disabled={isLoading}
                        />
                        {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                    </div>

                    <button type="submit" className="register-btn" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader size={20} className="spin" />
                                Creating Account...
                            </>
                        ) : (
                            <>
                                <Building size={20} />
                                Create Owner Account
                            </>
                        )}
                    </button>
                </form>

                <div className="register-footer">
                    <p>Already have an account? <Link to="/admin/login">Sign in</Link></p>
                </div>
            </div>
        </div>
    )
}

export default AdminRegisterPage
