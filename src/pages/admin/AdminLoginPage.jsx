import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Mail, LogIn, Loader } from 'lucide-react'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { useToast } from '../../contexts/ToastContext'
import './AdminLoginPage.css'

const AdminLoginPage = () => {
    const navigate = useNavigate()
    const { login, isAuthenticated } = useAdminAuth()
    const { showToast } = useToast()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState({})

    // Redirect if already authenticated
    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/admin/dashboard')
        }
    }, [isAuthenticated, navigate])

    const validateForm = () => {
        const newErrors = {}
        if (!email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Invalid email format'
        }
        if (!password) {
            newErrors.password = 'Password is required'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        try {
            const result = await login(email, password)
            if (result.success) {
                showToast('Welcome back!', 'success')
                navigate('/admin/dashboard')
            } else {
                setErrors({ general: result.error || 'Invalid credentials' })
                showToast(result.error || 'Login failed', 'error')
            }
        } catch (error) {
            setErrors({ general: 'An error occurred. Please try again.' })
            showToast('Login failed', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="admin-login-page">
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <img src="/images/logo/burritos-logo.png" alt="Mo's Burritos" className="admin-logo" />
                    <h1>Staff Login</h1>
                    <p>Access your restaurant dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="admin-login-form">
                    {errors.general && (
                        <div className="form-error-banner">{errors.general}</div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email"><Mail size={18} /> Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className={errors.email ? 'error' : ''}
                            disabled={isLoading}
                        />
                        {errors.email && <span className="field-error">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password"><Lock size={18} /> Password</label>
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

                    <button type="submit" className="admin-login-btn" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader size={20} className="spin" />
                                Signing in...
                            </>
                        ) : (
                            <>
                                <LogIn size={20} />
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                <div className="admin-login-footer">
                    <p>First time? <Link to="/admin/register">Create owner account</Link></p>
                </div>
            </div>
        </div>
    )
}

export default AdminLoginPage
