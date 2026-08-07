import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, KeyRound, ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import TableEmpty from '../../components/ui/TableEmpty'
import TableLoading, { TableLoadBar } from '../../components/ui/TableLoading'
import { useToast } from '../../components/ui/ToastContext'
import { useAuth } from '../../context/AuthContext'
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissionCatalog,
} from '../../api/roles.api'

// Superadmin-only screen for defining what each role can reach.
//
// Ticking a module's "Show in sidebar" is the same thing as granting
// "<module>.view" — the sidebar filters NAV_ITEMS on exactly that key — so the
// two controls are presented as one row: visibility on the left, the actions
// the role may perform on the right. Untick visibility and the whole row's
// actions go with it, because an action on a screen you cannot open is
// meaningless.
//
// The catalogue of modules comes from GET /api/admin/permissions, so a module
// added on the server shows up here without a change to this file.

// Modules whose routes are currently parked (commented out in App.jsx and
// constants/roles.js). Keep this list in sync with those two files so the
// Add / Edit Role form never offers a section that has no live URL.
const PARKED_MODULES = ['products', 'categories', 'delivery', 'purchase', 'blogs', 'reviews']

const ACTION_LABELS = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  export: 'Export',
  import: 'Import',
  approve: 'Approve',
  print: 'Print',
}

function actionLabel(action) {
  return ACTION_LABELS[action] ?? action.charAt(0).toUpperCase() + action.slice(1)
}

