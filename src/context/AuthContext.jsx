import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { adminLogin, getAdminProfile } from '../api/admin.api'
import { setToken, clearSession, SESSION_KEY } from '../api/tokenStore'

// How often (and on window refocus) an already-logged-in session re-checks its
// own role against the server, so deactivating an admin takes effect without
// waiting for their token to expire. A revoked/expired token 401s immediately
// via httpClient's interceptor; this covers the role changing underneath an
// otherwise-valid session.
const PROFILE_REFRESH_INTERVAL_MS = 60_000

// The session (including the JWT) is kept in localStorage, persisting
// across refreshes and tab closures.
function readSession() {
  const stored = localStorage.getItem(SESSION_KEY)
  if (!stored) return null
  try {
    const session = JSON.parse(stored)
    setToken(session.token)
    return session
  } catch {
    // Corrupt payload — start clean rather than crashing the whole app on boot.
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)
  const userRef = useRef(user)
  userRef.current = user

  function commitSession(nextUser) {
    setToken(nextUser.token)
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }

  useEffect(() => {
    if (!user) return

    async function refreshProfile() {
      try {
        const admin = await getAdminProfile()
        // Keep the existing token — /admin/me reports the current role and
        // active flag, it does not issue a new one.
        commitSession({ ...userRef.current, ...admin, token: userRef.current.token })
      } catch {
        // A 401 here (token genuinely invalid) is already handled by
        // httpClient's interceptor, which clears the session and redirects
        // to /login — nothing extra to do on failure.
      }
    }

    const interval = setInterval(refreshProfile, PROFILE_REFRESH_INTERVAL_MS)
    window.addEventListener('focus', refreshProfile)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', refreshProfile)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      // A superadmin passes every check; an admin carries the explicit list
      // built in admin.api.js from its role.
      hasPermission: (key) =>
        user?.role === 'superadmin' ||
        user?.permissions?.includes('*') ||
        !!user?.permissions?.includes(key),
      login: async (email, password) => {
        try {
          const { token, admin } = await adminLogin(email, password)
          commitSession({ ...admin, token })
          return { success: true }
        } catch (err) {
          // No offline fallback: a fake session made an unreachable API look
          // like a successful login, then every screen silently showed
          // placeholder data. Surface the real failure instead.
          return { success: false, error: err.message || 'Invalid email or password.' }
        }
      },
      logout: () => {
        clearSession()
        setUser(null)
      },
    }),
    [user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
