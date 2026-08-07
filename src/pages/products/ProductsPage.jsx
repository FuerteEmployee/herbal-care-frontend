import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Filter, Pencil, Trash2, Package, Star } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Drawer from '../../components/ui/Drawer'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import TableEmpty from '../../components/ui/TableEmpty'
import TableLoading, { TableLoadBar } from '../../components/ui/TableLoading'
import Pagination from '../../components/ui/Pagination'
import { useToast } from '../../components/ui/ToastContext'
import { usePermission } from '../../hooks/usePermission'
import ProductForm from './ProductForm'
import {
  getProductsPage,
  getCategories,
  deleteProduct,
} from '../../api/catalog.api'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function stockPill(state) {
  if (state === 'out_of_stock') return { cls: 'pill-red', label: 'Out of stock' }
  if (state === 'low_stock') return { cls: 'pill-amber', label: 'Low stock' }
  return { cls: 'pill-green', label: 'In stock' }
}

export default function ProductsPage() {
  const { showToast } = useToast()
  const { can } = usePermission()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // The list is the screen; the form is opened deliberately. `editing` holds the
  // product being changed, or null for a new one.
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  // Keep typing responsive but only hit the server once the user pauses.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, categoryFilter, pageSize])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await getProductsPage({
        page,
        limit: pageSize,
        search: debouncedSearch,
        category: categoryFilter,
      })
      setProducts(res.items)
      setTotal(res.total)
      setPages(res.pages)
    } catch (err) {
      setLoadError(err.message)
      setProducts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, categoryFilter, pageSize])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  async function handleDelete() {
    if (!pendingDelete) return
    try {
      await deleteProduct(pendingDelete.id)
      showToast(`"${pendingDelete.name}" deleted.`, 'success')
      // Stepping back a page avoids landing on an empty final page after
      // deleting its only row.
      if (products.length === 1 && page > 1) setPage((p) => p - 1)
      else load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPendingDelete(null)
    }
  }


  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        description="Your storefront catalogue — every herbal and organic product on sale."
        action={
          // Hidden, not disabled: a role without the permission should not see
          // an action it can never take. The API rejects it either way.
          can('products.create') && (
            <Button
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus size={15} /> Add Product
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} style={{ color: 'var(--ink-muted)' }} />
          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-search">
          <Search size={15} />
          <input
            type="search"
            autoComplete="off"
            placeholder="Search products by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Product list */}
      <div className="tbl-card">
        <div className="tbl-head">
          <div>
            <p className="tbl-head-title">Catalogue</p>
            <p className="tbl-head-sub">
              {total} product{total === 1 ? '' : 's'} total
            </p>
          </div>
        </div>

        <TableLoadBar active={loading} />
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Description</th>
                <th className="tbl-right">Price</th>
                {/* Stock and Status carry short values — pin them narrow so the
                    space goes to Product and Description instead. */}
                <th className="tbl-center col-tight">Stock</th>
                <th className="col-tight">Status</th>
                <th className="tbl-right col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoading colSpan={7} />
              ) : loadError ? (
                <TableEmpty colSpan={7} variant="error" message={loadError} onRetry={load} />
              ) : products.length === 0 ? (
                <TableEmpty
                  colSpan={7}
                  variant={debouncedSearch || categoryFilter ? 'filtered' : 'empty'}
                  icon={Package}
                  message={
                    debouncedSearch || categoryFilter
                      ? 'No product matches these filters. Try clearing the search or category.'
                      : 'Your catalogue is empty — add your first product to get started.'
                  }
                />
              ) : (
                products.map((p) => {
                  const pill = stockPill(p.stockState)
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          {p.images[0] ? (
                            <img
                              src={p.images[0]}
                              alt=""
                              className="tbl-thumb"
                              onError={(e) => {
                                e.currentTarget.style.visibility = 'hidden'
                              }}
                            />
                          ) : (
                            <span className="tbl-thumb tbl-thumb-empty">
                              <Package size={15} />
                            </span>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div className="tbl-strong tbl-clip" style={{ maxWidth: 240 }}>
                              {p.name}
                              {p.isFeatured && (
                                <Star
                                  size={11}
                                  fill="currentColor"
                                  style={{ marginLeft: 5, color: 'var(--color-accent-500)', display: 'inline' }}
                                />
                              )}
                            </div>
                            <div className="tbl-sub">
                              {p.unit}
                              {p.numReviews > 0 && ` · ${p.ratings}★ (${p.numReviews})`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {p.categoryName ? (
                          <span className="pill pill-slate">{p.categoryName}</span>
                        ) : (
                          <span style={{ color: 'var(--ink-muted)' }}>—</span>
                        )}
                      </td>
                      {/* Short description if there is one, otherwise fall back
                          to the long one so the column is rarely empty. */}
                      <td className="tbl-desc">
                        {p.shortDescription || p.description ? (
                          <span title={p.shortDescription || p.description}>
                            {p.shortDescription || p.description}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--ink-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="tbl-num">
                        {currency.format(p.effectivePrice)}
                        {p.discountPrice ? (
                          <div
                            className="tbl-sub"
                            style={{ fontWeight: 400, textDecoration: 'line-through' }}
                          >
                            {currency.format(p.price)}
                          </div>
                        ) : null}
                      </td>
                      <td className="tbl-center col-tight" style={{ fontWeight: 600 }}>
                        {p.stock}
                      </td>
                      <td className="col-tight">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          <span className={`pill ${pill.cls}`}>{pill.label}</span>
                          {!p.isActive && <span className="pill pill-slate">Hidden</span>}
                        </div>
                      </td>
                      <td>
                        <div className="tbl-actions">
                          {can('products.edit') && (
                            <button
                              className="row-action"
                              title="Edit product"
                              onClick={() => {
                                setEditing(p)
                                setFormOpen(true)
                              }}
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {can('products.delete') && (
                            <button
                              className="row-action row-action-red"
                              title="Delete product"
                              onClick={() => setPendingDelete(p)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          {!can('products.edit') && !can('products.delete') && (
                            <span className="tbl-meta">View only</span>
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
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            label="products"
          />
        )}
      </div>

      {/* Add / edit form — opened from the list, never the landing view. */}
      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Product' : 'Add Product'}
        subtitle={editing ? editing.name : 'Add a new item to the storefront catalogue.'}
        size="lg"
      >
        <ProductForm
          key={editing?.id ?? 'new'}
          product={editing}
          categories={categories}
          onCancel={() => setFormOpen(false)}
          onSaved={(msg) => {
            setFormOpen(false)
            showToast(msg, 'success')
            load()
          }}
        />
      </Drawer>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete product?"
        message={`"${pendingDelete?.name}" will be permanently removed from the catalogue. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
