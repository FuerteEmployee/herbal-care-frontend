import { api } from './httpClient'

// Roles and the permission catalogue, from herbal-backend's roleController.
// Every endpoint here is superadmin-only server-side — an admin who could edit
// roles could grant itself everything, so handing out access stays with the
// superadmin tier.

export function mapRoleFromApi(r) {
  return {
    id: r._id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? '',
    permissions: r.permissions ?? [],
    isSystem: !!r.isSystem,
    isActive: r.isActive !== false,
    adminCount: r.adminCount ?? 0,
    // The Super Admin role is the one that always keeps full access, so the UI
    // shows it as read-only rather than offering checkboxes it cannot save.
    isFullAccess: (r.permissions ?? []).includes('*'),
    date: (r.createdAt ?? '').slice(0, 10),
  }
}

// GET /api/admin/permissions → the modules and actions a role can be given.
// Driven by the backend so a module added there appears here without a UI change.
export async function getPermissionCatalog() {
  const { modules } = await api.get('/admin/permissions')
  return (modules ?? []).map((m) => ({
    key: m.key,
    label: m.label,
    description: m.description ?? '',
    actions: m.actions ?? [],
    // `sidebar: true` means "<key>.view" controls a nav item, which is what the
    // Roles screen surfaces as the show/hide toggle.
    sidebar: !!m.sidebar,
  }))
}

export async function getRoles() {
  const { total, roles } = await api.get('/admin/roles')
  return { total: total ?? 0, items: (roles ?? []).map(mapRoleFromApi) }
}

export async function createRole({ name, description, permissions }) {
  const { role } = await api.post('/admin/roles', { name, description, permissions })
  return mapRoleFromApi(role)
}

export async function updateRole(id, { name, description, permissions, isActive }) {
  const body = {}
  if (name !== undefined) body.name = name
  if (description !== undefined) body.description = description
  if (permissions !== undefined) body.permissions = permissions
  if (isActive !== undefined) body.isActive = isActive
  const { role } = await api.put(`/admin/roles/${id}`, body)
  return mapRoleFromApi(role)
}

export async function deleteRole(id) {
  return api.delete(`/admin/roles/${id}`)
}
