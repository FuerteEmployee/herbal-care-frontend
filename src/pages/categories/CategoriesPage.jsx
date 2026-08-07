import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Tags, Image as ImageIcon } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import TableEmpty from '../../components/ui/TableEmpty'
import TableLoading, { TableLoadBar } from '../../components/ui/TableLoading'
import Pagination from '../../components/ui/Pagination'
import { useToast } from '../../components/ui/ToastContext'
import { usePermission } from '../../hooks/usePermission'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../api/catalog.api'

// Categories are the one required field on a product, so they need somewhere to
// be created. GET /api/categories is public; create/update/delete are admin-only.
// The endpoint returns the full list unpaginated, so search and paging both
// happen client-side here.

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function CategoriesPage() {
  const { showToast } = useToast()
  const { can } = usePermission()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      setCategories(await getCategories())
    } catch (err) {
      setLoadError(err.message)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setName(''); setDescription(''); setImage(''); setIsActive(true)
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(cat) {
    setEditing(cat)
    setName(cat.name)
    setDescription(cat.description)
    setImage(cat.image)
    setIsActive(cat.isActive)
    setFormError('')
    setFormOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!name.trim()) {
      setFormError('Name is required.')
      return
    }
    setSubmitting(true)
    try {
      if (editing) {
        await updateCategory(editing.id, { name, description, image, isActive })
        showToast(`"${name}" updated.`, 'success')
      } else {
        await createCategory({ name, description, image })
        showToast(`"${name}" created.`, 'success')
      }
      setFormOpen(false)
      load()
    } catch (err) {
      // The name has a unique index — surface that clearly rather than raw 409 text.
      setFormError(
        /already exists|duplicate|E11000/i.test(err.message)
          ? `A category named "${name}" already exists.`
          : err.message,
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    try {
      await deleteCategory(pendingDelete.id)
      showToast(`"${pendingDelete.name}" deleted.`, 'success')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPendingDelete(null)
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return categories
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
    )
  }, [categories, search])

  // Searching or resizing can leave you past the end of the list.
  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  const pages = Math.max(1, Math.ceil(visible.length / pageSize))
  const paged = visible.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Categories"
        description="Product groupings. Every product must belong to one, so create these first."
        action={
          can('categories.create') && (
            <Button onClick={openCreate}>
              <Plus size={15} /> Add Category
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
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="tbl-card">
        <div className="tbl-head">
          <div>
            <p className="tbl-head-title">All Categories</p>
            <p className="tbl-head-sub">
              {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
            </p>
          </div>
        </div>

        <TableLoadBar active={loading} />
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Category</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Status</th>
                <th className="tbl-right col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoading colSpan={5} />
              ) : loadError ? (
                <TableEmpty colSpan={5} variant="error" message={loadError} onRetry={load} />
              ) : visible.length === 0 ? (
                <TableEmpty
                  colSpan={5}
                  variant={search.trim() ? 'filtered' : 'empty'}
                  icon={Tags}
                  message={
                    search.trim()
                      ? 'No category matches your search.'
                      : 'No categories yet — add one so products have somewhere to sit.'
                  }
                />
              ) : (
                paged.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        {c.image ? (
                          <img
                            src={c.image}
                            alt=""
                            className="tbl-thumb"
                            onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
                          />
                        ) : (
                          <span className="tbl-thumb tbl-thumb-empty">
                            <Tags size={15} />
                          </span>
                        )}
                        <div className="tbl-strong">{c.name}</div>
                      </div>
                    </td>
                    <td>
                      <code className="slug-chip">{c.slug || '—'}</code>
                    </td>
                    <td className="tbl-wrap-text" style={{ maxWidth: 320, color: 'var(--ink-soft)', fontSize: 12.5 }}>
                      {c.description || <span style={{ color: 'var(--ink-muted)' }}>—</span>}
                    </td>
                    <td>
                      <span className={`pill ${c.isActive ? 'pill-green' : 'pill-slate'}`}>
                        {c.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div className="tbl-actions">
                        {can('categories.edit') && (
                          <button className="row-action" title="Edit category" onClick={() => openEdit(c)}>
                            <Pencil size={14} />
                          </button>
                        )}
                        {can('categories.delete') && (
                          <button
                            className="row-action row-action-red"
                            title="Delete category"
                            onClick={() => setPendingDelete(c)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {!can('categories.edit') && !can('categories.delete') && (
                          <span className="tbl-meta">View only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && !loadError && (
          <Pagination
            page={page}
            pages={pages}
            total={visible.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            label="categories"
          />
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Category' : 'Add Category'}
        size="sm"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {formError && <div className="split-error">{formError}</div>}

          <div className="form-field">
            <label className="form-label form-label-req">Name</label>
            <input
              className="form-input"
              type="text"
              required
              autoFocus
              placeholder="e.g. Herbal Oils"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="form-hint-msg">The URL slug is generated from this automatically.</p>
          </div>

          <div className="form-field">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="What belongs in this category?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Image URL</label>
            <div className="input-group">
              <ImageIcon size={15} />
              <input
                className="form-input"
                type="text"
                placeholder="https://… or a local path"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
            </div>
          </div>

          {/* Create has no isActive field on the backend — it defaults to true —
              so the toggle only appears when editing. */}
          {editing && (
            <label className="check-row">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Visible on the storefront
            </label>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete category?"
        message={`"${pendingDelete?.name}" will be removed. Products still pointing at it will keep a dangling reference, so reassign them first.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
