import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, User, Phone, UserPlus } from 'lucide-react'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { useToast } from '../../contexts/ToastContext'

import LoadingSpinner from '../../components/shared/LoadingSpinner'
import './RegisterPage.css'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const { register, isAuthenticated } = useCustomerAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect if already authenticated when page loads (not after registration)
  useEffect(() => {
    // Only redirect on initial load, not after registration completes
    if (isAuthenticated && !isLoading) {
      const from = location.state?.from?.pathname
      if (from === '/checkout' || from === '/order-confirmation') {
        navigate('/order-confirmation', { replace: true })
      } else {
        navigate(from || '/menu', { replace: true })
      }
    }
  }, []) // Empty dependency array - only run on mount

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const { confirmPassword, ...registerData } = formData
      const result = await register(registerData)

      if (result.success) {
        showToast('Registration successful! Welcome to Mo\'s Burritos.', 'success')

        // Redirect to order confirmation if coming from checkout, otherwise intended page or menu
        const from = location.state?.from?.pathname
        if (from === '/checkout' || from === '/order-confirmation') {
          navigate('/order-confirmation', { replace: true })
        } else {
          navigate(from || '/menu', { replace: true })
        }
      } else {
        setErrors({ general: result.error || 'Registration failed. Please try again.' })
        showToast(result.error || 'Registration failed', 'error')
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
      showToast('An unexpected error occurred', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <div className="register-icon">
            <UserPlus size={32} />
          </div>
          <h1>Create Account</h1>
          <p>Join Mo's Burritos to start ordering</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {errors.general && (
            <div className="form-error-banner">
              {errors.general}
            </div>
          )}

          {/* Name Fields */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">
                <User size={18} />
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="John"
                className={errors.first_name ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.first_name && <span className="field-error">{errors.first_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">
                <User size={18} />
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
                className={errors.last_name ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.last_name && <span className="field-error">{errors.last_name}</span>}
            </div>
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">
              <Mail size={18} />
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className={errors.email ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          {/* Phone Field */}
          <div className="form-group">
            <label htmlFor="phone">
              <Phone size={18} />
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(217) 555-1234"
              className={errors.phone ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          {/* Password Fields */}
          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className={errors.password ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <Lock size={18} />
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              className={errors.confirmPassword ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="register-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinner size="small" />
            ) : (
              <>
                <UserPlus size={20} />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <Link 
              to="/login" 
              state={location.state}
              className="login-link"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
