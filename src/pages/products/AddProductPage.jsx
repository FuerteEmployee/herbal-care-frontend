import { useState, useEffect } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/ToastContext'
import { createProduct, getCategories } from '../../api/catalog.api'
import { Sparkles, Plus, Image as ImageIcon, Package } from 'lucide-react'

export default function AddProductPage() {
  const { showToast } = useToast()
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [recentProducts, setRecentProducts] = useState([
    { id: '1', name: 'Herbal Amla Juice', sku: 'HAMLA-500', category: 'Organic Juices', price: 180, mrp: 220, gst: 5, stock: 120 },
    { id: '2', name: 'Neem & Tulsi Face Wash', sku: 'NTFW-100', category: 'Personal Care', price: 125, mrp: 150, gst: 18, stock: 85 },
  ])

  // Form State
  const [name, setName] = useState('')
  const [sapCode, setSapCode] = useState('') // SKU
  const [categoryId, setCategoryId] = useState('')
  const [mrp, setMrp] = useState('')
  const [gst, setGst] = useState('18')
  const [gstMode, setGstMode] = useState('exclusive')
  const [stock, setStock] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    getCategories()
      .then((data) => {
        setCategories(data)
        if (data.length > 0) setCategoryId(data[0].id)
      })
      .catch(() => {
        // Mock categories if backend is offline
        setCategories([
          { id: 'cat-1', name: 'Herbal Oils' },
          { id: 'cat-2', name: 'Wellness Powders' },
          { id: 'cat-3', name: 'Organic Juices' },
          { id: 'cat-4', name: 'Personal Care' },
          { id: 'cat-5', name: 'Hair Care' },
        ])
        setCategoryId('cat-1')
      })
      .finally(() => setLoadingCategories(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name || !sapCode || !mrp || !stock) {
      showToast('Please fill all required fields.', 'error')
      return
    }

    setSubmitting(true)

    const payload = {
      name,
      sapCode,
      categoryId,
      mrp: Number(mrp),
      gst: Number(gst),
      gstMode,
      stock: Number(stock),
      description,
      images: imageUrl ? [imageUrl] : [],
    }

    try {
      const result = await createProduct(payload)
      showToast(`Product "${result.name}" added successfully!`, 'success')
      setRecentProducts((prev) => [
        {
          id: result.id,
          name: result.name,
          sku: result.sapCode,
          category: categories.find((c) => c.id === categoryId)?.name || 'General',
          price: result.price,
          mrp: result.mrp,
          gst: result.gst,
          stock: result.stock,
        },
        ...prev,
      ])
      // Reset form
      setName('')
      setSapCode('')
      setMrp('')
      setStock('')
      setImageUrl('')
      setDescription('')
    } catch (err) {
      console.log('Falling back to local state addition because backend is offline')
      // Simulate success in local state
      const mockResult = {
        id: String(Date.now()),
        name,
        sapCode,
        price: Number(mrp) / (1 + Number(gst) / 100),
        mrp: Number(mrp),
        gst: Number(gst),
        stock: Number(stock),
      }
      showToast(`Product "${mockResult.name}" created (Offline Mock Mode).`, 'success')
      setRecentProducts((prev) => [
        {
          id: mockResult.id,
          name: mockResult.name,
          sku: mockResult.sapCode,
          category: categories.find((c) => c.id === categoryId)?.name || 'General',
          price: Math.round(mockResult.price),
          mrp: mockResult.mrp,
          gst: mockResult.gst,
          stock: mockResult.stock,
        },
        ...prev,
      ])
      // Reset form
      setName('')
      setSapCode('')
      setMrp('')
      setStock('')
      setImageUrl('')
      setDescription('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products Add"
        description="Add a new herbal or organic product to the storefront catalog."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Add Product Form */}
        <div className="card lg:col-span-2" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Package size={17} style={{ color: 'var(--brand)' }} />
            <h3 className="card-title">New Product Details</h3>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Product Name */}
              <div className="form-field">
                <label className="form-label form-label-req">Product Name</label>
                <input
                  className="form-input"
                  type="text"
                  required
                  placeholder="e.g. Pure Aloe Vera Gel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* SKU / SAP Code */}
              <div className="form-field">
                <label className="form-label form-label-req">SKU / Product Code</label>
                <input
                  className="form-input"
                  type="text"
                  required
                  placeholder="e.g. PAV-200"
                  value={sapCode}
                  onChange={(e) => setSapCode(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Category */}
              <div className="form-field">
                <label className="form-label form-label-req">Category</label>
                <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  {loadingCategories ? (
                    <option>Loading categories…</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Stock Quantity */}
              <div className="form-field">
                <label className="form-label form-label-req">Initial Stock</label>
                <input
                  className="form-input"
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 100"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* MRP Price */}
              <div className="form-field">
                <label className="form-label form-label-req">MRP Price (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 299"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                />
              </div>

              {/* GST Percent */}
              <div className="form-field">
                <label className="form-label">GST Tax (%)</label>
                <select className="form-select" value={gst} onChange={(e) => setGst(e.target.value)}>
                  <option value="0">0% (Nil)</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>

              {/* GST Mode */}
              <div className="form-field">
                <label className="form-label">GST Pricing Mode</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 8 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-body)' }}>
                    <input
                      type="radio"
                      name="gstMode"
                      value="exclusive"
                      checked={gstMode === 'exclusive'}
                      onChange={() => setGstMode('exclusive')}
                      style={{ accentColor: 'var(--brand)' }}
                    />
                    Exclusive
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-body)' }}>
                    <input
                      type="radio"
                      name="gstMode"
                      value="inclusive"
                      checked={gstMode === 'inclusive'}
                      onChange={() => setGstMode('inclusive')}
                      style={{ accentColor: 'var(--brand)' }}
                    />
                    Inclusive
                  </label>
                </div>
              </div>
            </div>

            {/* Product Image URL */}
            <div className="form-field">
              <label className="form-label">Image URL (Optional)</label>
              <div className="input-group">
                <ImageIcon size={15} />
                <input
                  className="form-input"
                  type="text"
                  placeholder="https://… or a local path"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-field">
              <label className="form-label">Product Description</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Describe key ingredients, health benefits, usage directions…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
              <Button type="submit" disabled={submitting}>
                <Plus size={15} /> {submitting ? 'Adding…' : 'Add Product'}
              </Button>
            </div>
          </form>
        </div>

        {/* Recently Added Products Side List */}
        <div className="tbl-card" style={{ alignSelf: 'start' }}>
          <div className="tbl-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} style={{ color: 'var(--color-accent-500)' }} />
              <p className="tbl-head-title">Recently Added</p>
            </div>
          </div>
          <div className="tbl-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="tbl-right">MRP</th>
                  <th className="tbl-center">Stock</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="tbl-empty">
                      Nothing added yet this session.
                    </td>
                  </tr>
                ) : (
                  recentProducts.map((prod) => (
                    <tr key={prod.id}>
                      <td>
                        <div className="tbl-strong tbl-clip" style={{ maxWidth: 170 }}>{prod.name}</div>
                        <div className="tbl-sub">
                          {prod.sku} · {prod.category}
                        </div>
                      </td>
                      <td className="tbl-num">
                        ₹{prod.mrp}
                        <div className="tbl-sub" style={{ fontWeight: 400 }}>GST {prod.gst}%</div>
                      </td>
                      <td className="tbl-center">
                        <span className="badge badge-brand">{prod.stock}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
