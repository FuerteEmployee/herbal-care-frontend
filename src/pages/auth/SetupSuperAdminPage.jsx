import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react'
import BrandLogo from '../../components/ui/BrandLogo'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/httpClient'

// First-run only: shown when the backend has no Super Admin yet (see
// GET /auth/setup-status). Creates the one account every other login and
// permission in the system traces back to — there is no hardcoded account,
// so this form is the only way in on a fresh database.
export default function SetupSuperAdminPage() {
  const { isAuthenticated, setupSuperAdmin } = useAuth()
  const navigate = useNavigate()

  const [checking, setChecking] = useState(true)
  const [superAdminExists, setSuperAdminExists] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api
      .get('/auth/setup-status')
      .then(({ superAdminExists }) => setSuperAdminExists(superAdminExists))
      .catch(() => setSuperAdminExists(false))
      .finally(() => setChecking(false))
  }, [])

  if (isAuthenticated) return <Navigate to="/admin" replace />
  if (checking) return null
  if (superAdminExists) return <Navigate to="/login" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    const result = await setupSuperAdmin(name, email, password)
    setSubmitting(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    navigate('/admin', { replace: true })
  }

  return (
    <div className="split-login-root">
      <div className="split-left">
        {/* Simple & attractive floating ambient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-white/5 blur-3xl animate-blob-float-1" />
          <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-white/5 blur-3xl animate-blob-float-2" />
        </div>
        <div className="split-logo-wrap">
          <BrandLogo height={80} />
        </div>
        <div className="split-brand">
          <p className="split-brand-tagline">By Herbal Gujarat Systems</p>
        </div>
        <div className="split-features">
          {['🔐 One-time setup', '👤 First Super Admin account', '🛡️ Full system access'].map((f) => (
            <span key={f} className="split-feature-pill">{f}</span>
          ))}
        </div>
        <div className="split-left-footer">
          <span>Powered by <strong>Herbal Gujarat Suite</strong></span>
        </div>
      </div>

      <div className="split-right">
        <div className="split-form-card animate-fade-in-up">
          <div className="split-form-header">
            <h2 className="split-form-title">Create your Super Admin</h2>
            <p className="split-form-subtitle">No account exists yet — set up the first one to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="split-form-body">
            <div className="split-field-wrap">
              <label className="split-label">FULL NAME</label>
              <div className="split-input-wrap">
                <User size={16} className="split-input-icon" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="split-input"
                />
              </div>
            </div>

            <div className="split-field-wrap">
              <label className="split-label">EMAIL ADDRESS</label>
              <div className="split-input-wrap">
                <Mail size={16} className="split-input-icon" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="split-input"
                />
              </div>
            </div>

            <div className="split-field-wrap">
              <label className="split-label">PASSWORD</label>
              <div className="split-input-wrap">
                <Lock size={16} className="split-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="split-input pr-10"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)} className="split-eye-btn">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="split-field-wrap">
              <label className="split-label">CONFIRM PASSWORD</label>
              <div className="split-input-wrap">
                <Lock size={16} className="split-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="split-input"
                />
              </div>
            </div>

            {error && <div className="split-error animate-fade-in-up">{error}</div>}

            <button type="submit" disabled={submitting} className="split-submit-btn">
              {submitting ? (
                <>
                  <span className="split-spinner" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Super Admin
                  <ArrowRight size={17} className="split-btn-arrow" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
