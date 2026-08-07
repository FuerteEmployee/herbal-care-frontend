import { useEffect, useState } from 'react'
import { Star, Info } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { createReviewAsAdmin } from '../../api/reviews.api'
import { getCustomerOptions } from '../../api/admin.api'
import { getProducts } from '../../api/catalog.api'

// A review is always attributed to a registered customer (Review.user is
// required, and (user, product) is uniquely indexed), so this form makes the
// customer an explicit choice rather than pretending an admin can author one.

function RatingPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value

  return (
    <div className="rating-picker" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          aria-pressed={value === n}
          className={n <= shown ? 'rating-star rating-star-on' : 'rating-star'}
        >
          <Star size={22} fill={n <= shown ? 'currentColor' : 'none'} />
        </button>
      ))}
      <span className="rating-picker-value">{value ? `${value} / 5` : 'Pick a rating'}</span>
    </div>
  )
}

export default function AddReviewModal({ open, onClose, onSaved }) {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [refsLoading, setRefsLoading] = useState(true)
  const [refsError, setRefsError] = useState('')

  const [userId, setUserId] = useState('')
  const [productId, setProductId] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Reset the form each time the dialog opens, and load the pickers.
  useEffect(() => {
    if (!open) return

    setUserId('')
    setProductId('')
    setRating(5)
    setComment('')
    setError('')
    setRefsLoading(true)
    setRefsError('')

    let cancelled = false
    // 200 as before — the server now caps one request at 100, so this pages.
    Promise.all([getCustomerOptions({ max: 200 }), getProducts()])
      .then(([customerList, productList]) => {
        if (cancelled) return
        setCustomers(customerList ?? [])
        setProducts(productList ?? [])
      })
      .catch((err) => {
        if (!cancelled) setRefsError(err.message)
      })
      .finally(() => {
        if (!cancelled) setRefsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!userId || !productId || !rating) {
      setError('Pick a customer, a product and a rating.')
      return
    }

    setSubmitting(true)
    try {
      const res = await createReviewAsAdmin({ userId, productId, rating, comment })
      onSaved(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const noCustomers = !refsLoading && !refsError && customers.length === 0
  const noProducts = !refsLoading && !refsError && products.length === 0
  const blocked = noCustomers || noProducts

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Review"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-review-form"
            disabled={submitting || refsLoading || blocked}
          >
            {submitting ? 'Saving…' : 'Add Review'}
          </Button>
        </>
      }
    >
      <form
        id="add-review-form"
        onSubmit={handleSubmit}
        autoComplete="off"
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {error && <div className="split-error">{error}</div>}
        {refsError && <div className="split-error">Could not load customers or products: {refsError}</div>}

        {blocked && (
          <div className="notice-warn">
            <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              {noCustomers && noProducts
                ? 'You need at least one registered customer and one product before a review can exist.'
                : noCustomers
                  ? 'No registered customers yet. A review has to belong to a customer account.'
                  : 'No products yet. Add a product first, then it can be reviewed.'}
            </span>
          </div>
        )}

        <div className="form-field">
          <label className="form-label form-label-req">Customer</label>
          <select
            className="form-select"
            required
            disabled={refsLoading || noCustomers}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">{refsLoading ? 'Loading customers…' : 'Select a customer…'}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.email ? ` — ${c.email}` : ''}
              </option>
            ))}
          </select>
          <p className="form-hint-msg">
            The review is posted in this customer’s name, exactly as if they had left it themselves.
          </p>
        </div>

        <div className="form-field">
          <label className="form-label form-label-req">Product</label>
          <select
            className="form-select"
            required
            disabled={refsLoading || noProducts}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">{refsLoading ? 'Loading products…' : 'Select a product…'}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label form-label-req">Rating</label>
          <RatingPicker value={rating} onChange={setRating} />
        </div>

        <div className="form-field">
          <label className="form-label">Comment</label>
          <textarea
            className="form-textarea"
            rows={4}
            placeholder="What did the customer say about this product?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <p className="form-hint-msg">Optional — a rating on its own is valid.</p>
        </div>

        <div className="form-note">
          <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            One review per customer per product. Choosing a pair that already has a review will
            update it rather than add a second, and the product’s average rating is recalculated
            either way.
          </span>
        </div>
      </form>
    </Modal>
  )
}
