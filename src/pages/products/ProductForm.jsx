import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Image as ImageIcon, Info, X, Upload } from 'lucide-react'
import Button from '../../components/ui/Button'
import { createProduct, updateProduct, PRODUCT_UNITS } from '../../api/catalog.api'

// Mirrors the server's multer limits (src/middleware/upload.middleware.js), so
// an oversized file is caught before it is uploaded rather than after.
const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_FILES = 6

// Only fields the backend's Product schema can actually store are collected
// here. SKU / HSN / MRP-vs-selling / GST% / GST mode are deliberately absent —
// src/models/Product.js has no columns for them, so a form field would silently
// discard whatever was typed. They need a schema change first.

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export default function ProductForm({ product, categories, onCancel, onSaved }) {
  const isEdit = !!product

  const [name, setName] = useState(product?.name ?? '')
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '')
  const [price, setPrice] = useState(product?.price ?? '')
  const [discountPrice, setDiscountPrice] = useState(product?.discountPrice ?? '')
  const [unit, setUnit] = useState(product?.unit ?? 'piece')
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [images, setImages] = useState(product?.images ?? [])
  const [imageDraft, setImageDraft] = useState('')
  const [tagsText, setTagsText] = useState((product?.tags ?? []).join(', '))
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false)
  const [isActive, setIsActive] = useState(product?.isActive ?? true)

  // Files staged for upload: { file, previewUrl }. Nothing leaves the browser
  // until Save, at which point they are sent with the product in one request.
  const [files, setFiles] = useState([])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Object URLs are a leak if not revoked; release them when the form unmounts.
  useEffect(
    () => () => files.forEach((f) => URL.revokeObjectURL(f.previewUrl)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  function addImage() {
    const url = imageDraft.trim()
    if (!url) return
    setImages((prev) => [...prev, url])
    setImageDraft('')
  }

  function addFiles(fileList) {
    const picked = Array.from(fileList ?? [])
    if (picked.length === 0) return

    const room = MAX_FILES - (files.length + images.length)
    if (room <= 0) {
      setError(`A product can have at most ${MAX_FILES} photos.`)
      return
    }

    const tooBig = picked.filter((f) => f.size > MAX_FILE_BYTES).map((f) => f.name)
    const accepted = picked
      .filter((f) => f.size <= MAX_FILE_BYTES)
      .slice(0, room)
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))

    setError(
      tooBig.length
        ? `Skipped (over ${MAX_FILE_BYTES / 1024 / 1024} MB): ${tooBig.join(', ')}`
        : picked.length > room
          ? `Only ${room} more photo${room === 1 ? '' : 's'} can be added.`
          : '',
    )
    if (accepted.length) setFiles((prev) => [...prev, ...accepted])
  }

  function removeFile(index) {
    setFiles((prev) => {
      const target = prev[index]
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !categoryId || price === '' || price == null) {
      setError('Name, category and price are required.')
      return
    }
    if (discountPrice !== '' && Number(discountPrice) > Number(price)) {
      setError('Discount price cannot be higher than the price.')
      return
    }

    const payload = {
      name,
      categoryId,
      price,
      discountPrice,
      // Not user-editable — preserve on edit, start at 0 on create.
      stock: product?.stock ?? 0,
      unit,
      shortDescription,
      description,
      images,
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      isFeatured,
      isActive,
    }

    // Staged files go out with the record; the server uploads them to
    // Cloudinary and appends the URLs to `images`.
    const pickedFiles = files.map((f) => f.file)

    setSubmitting(true)
    try {
      if (isEdit) {
        await updateProduct(product.id, payload, pickedFiles)
        onSaved(`"${name}" updated.`)
      } else {
        await createProduct(payload, pickedFiles)
        onSaved(`"${name}" added to the catalogue.`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const effective = discountPrice !== '' && discountPrice != null ? Number(discountPrice) : Number(price) || 0

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {error && <div className="split-error">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="form-field sm:col-span-2">
          <label className="form-label form-label-req">Product Name</label>
          <input
            className="form-input"
            type="text"
            required
            placeholder="e.g. Pure Aloe Vera Gel 200ml"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-field">
          <div className="field-label-row">
            <label className="form-label form-label-req">Category</label>
            {/* Categories live on their own screen — link there rather than
                leaving the admin stuck at a select with nothing in it. */}
            <Link to="/admin/categories" className="field-manage-link">Manage categories →</Link>
          </div>
          <select className="form-select" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="form-hint-msg">
              No categories yet — add one on the Categories screen, then come back.
            </p>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">Unit</label>
          <select className="form-select" value={unit} onChange={(e) => setUnit(e.target.value)}>
            {PRODUCT_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="form-field">
          <label className="form-label form-label-req">Price (₹)</label>
          <input
            className="form-input"
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="299"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Discount Price (₹)</label>
          <input
            className="form-input"
            type="number"
            min="0"
            step="0.01"
            placeholder="Optional"
            value={discountPrice ?? ''}
            onChange={(e) => setDiscountPrice(e.target.value)}
          />
          <p className="form-hint-msg">Customers pay {currency.format(effective)}</p>
        </div>
      </div>

      {/* Stock is not entered by hand. On create it starts at 0; after that the
          order flow moves it — placing an order decrements, cancelling one puts
          it back. Existing stock is shown read-only so the number is visible
          without inviting an edit that the next order would overwrite. */}
      {isEdit && (
        <div className="stock-readout">
          <span className="stock-readout-label">Current stock</span>
          <span className="stock-readout-value">
            {product.stock} <em>{product.unit}</em>
          </span>
          <span className="stock-readout-note">Adjusted automatically by orders</span>
        </div>
      )}

      <div className="form-field">
        <label className="form-label">Short Description</label>
        <input
          className="form-input"
          type="text"
          placeholder="One line shown on product cards"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label className="form-label">Full Description</label>
        <textarea
          className="form-textarea"
          rows={4}
          placeholder="Key ingredients, health benefits, usage directions…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Photos. Files chosen here are sent with the product in one request —
          the server uploads them to Cloudinary and saves the URLs it gets back,
          so nothing is uploaded until you press Save. Pasting a URL still works
          for images already hosted elsewhere. */}
      <div className="form-field">
        <label className="form-label">Photos</label>

        <label className="dropzone">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            multiple
            onChange={(e) => {
              addFiles(e.target.files)
              // Clear the input so re-picking the same file still fires change.
              e.target.value = ''
            }}
          />
          <Upload size={18} />
          <span className="dropzone-title">Choose images</span>
          <span className="dropzone-hint">JPG, PNG, WEBP, GIF or AVIF · up to 5 MB each · max 6</span>
        </label>

        {/* Pending files — not uploaded yet. */}
        {files.length > 0 && (
          <div className="image-grid">
            {files.map((f, i) => (
              <span key={`${f.name}-${i}`} className="image-chip image-chip-pending">
                <img src={f.previewUrl} alt="" />
                <span className="image-chip-url" title={f.file.name}>{f.file.name}</span>
                <button type="button" onClick={() => removeFile(i)} aria-label={`Remove ${f.file.name}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Already-saved photos. Removing one here deletes it from Cloudinary
            when you save. */}
        {images.length > 0 && (
          <div className="image-grid">
            {images.map((url, i) => (
              <span key={`${url}-${i}`} className="image-chip">
                <img src={url} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
                <span className="image-chip-url" title={url}>{url.split('/').pop()}</span>
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label="Remove image"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <details className="url-fallback">
          <summary>Or add an image by URL</summary>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <ImageIcon size={15} />
              <input
                className="form-input"
                type="text"
                placeholder="https://…"
                value={imageDraft}
                onChange={(e) => setImageDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addImage()
                  }
                }}
              />
            </div>
            <Button type="button" variant="secondary" onClick={addImage}>
              <Plus size={14} /> Add
            </Button>
          </div>
        </details>
      </div>

      <div className="form-field">
        <label className="form-label">Tags</label>
        <input
          className="form-input"
          type="text"
          placeholder="ayurvedic, immunity, organic"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
        />
        <p className="form-hint-msg">Comma separated.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        <label className="check-row">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Feature on the homepage
        </label>
        <label className="check-row">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Visible on the storefront
        </label>
      </div>

      <div className="form-note">
        <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          SKU, HSN code and GST rate aren’t here yet — the backend’s product schema has no fields for
          them, so anything entered would be dropped on save.
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 2 }}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting
            ? files.length
              ? `Uploading ${files.length} photo${files.length === 1 ? '' : 's'}…`
              : 'Saving…'
            : isEdit
              ? 'Save Changes'
              : 'Add Product'}
        </Button>
      </div>
    </form>
  )
}
