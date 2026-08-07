import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react'
import { getDefaultRedirectPath } from '../../constants/roles'

export default function LoginPage() {
  const { isAuthenticated, login, hasPermission } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to={getDefaultRedirectPath(hasPermission)} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setSubmitting(true)
    const result = await login(email, password)
    if (!result.success) {
      setError(result.error || 'Invalid email or password.')
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      {/* Left side: Animated Logo (Desktop only) */}
      <div className="login-left">
        <div className="login-gold-glow" />
        <img
          src="/logo.png"
          alt="Herbal King's Man Logo"
          className="login-logo-animated"
        />
        <h1 className="login-brand-title">Herbal King's Man</h1>
        <p className="login-brand-desc">Pure Nature &bull; Royal Standard</p>
      </div>

      {/* Right side: Login form */}
      <div className="login-right">
        {/* Background blobs for mobile/right side decoration */}
        <div className="login-blob login-blob-1 lg:hidden" />
        <div className="login-blob login-blob-2 lg:hidden" />

        <div className="login-form-container">
          {/* No logo on the card — the left panel already carries it, and
              repeating it inside the form pushed the fields below the fold. */}
          <div className="login-card-header">
            <h2 className="login-title">Herbal King's Man</h2>
            <p className="login-subtitle">Sign in to your admin account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Email */}
            <div className="login-field">
              <label className="login-label">Email Address</label>
              <div className="login-input-wrap">
                <Mail size={16} className="login-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Email Address"
                  className="login-input"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <Lock size={16} className="login-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="login-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="login-eye-btn"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" disabled={submitting} className="login-btn">
              {submitting ? (
                <>
                  <Loader2 size={16} className="login-spinner" /> Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="login-footer">
            Herbal King's Man Admin &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
