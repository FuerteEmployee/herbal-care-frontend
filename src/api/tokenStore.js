// LocalStorage-scoped credential storage. localStorage (instead of sessionStorage) is
// requested: closing the tab does not end the admin session.
const TOKEN_KEY = 'pentagon_admin_token'
export const SESSION_KEY = 'pentagon_admin_session'

// Mirrored in memory so the hot path (every request) does not touch
// localStorage.
let token = localStorage.getItem(TOKEN_KEY) || null

export function getToken() {
  return token
}

export function setToken(next) {
  token = next
  if (next) localStorage.setItem(TOKEN_KEY, next)
  else localStorage.removeItem(TOKEN_KEY)
}

export function clearSession() {
  setToken(null)
  localStorage.removeItem(SESSION_KEY)
}
