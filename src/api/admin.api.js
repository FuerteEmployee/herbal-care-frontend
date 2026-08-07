import { api } from './httpClient'

// Admin-side endpoints exposed by herbal-backend's src/routes/adminRoutes.js.
// Every response is wrapped as { success, ...payload }, so each call here
// unwraps to the bare payload the UI actually wants.

// Permissions come from the server: an Admin points at a Role document, and
// login / /admin/me return the resolved key list alongside the account. The
// fallback below only covers a server old enough not to send `permissions` at
// all — normally it is never used.
const FALLBACK_PERMISSIONS_BY_ROLE = {
  superadmin: ['*'],
  admin: [
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
    'orders.view', 'orders.edit',
    'customers.view', 'customers.edit',
    'leads.view', 'leads.edit', 'leads.delete',
    'reports.view',
  ],
}

const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Admin',
}

export function mapAdminFromApi(a) {
  return {
    id: a._id,
    name: a.name,
    email: a.email,
    // The access tier — still "admin" | "superadmin". The named role lives in
    // roleId/roleName and is what actually decides the permission list.
    role: a.role,
    roleId: a.roleRef ? String(a.roleRef) : '',
    roleName: a.roleName ?? ROLE_LABELS[a.role] ?? 'Admin',
    permissions: a.permissions ?? FALLBACK_PERMISSIONS_BY_ROLE[a.role] ?? [],
    status: a.isActive === false ? 'inactive' : 'active',
  }
}

// POST /api/admin/login → { token, admin }
export async function adminLogin(email, password) {
  const { token, admin } = await api.post('/admin/login', { email, password })
  return { token, admin: mapAdminFromApi(admin) }
}

// GET /api/admin/me — used to re-validate an existing session on refresh.
export async function getAdminProfile() {
  const { admin } = await api.get('/admin/me')
  return mapAdminFromApi(admin)
}

// GET /api/admin/dashboard → aggregated counters plus two recent lists.
export async function getDashboard() {
  const { stats, recentOrders, recentCustomers } = await api.get('/admin/dashboard')
  return {
    stats: {
      orders: stats?.orders ?? {},
      totalRevenue: stats?.totalRevenue ?? 0,
      totalCustomers: stats?.totalCustomers ?? 0,
      totalProducts: stats?.totalProducts ?? 0,
      newLeads: stats?.newLeads ?? 0,
    },
    recentOrders: (recentOrders ?? []).map((o) => ({
      id: o._id,
      customer: o.user?.name ?? 'Deleted customer',
      email: o.user?.email ?? '',
      amount: o.totalAmount ?? 0,
      status: o.orderStatus ?? 'pending',
      date: (o.createdAt ?? '').slice(0, 10),
    })),
    recentCustomers: (recentCustomers ?? []).map((c) => ({
      id: c._id,
      name: c.name,
      email: c.email,
      date: (c.createdAt ?? '').slice(0, 10),
    })),
  }
}

function toQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, v)
  })
  return qs.toString()
}

// GET /api/admin/customers?page&limit&search&status → { total, pages, customers }
//
// Search and the active/inactive filter both run in the database; the panel
// only ever holds one page of users.
export async function getCustomers({ page = 1, limit = 10, search, status } = {}) {
  const qs = toQuery({ page, limit, search, status })
  const res = await api.get(`/admin/customers${qs ? `?${qs}` : ''}`)
  const { total, pages, customers } = res
  return {
    total: total ?? 0,
    page: res.page ?? page,
    // Older builds of the API answered without a page count — derive it so the
    // pager still works against one.
    pages: pages ?? Math.max(1, Math.ceil((total ?? 0) / limit)),
    items: (customers ?? []).map((c) => ({
      id: c._id,
      name: c.name,
      email: c.email,
      phone: c.phone ?? '',
      addresses: c.addresses ?? [],
      status: c.isActive === false ? 'inactive' : 'active',
      date: (c.createdAt ?? '').slice(0, 10),
    })),
  }
}

// The server caps a single list request at 100 rows, so anything wanting a
// longer run has to ask for it a page at a time.
const CUSTOMERS_PER_REQUEST = 100

/**
 * Customers for a picker, up to `max`.
 *
 * Pages under the hood because one request can no longer return an unbounded
 * slab of rows. Note this is still the wrong shape for a table in the lakhs —
 * a dropdown holding every customer never was viable — so it stays bounded and
 * a caller that outgrows `max` wants a searchable server-side picker instead.
 */
export async function getCustomerOptions({ max = 200, search } = {}) {
  const items = []
  for (let page = 1; items.length < max; page++) {
    const res = await getCustomers({ page, limit: CUSTOMERS_PER_REQUEST, search })
    items.push(...res.items)
    if (items.length >= res.total || res.items.length === 0) break
  }
  return items.slice(0, max)
}

// PUT /api/admin/customers/:id/status — server toggles, no body needed.
export async function toggleCustomerStatus(id) {
  const { user } = await api.put(`/admin/customers/${id}/status`, {})
  return user
}

// ------------------------------------------------------- admin accounts
// Superadmin-only. The backend refuses to remove or demote the last active
// superadmin, and refuses to let you deactivate or delete your own account, so
// those errors surface as normal validation messages.

// Only used if the roles endpoint cannot be reached — the Add Admin form
// normally lists the live roles from GET /api/admin/roles.
export const ADMIN_ROLES = [
  { value: 'admin', label: 'Admin', hint: 'Day-to-day: products, orders, users and enquiries' },
  { value: 'superadmin', label: 'Super Admin', hint: 'Everything, including managing roles and admin accounts' },
]

export async function getAdmins(params = {}) {
  const qs = toQuery(params)
  const { total, admins } = await api.get(`/admin/admins${qs ? `?${qs}` : ''}`)
  return {
    total: total ?? 0,
    items: (admins ?? []).map((a) => ({
      ...mapAdminFromApi(a),
      createdAt: a.createdAt,
      date: (a.createdAt ?? '').slice(0, 10),
    })),
  }
}

// `roleId` is a Role document id; the server derives the admin/superadmin tier
// from it. `role` remains accepted for the two built-in roles.
export async function createAdminAccount({ name, email, password, role, roleId }) {
  const { admin } = await api.post('/admin/admins', { name, email, password, role, roleId })
  return mapAdminFromApi(admin)
}

// Only the fields actually supplied are sent, so a name edit can't blank a role.
export async function updateAdminAccount(id, { name, role, roleId, isActive, password }) {
  const body = {}
  if (name !== undefined) body.name = name
  if (role !== undefined) body.role = role
  if (roleId !== undefined) body.roleId = roleId
  if (isActive !== undefined) body.isActive = isActive
  if (password) body.password = password
  const { admin } = await api.put(`/admin/admins/${id}`, body)
  return mapAdminFromApi(admin)
}

export async function deleteAdminAccount(id) {
  return api.delete(`/admin/admins/${id}`)
}
