import { api } from './httpClient'

// Contact-form leads — herbal-backend's src/models/Contact.js. The public site
// POSTs to /api/contact; everything below is the admin side.
// Note the backend has no `source` field and no free-form notes beyond a single
// `adminNote`, so the UI reads follow-up notes from adminNote.

export const LEAD_STATUSES = ['new', 'read', 'resolved']

export const LEAD_STATUS_LABELS = {
  new: 'New',
  read: 'Read',
  resolved: 'Resolved',
}

export function mapLeadFromApi(l) {
  return {
    id: l._id,
    name: l.name,
    email: l.email ?? '',
    phone: l.phone ?? '',
    subject: l.subject ?? '',
    message: l.message ?? '',
    source: l.source ?? 'Manual',
    status: l.status ?? 'new',
    notes: l.adminNote ?? '',
    date: l.createdAt ? (() => {
      const d = new Date(l.createdAt);
      if (isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day} - ${month} - ${year}`;
    })() : '',
    createdAt: l.createdAt,
  }
}

function toQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, v)
  })
  return qs.toString()
}

// GET /api/contact?page&limit&status&source&search&from&to
//   → { total, page, pages, leads }
//
// `search` runs server-side across name, email, phone, subject and message. It
// used to filter the loaded page in the browser, which meant it only ever
// looked at the ten rows already on screen.
export async function getLeadsPage({
  page = 1,
  limit = 10,
  status,
  source,
  search,
  from,
  to,
} = {}) {
  const qs = toQuery({ page, limit, status, source, search, from, to })
  const res = await api.get(`/contact${qs ? `?${qs}` : ''}`)
  return {
    items: (res.leads ?? []).map(mapLeadFromApi),
    total: res.total ?? 0,
    page: res.page ?? page,
    pages: res.pages ?? 1,
  }
}

// POST /api/contact — the public submit route, reused for manual entry so an
// admin can log a phone or walk-in enquiry.
export async function createLead({ name, email, phone, subject, message }) {
  const { lead } = await api.post('/contact', { name, email, phone, subject, message })
  return mapLeadFromApi(lead)
}

// PUT /api/contact/:id/status — carries both the status and the admin note.
export async function updateLeadStatus(id, status, adminNote) {
  const { lead } = await api.put(`/contact/${id}/status`, {
    status,
    ...(adminNote !== undefined ? { adminNote } : {}),
  })
  return mapLeadFromApi(lead)
}

export async function deleteLead(id) {
  return api.delete(`/contact/${id}`)
}