export default function RolesPage() {
  const { showToast } = useToast()
  const { user, hasPermission } = useAuth()

  const [roles, setRoles] = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [catalog, res] = await Promise.all([getPermissionCatalog(), getRoles()])
      // Strip parked modules so they don't appear in the Add / Edit Role form.
      setModules(catalog.filter((m) => !PARKED_MODULES.includes(m.key)))
      setRoles(res.items)
    } catch (err) {
      setLoadError(err.message)
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sidebarModules = useMemo(() => modules.filter((m) => m.sidebar), [modules])
  const otherModules = useMemo(() => modules.filter((m) => !m.sidebar), [modules])

  function openCreate() {
    setEditing(null)
    setName('')
    setDescription('')
    setSelected(new Set())
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(role) {
    setEditing(role)
    setName(role.name)
    setDescription(role.description)
    setSelected(new Set(role.permissions))
    setFormError('')
    setFormOpen(true)
  }

  function toggleAction(moduleKey, action) {
    const key = `${moduleKey}.${action}`
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        // Dropping "view" takes the rest of the module with it — the screen is
        // no longer reachable, so its other actions cannot be used anyway.
        if (action === 'view') {
          Array.from(next).forEach((k) => {
            if (k.startsWith(`${moduleKey}.`)) next.delete(k)
          })
        }
      } else {
        next.add(key)
        // Any action implies being able to open the screen.
        if (action !== 'view') next.add(`${moduleKey}.view`)
      }
      return next
    })
  }

  function toggleModule(module, on) {
    setSelected((prev) => {
      const next = new Set(prev)
      module.actions.forEach((a) => next.delete(`${module.key}.${a}`))
      if (on) next.add(`${module.key}.view`)
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (!name.trim()) return setFormError('Role name is required.')
    const permissions = Array.from(selected)
    if (permissions.length === 0) {
      return setFormError('Give the role at least one section, or it will have nowhere to go after signing in.')
    }

    setSubmitting(true)
    try {
      if (editing) {
        await updateRole(editing.id, {
          // A built-in role keeps its name; only its permissions are editable.
          name: editing.isSystem ? undefined : name.trim(),
          description: description.trim(),
          permissions,
        })
        showToast(`${name.trim()} updated.`, 'success')
      } else {
        await createRole({ name: name.trim(), description: description.trim(), permissions })
        showToast(`${name.trim()} created.`, 'success')
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
      await deleteRole(pendingDelete.id)
      showToast(`${pendingDelete.name} deleted.`, 'success')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPendingDelete(null)
    }
  }

  /** "Products, Orders, +2 more" — what this role actually sees in the rail. */
  function sidebarSummary(role) {
    if (role.isFullAccess) return 'Every section'
    const visible = sidebarModules.filter((m) => role.permissions.includes(`${m.key}.view`))
    if (visible.length === 0) return 'Dashboard only'
    const shown = visible.slice(0, 3).map((m) => m.label)
    return visible.length > 3 ? `${shown.join(', ')} +${visible.length - 3} more` : shown.join(', ')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Roles"
        description="Define what each role can open and do. Ticking a section here is what makes it appear in that role's sidebar."
        action={
          hasPermission('roles.create') && (
            <Button onClick={openCreate}>
              <Plus size={15} /> Add Role
            </Button>
          )
        }
      />

      <div className="tbl-card">
        <div className="tbl-head">
          <div>
            <p className="tbl-head-title">Roles</p>
            <p className="tbl-head-sub">
              {roles.length} role{roles.length === 1 ? '' : 's'} · assigned to admin accounts on the Admin Users screen
            </p>
          </div>
        </div>

        <TableLoadBar active={loading} />
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Role</th>
                <th>Sidebar access</th>
                <th>Permissions</th>
                <th>Admins</th>
                <th className="tbl-right col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoading colSpan={5} />
              ) : loadError ? (
                <TableEmpty colSpan={5} variant="error" message={loadError} onRetry={load} />
              ) : roles.length === 0 ? (
                <TableEmpty colSpan={5} variant="empty" icon={KeyRound} message="No roles defined yet." />
              ) : (
                roles.map((role) => {
                  const isMine = role.id === user?.roleId
                  return (
                    <tr key={role.id}>
                      <td>
                        <div className="tbl-strong" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          {role.isFullAccess ? <ShieldCheck size={13} /> : <KeyRound size={13} />}
                          {role.name}
                          {role.isSystem && <span className="badge badge-slate">Built-in</span>}
                          {isMine && <span className="badge badge-brand">Your role</span>}
                        </div>
                        {role.description && (
                          <div className="tbl-meta" style={{ marginTop: 2 }}>{role.description}</div>
                        )}
                      </td>
                      <td style={{ color: 'var(--ink-soft)' }}>{sidebarSummary(role)}</td>
                      <td>
                        <span className={`pill ${role.isFullAccess ? 'pill-brand' : 'pill-slate'}`}>
                          {role.isFullAccess ? 'Full access' : `${role.permissions.length} granted`}
                        </span>
                      </td>
                      <td className="tbl-meta">{role.adminCount}</td>
                      <td>
                        <div className="tbl-actions">
                          {hasPermission('roles.edit') && (
                            <button
                              className="row-action"
                              title={role.isFullAccess ? 'Super Admin always has full access' : 'Edit role'}
                              disabled={role.isFullAccess}
                              onClick={() => openEdit(role)}
                            >
                              {role.isFullAccess ? <Lock size={14} /> : <Pencil size={14} />}
                            </button>
                          )}
                          {hasPermission('roles.delete') && (
                            <button
                              className="row-action row-action-red"
                              title={role.isSystem ? 'Built-in roles cannot be deleted' : 'Delete role'}
                              disabled={role.isSystem}
                              onClick={() => setPendingDelete(role)}
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
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'Add Role'}
        size="lg"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {formError && <div className="split-error">{formError}</div>}

          <div className="form-field">
            <label className="form-label form-label-req">Role Name</label>
            <input
              className="form-input"
              type="text"
              required
              autoFocus
              disabled={!!editing?.isSystem}
              placeholder="e.g. Store Manager"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {editing?.isSystem && (
              <p className="form-hint-msg">A built-in role keeps its name — its permissions are still editable.</p>
            )}
          </div>

          <div className="form-field">
            <label className="form-label">Description</label>
            <input
              className="form-input"
              type="text"
              placeholder="What this role is for"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Sidebar sections &amp; permissions</label>
            <p className="form-hint-msg" style={{ marginBottom: 10 }}>
              Show a section to put it in this role&apos;s sidebar and let them open it. Hidden sections are also blocked
              server-side, not just hidden from the menu. Dashboard is always available.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sidebarModules.map((module) => {
                const visible = selected.has(`${module.key}.view`)
                return (
                  <div key={module.key} className="exec-option" data-selected={visible ? 'true' : 'false'}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{module.label}</p>
                        {module.description && (
                          <p style={{ fontSize: 11.5, color: 'var(--ink-muted)', lineHeight: 1.45 }}>
                            {module.description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="row-action"
                        title={visible ? 'Hide from sidebar' : 'Show in sidebar'}
                        onClick={() => toggleModule(module, !visible)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          width: 'auto',
                          padding: '5px 10px',
                          flexShrink: 0,
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: visible ? 'var(--brand)' : 'var(--ink-muted)',
                        }}
                      >
                        {visible ? <Eye size={13} /> : <EyeOff size={13} />}
                        {visible ? 'In sidebar' : 'Hidden'}
                      </button>
                    </div>

                    {visible && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 14,
                          marginTop: 10,
                          paddingTop: 10,
                          borderTop: '1px solid var(--line)',
                        }}
                      >
                        {module.actions.map((action) => (
                          <label
                            key={action}
                            className="check-row"
                            style={{ margin: 0, fontSize: 12.5, opacity: action === 'view' ? 0.65 : 1 }}
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(`${module.key}.${action}`)}
                              // "View" is implied by the section being shown, so
                              // it is displayed for completeness but toggled by
                              // the show/hide control instead.
                              disabled={action === 'view'}
                              onChange={() => toggleAction(module.key, action)}
                            />
                            {actionLabel(action)}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {otherModules.length > 0 && (
            <div className="form-field">
              <label className="form-label">Other permissions</label>
              <p className="form-hint-msg" style={{ marginBottom: 10 }}>
                Not sidebar sections of their own — these sit inside other screens.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                {otherModules.flatMap((module) =>
                  module.actions.map((action) => (
                    <label key={`${module.key}.${action}`} className="check-row" style={{ margin: 0, fontSize: 12.5 }}>
                      <input
                        type="checkbox"
                        checked={selected.has(`${module.key}.${action}`)}
                        onChange={() => toggleAction(module.key, action)}
                      />
                      {module.label} · {actionLabel(action)}
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete role?"
        message={`${pendingDelete?.name} will be removed. Any admin still on it must be moved to another role first.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
