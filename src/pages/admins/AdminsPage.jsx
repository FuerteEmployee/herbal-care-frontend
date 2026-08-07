import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, ShieldCheck, Shield, KeyRound, Eye, EyeOff } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import TableEmpty from '../../components/ui/TableEmpty'
import TableLoading, { TableLoadBar } from '../../components/ui/TableLoading'
import Pagination from '../../components/ui/Pagination'
import { useToast } from '../../components/ui/ToastContext'
import { useAuth } from '../../context/AuthContext'
import {
  getAdmins,
  createAdminAccount,
  updateAdminAccount,
  deleteAdminAccount,
  ADMIN_ROLES,
} from '../../api/admin.api'
import { getRoles } from '../../api/roles.api'

// Superadmin-only screen for creating and managing the other admin accounts.
// Guarded twice: RouteGate hides the route without "roles.view", and the backend
// rejects the request outright unless the caller is a superadmin.
//
// GET /api/admin/admins returns the full list, so paging is client-side.

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function AdminsPage() {
  const { showToast } = useToast()
  const { user, hasPermission } = useAuth()

  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // Roles are documents now, so the picker lists whatever the Roles screen has
  // defined. `roleId` is what gets sent; the fallback below only matters if the
  // roles endpoint is unreachable.
  const [roles, setRoles] = useState([])
  const [roleId, setRoleId] = useState('')
  const [role, setRole] = useState('admin')
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await getAdmins({ search: debouncedSearch })
      setAdmins(res.items)
    } catch (err) {
      setLoadError(err.message)
      setAdmins([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    // Non-blocking: if this fails the form falls back to the two built-in roles
    // rather than leaving the picker empty.
    getRoles()
      .then((res) => setRoles(res.items.filter((r) => r.isActive)))
      .catch(() => setRoles([]))
  }, [])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, pageSize])

  const pages = Math.max(1, Math.ceil(admins.length / pageSize))
  const paged = admins.slice((page - 1) * pageSize, page * pageSize)

  function openCreate() {
    setEditing(null)
    setName(''); setEmail(''); setPassword(''); setRole('admin'); setIsActive(true)
    setRoleId(roles.find((r) => r.slug === 'admin')?.id ?? '')
    setShowPassword(false); setFormError('')
    setFormOpen(true)
  }

  function openEdit(a) {
    setEditing(a)
    setName(a.name)
    setEmail(a.email)
    setPassword('')
    setRole(a.role)
    // Older accounts have no role document — start them on the one matching
    // their tier so saving moves them onto a real role.
    setRoleId(a.roleId || roles.find((r) => r.slug === a.role)?.id || '')
    setIsActive(a.status === 'active')
    setShowPassword(false); setFormError('')
    setFormOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (!name.trim()) return setFormError('Name is required.')
    if (!editing && !email.trim()) return setFormError('Email is required.')
    // On edit, an empty password means "leave it unchanged".
    if (!editing && password.length < 6) {
      return setFormError('Password must be at least 6 characters.')
    }
    if (editing && password && password.length < 6) {
      return setFormError('New password must be at least 6 characters.')
    }

    setSubmitting(true)
    try {
      // Send roleId when the roles list loaded, otherwise the legacy tier string.
      const roleFields = roleId ? { roleId } : { role }
      if (editing) {
        await updateAdminAccount(editing.id, { name, ...roleFields, isActive, password: password || undefined })
        showToast(`${name} updated.`, 'success')
      } else {
        await createAdminAccount({ name, email, password, ...roleFields })
        showToast(`${name} can now sign in.`, 'success')
      }
      setFormOpen(false)
      load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    try {
      await deleteAdminAccount(pendingDelete.id)
      showToast(`${pendingDelete.name} removed.`, 'success')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Admin Users"
        description="Who can sign in to this panel, and what each of them is allowed to do."
        action={
          hasPermission('roles.create') && (
            <Button onClick={openCreate}>
              <Plus size={15} /> Add Admin
            </Button>
          )
        }
      />

      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={15} />
          <input
            type="search"
            autoComplete="off"
            placeholder="Search admins by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="tbl-card">
        <div className="tbl-head">
          <div>
            <p className="tbl-head-title">Admin Accounts</p>
            <p className="tbl-head-sub">
              {admins.length} account{admins.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <TableLoadBar active={loading} />
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Status</th>
                <th className="tbl-right col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoading colSpan={6} />
              ) : loadError ? (
                <TableEmpty colSpan={6} variant="error" message={loadError} onRetry={load} />
              ) : admins.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  variant={debouncedSearch ? 'filtered' : 'empty'}
                  icon={Shield}
                  message={
                    debouncedSearch
                      ? 'No admin matches your search.'
                      : 'No admin accounts found.'
                  }
                />
              ) : (
                paged.map((a) => {
                  const isSelf = a.id === user?.id
                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <span className="avatar-initials">{a.name.slice(0, 2).toUpperCase()}</span>
                          <div>
                            <div className="tbl-strong">
                              {a.name}
                              {isSelf && <span className="badge badge-brand" style={{ marginLeft: 7 }}>You</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--ink-soft)' }}>{a.email}</td>
                      <td>
                        {/* The named role, not the tier — a custom role shows
                            its own name here. */}
                        <span className={`pill ${a.role === 'superadmin' ? 'pill-brand' : 'pill-slate'}`}>
                          {a.role === 'superadmin' ? <ShieldCheck size={11} /> : <Shield size={11} />}
                          {a.roleName}
                        </span>
                      </td>
                      <td className="tbl-meta">{a.date}</td>
                      <td>
                        <span className={`pill ${a.status === 'active' ? 'pill-green' : 'pill-slate'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td>
                        <div className="tbl-actions">
                          {hasPermission('roles.edit') && (
                            <button className="row-action" title="Edit admin" onClick={() => openEdit(a)}>
                              <Pencil size={14} />
                            </button>
                          )}
                          {hasPermission('roles.delete') && (
                            <button
                              className="row-action row-action-red"
                              title={isSelf ? 'You cannot delete your own account' : 'Delete admin'}
                              disabled={isSelf}
                              onClick={() => setPendingDelete(a)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && !loadError && (
          <Pagination
            page={page}
            pages={pages}
            total={admins.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            label="admins"
          />
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'Add Admin'}
        size="sm"
      >
        {/* autoComplete is set deliberately on every field here. This form
            creates an account for *someone else*, but an email + password pair
            looks exactly like a sign-in form to the browser, so Chrome was
            filling the signed-in admin's own saved credentials into it.
            `new-password` is the documented signal that stops a password
            manager offering stored logins, and it also stops the browser
            treating the pair as a login form — which is what was dragging the
            email in alongside it. The `name` attributes avoid `email` /
            `password` so field-name heuristics don't re-trigger either. */}
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {formError && <div className="split-error">{formError}</div>}

          <div className="form-field">
            <label className="form-label form-label-req">Full Name</label>
            <input
              className="form-input"
              type="text"
              required
              autoFocus
              name="adminFullName"
              autoComplete="off"
              placeholder="e.g. Priya Shah"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className={`form-label ${editing ? '' : 'form-label-req'}`}>Email</label>
            <input
              className="form-input"
              type="email"
              required={!editing}
              disabled={!!editing}
              name="adminAccountEmail"
              autoComplete="off"
              spellCheck={false}
              placeholder="name@herbalgujarat.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {editing && <p className="form-hint-msg">Email is the login identifier and cannot be changed.</p>}
          </div>

          <div className="form-field">
            <label className={`form-label ${editing ? '' : 'form-label-req'}`}>
              {editing ? 'New Password' : 'Password'}
            </label>
            <div className="input-group">
              <KeyRound size={15} />
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                required={!editing}
                minLength={6}
                name="adminAccountNewPassword"
                autoComplete="new-password"
                placeholder={editing ? 'Leave blank to keep current' : 'At least 6 characters'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 38 }}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="login-eye-btn"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label form-label-req">Role</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {roles.length > 0
                ? roles.map((r) => (
                    <label key={r.id} className="exec-option" data-selected={roleId === r.id ? 'true' : 'false'}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                        <input
                          type="radio"
                          name="adminRole"
                          value={r.id}
                          checked={roleId === r.id}
                          onChange={() => {
                            setRoleId(r.id)
                            setRole(r.slug === 'superadmin' ? 'superadmin' : 'admin')
                          }}
                          style={{ accentColor: 'var(--brand)', marginTop: 2 }}
                        />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{r.name}</p>
                          <p style={{ fontSize: 11.5, color: 'var(--ink-muted)', lineHeight: 1.45 }}>
                            {r.description ||
                              (r.isFullAccess ? 'Full access to everything' : `${r.permissions.length} permissions`)}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))
                : ADMIN_ROLES.map((r) => (
                    <label key={r.value} className="exec-option" data-selected={role === r.value ? 'true' : 'false'}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                        <input
                          type="radio"
                          name="adminRole"
                          value={r.value}
                          checked={role === r.value}
                          onChange={() => setRole(r.value)}
                          style={{ accentColor: 'var(--brand)', marginTop: 2 }}
                        />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{r.label}</p>
                          <p style={{ fontSize: 11.5, color: 'var(--ink-muted)', lineHeight: 1.45 }}>{r.hint}</p>
                        </div>
                      </div>
                    </label>
                  ))}
            </div>
            <p className="form-hint-msg">
              What each role can open is set on the Roles screen.
            </p>
          </div>

          {editing && editing.id !== user?.id && (
            <label className="check-row">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Account active (can sign in)
            </label>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Admin'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Remove admin?"
        message={`${pendingDelete?.name} (${pendingDelete?.email}) will lose access to this panel immediately.`}
        confirmLabel="Remove"
      />
    </div>
  )
}
