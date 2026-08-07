import { getToken, clearSession } from './tokenStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Every response body is JSON except file downloads, which go through
// downloadFile() below. A 401 on an authenticated request means the token
// expired or was revoked server-side, so we drop the session and bounce to
// the login screen rather than letting the caller render half a page.
async function request(path, options = {}) {
  const token = getToken()
  const isFormData = options.body instanceof FormData

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        // Let the browser set the multipart boundary itself for FormData.
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...options,
    })
  } catch {
    throw new Error(`Could not reach the backend at ${BASE_URL}. Is the Node server running?`)
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    if (res.status === 401 && token && !window.location.pathname.startsWith('/admin/login')) {
      clearSession()
      window.location.href = '/admin/login'
    }
    // The API reports failures as { success: false, message }. Keep the parsed
    // body on the error too so callers can read field-level detail.
    throw Object.assign(
      new Error(data?.message || data?.error || `Request failed (${res.status})`),
      { body: data, status: res.status },
    )
  }

  // Some handlers answer 200 with { success: false } rather than a 4xx.
  if (data && data.success === false) {
    throw Object.assign(new Error(data.message || 'Request failed'), { body: data, status: res.status })
  }

  return data
}

// PDFs / XLSX exports. A body implies POST (bulk label printing sends the
// product id list), otherwise it is a plain GET.
async function downloadFile(path, filename, body) {
  const token = getToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw Object.assign(new Error(data?.error || `Request failed (${res.status})`), { body: data })
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  // Multipart helpers. `request` detects FormData and lets the browser set the
  // multipart boundary itself, so no Content-Type is passed here. PUT needs its
  // own entry because editing a record can also replace its photos.
  upload: (path, formData) => request(path, { method: 'POST', body: formData }),
  uploadPut: (path, formData) => request(path, { method: 'PUT', body: formData }),
  downloadFile,
}
