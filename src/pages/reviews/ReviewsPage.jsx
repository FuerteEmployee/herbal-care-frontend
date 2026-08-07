import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trash2, MessageSquare, Star, Search, Plus } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import AddReviewModal from './AddReviewModal'
import TableEmpty from '../../components/ui/TableEmpty'
import TableLoading, { TableLoadBar } from '../../components/ui/TableLoading'
import Pagination from '../../components/ui/Pagination'
import { useToast } from '../../components/ui/ToastContext'
import { getAllReviews, deleteReview } from '../../api/reviews.api'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function ReviewsPage() {
  const { showToast } = useToast()

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState('') // '', '1', '2', '3', '4', '5'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [pendingDelete, setPendingDelete] = useState(null)
  const [addOpen, setAddOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await getAllReviews()
      setReviews(data)
    } catch (err) {
      setLoadError(err.message)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setPage(1)
  }, [search, ratingFilter, pageSize])

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteReview(pendingDelete.id)
      showToast('Review deleted successfully, and product rating recalculated.', 'success')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPendingDelete(null)
    }
  }

  // Filter reviews client-side (backend returns all reviews for moderation)
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch =
        r.comment.toLowerCase().includes(search.toLowerCase()) ||
        r.product.name.toLowerCase().includes(search.toLowerCase()) ||
        r.user.name.toLowerCase().includes(search.toLowerCase()) ||
        r.user.email.toLowerCase().includes(search.toLowerCase())

      const matchesRating = ratingFilter === '' || r.rating === Number(ratingFilter)

      return matchesSearch && matchesRating
    })
  }, [reviews, search, ratingFilter])

  const pagedReviews = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredReviews.slice(start, start + pageSize)
  }, [filteredReviews, page, pageSize])

  const pages = Math.max(1, Math.ceil(filteredReviews.length / pageSize))

  // Metrics
  const metrics = useMemo(() => {
    if (reviews.length === 0) {
      return { avg: 0, total: 0, bad: 0, excellent: 0 }
    }
    const total = reviews.length
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    const avg = Math.round((sum / total) * 10) / 10
    const bad = reviews.filter((r) => r.rating <= 2).length
    const excellent = reviews.filter((r) => r.rating === 5).length
    return { avg, total, bad, excellent }
  }, [reviews])

  function renderStars(rating) {
    return (
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            style={{
              fontSize: 16,
              color: i < rating ? '#f59e0b' : '#cbd5e1', // Amber-500 vs Slate-300
              lineHeight: 1,
            }}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="User Reviews"
        description="Monitor, moderate, and remove customer reviews from the storefront. Ratings are automatically re-calculated on removal."
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={15} /> Add Review
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="tbl-card p-5 flex items-center justify-between">
          <div>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-muted)' }}>TOTAL REVIEWS</p>
            <h3 style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 0', color: 'var(--ink)' }}>{metrics.total}</h3>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <MessageSquare size={18} />
          </span>
        </div>

        <div className="tbl-card p-5 flex items-center justify-between">
          <div>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-muted)' }}>AVERAGE RATING</p>
            <h3 style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 0', color: 'var(--ink)' }}>{metrics.avg} / 5</h3>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <Star size={18} fill="#f59e0b" stroke="#f59e0b" />
          </span>
        </div>

        <div className="tbl-card p-5 flex items-center justify-between">
          <div>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-muted)' }}>EXCELLENT (5★)</p>
            <h3 style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 0', color: 'var(--ink)' }}>{metrics.excellent}</h3>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
            <Star size={18} fill="#16a34a" stroke="#16a34a" />
          </span>
        </div>

        <div className="tbl-card p-5 flex items-center justify-between">
          <div>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-muted)' }}>CRITICAL (1-2★)</p>
            <h3 style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 0', color: 'var(--ink)' }}>{metrics.bad}</h3>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Star size={18} fill="#dc2626" stroke="#dc2626" />
          </span>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={15} />
          <input
            type="search"
            autoComplete="off"
            placeholder="Search comment, product, user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <select
            className="form-input"
            style={{ width: 140, height: 38 }}
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      <div className="tbl-card">
        <div className="tbl-head">
          <div>
            <p className="tbl-head-title">Reviews List</p>
            <p className="tbl-head-sub">
              Showing {filteredReviews.length} of {reviews.length} user reviews
            </p>
          </div>
        </div>

        <TableLoadBar active={loading} />
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th className="tbl-right col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && reviews.length === 0 ? (
                <TableLoading colSpan={6} />
              ) : loadError ? (
                <TableEmpty colSpan={6} variant="error" message={loadError} onRetry={load} />
              ) : filteredReviews.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  variant={search.trim() || ratingFilter ? 'filtered' : 'empty'}
                  icon={MessageSquare}
                  message={
                    search.trim() || ratingFilter
                      ? 'No reviews match your filters.'
                      : 'No reviews found on storefront yet.'
                  }
                />
              ) : (
                pagedReviews.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        {r.product.image ? (
                          <img
                            src={r.product.image}
                            alt=""
                            className="tbl-thumb"
                            onError={(e) => {
                              e.currentTarget.style.visibility = 'hidden'
                            }}
                          />
                        ) : (
                          <span className="tbl-thumb tbl-thumb-empty">
                            <Star size={15} />
                          </span>
                        )}
                        <div className="tbl-strong" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.product.name}>
                          {r.product.name}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>
                        <div className="tbl-strong">{r.user.name}</div>
                        <div style={{ color: 'var(--ink-muted)', fontSize: 11 }}>{r.user.email}</div>
                      </div>
                    </td>
                    <td>{renderStars(r.rating)}</td>
                    <td className="tbl-wrap-text" style={{ maxWidth: 300, fontSize: 12.5, color: 'var(--ink-soft)' }}>
                      {r.comment || <span style={{ color: 'var(--ink-muted)', fontStyle: 'italic' }}>No comment left</span>}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{r.date}</td>
                    <td>
                      <div className="tbl-actions">
                        <button
                          className="row-action row-action-red"
                          title="Delete review"
                          onClick={() => setPendingDelete(r)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="p-4 border-t border-slate-200">
            <Pagination
              page={page}
              pages={pages}
              onChange={setPage}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={setPageSize}
              total={filteredReviews.length}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete Review?"
        message={`Are you sure you want to delete this ${pendingDelete?.rating}★ review from "${pendingDelete?.user.name}"? This will permanently delete it and cannot be undone.`}
      />

      <AddReviewModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={({ created, message }) => {
          setAddOpen(false)
          showToast(message || (created ? 'Review added.' : 'Review updated.'), 'success')
          // Reload rather than prepend: an update to an existing review changes a
          // row already in the list, and the product's average has moved too.
          load()
        }}
      />
    </div>
  )
}
