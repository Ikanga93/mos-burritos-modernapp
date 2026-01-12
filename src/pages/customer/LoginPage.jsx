import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, LogIn } from 'lucide-react'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { useToast } from '../../contexts/ToastContext'

import LoadingSpinner from '../../components/shared/LoadingSpinner'
import './LoginPage.css'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const { login, isAuthenticated, signInWithGoogle } = useCustomerAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect if already authenticated when page loads (not after login)
  useEffect(() => {
    // Only redirect on initial load, not after login completes
    if (isAuthenticated && !isLoading) {
      const from = location.state?.from?.pathname
      if (from === '/checkout' || from === '/order-confirmation') {
        navigate('/order-confirmation', { replace: true })
      } else {
        navigate(from || '/menu', { replace: true })
      }
    }
  }, []) // Empty dependency array - only run on mount

  const validateForm = () => {
    const newErrors = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
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
      const result = await login(email, password)

      if (result.success) {
        showToast('Login successful! Welcome back.', 'success')

        // Wait for customer data to be fully available in context
        // The login function already waits 100ms, but we add a bit more for safety
        await new Promise(resolve => setTimeout(resolve, 150))

        // Redirect to order confirmation if coming from checkout, otherwise intended page or menu
        const from = location.state?.from?.pathname
        if (from === '/checkout' || from === '/order-confirmation') {
          navigate('/order-confirmation', { replace: true })
        } else {
          navigate(from || '/menu', { replace: true })
        }
      } else {
        setErrors({ general: result.error || 'Login failed. Please try again.' })
        showToast(result.error || 'Login failed', 'error')
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
      showToast('An unexpected error occurred', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const result = await signInWithGoogle()

      if (!result.success) {
        showToast(result.error || 'Google sign-in failed', 'error')
        setIsLoading(false)
      }
      // If successful, will redirect to Google (loading stays true)
    } catch (error) {
      showToast('An unexpected error occurred', 'error')
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-icon">
            <LogIn size={32} />
          </div>
          <h1>Welcome Back</h1>
          <p>Login to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Google Sign In Button */}
          <button
            type="button"
            className="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <img src="/images/google-logo.svg" alt="Google" className="google-logo" />
            Continue with Google
          </button>

          {/* OR Divider */}
          <div className="auth-divider">
            <span>OR</span>
          </div>

          {errors.general && (
            <div className="form-error-banner">
              {errors.general}
            </div>
          )}

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">
              <Mail size={18} />
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={errors.email ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={errors.password ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          {/* Forgot Password Link */}
          <div className="form-footer-link">
            <Link to="/forgot-password" className="forgot-link">
              Forgot your password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinner size="small" />
            ) : (
              <>
                <LogIn size={20} />
                Login
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link 
              to="/register" 
              state={location.state}
              className="register-link"
            >
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
