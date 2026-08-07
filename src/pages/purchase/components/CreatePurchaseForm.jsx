import { useEffect, useState } from 'react'
import Button from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/ToastContext'
import PurchaseOrderFormBody, { emptyPurchaseItem } from './PurchaseOrderFormBody'
import { getSuppliers } from '../../../api/suppliers.api'
import { getProducts } from '../../../api/catalog.api'
import { createPurchaseOrder } from '../../../api/purchase.api'

export default function CreatePurchaseForm({ onSuccess, inDrawer = false }) {
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [supplierId, setSupplierId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [items, setItems] = useState([emptyPurchaseItem()])
  const [interState, setInterState] = useState(false)
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    getSuppliers().then(setSuppliers)
    getProducts().then(setProducts)
  }, [])

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }))
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.name} (${p.skuCode || p.sapCode})`, price: p.price }))

  function resetForm() {
    setSupplierId('')
    setWarehouseId('')
    setItems([emptyPurchaseItem()])
    setInterState(false)
    setExpectedDeliveryDate('')
    setNotes('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!supplierId) {
      showToast('Select a supplier', 'error')
      return
    }
    if (!warehouseId) {
      showToast('Select a warehouse', 'error')
      return
    }
    const validItems = items
      .filter((item) => item.productId && Number(item.qty) > 0 && Number(item.price) >= 0)
      .map((item) => ({
        productId: item.productId,
        qty: Number(item.qty),
        price: Number(item.price),
        gstPercent: Number(item.gstPercent) || 0,
        gsm: item.gsm || undefined,
        pageCount: item.pageCount ? Number(item.pageCount) : undefined,
        paperSize: item.paperSize || undefined,
        color: item.color || undefined,
      }))

    if (validItems.length === 0) {
      showToast('Add at least one valid line item', 'error')
      return
    }

    setSubmitting(true)
    try {
      const po = await createPurchaseOrder({ supplierId, warehouseId, items: validItems, interState, expectedDeliveryDate, notes })
      showToast(`Purchase order ${po.poNumber} created`, 'success')
      resetForm()
      onSuccess?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={inDrawer ? 'space-y-5' : 'max-w-2xl space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm'}>
      <PurchaseOrderFormBody
        supplierId={supplierId}
        onSupplierChange={setSupplierId}
        warehouseId={warehouseId}
        onWarehouseChange={setWarehouseId}
        items={items}
        onItemsChange={setItems}
        supplierOptions={supplierOptions}
        productOptions={productOptions}
        interState={interState}
        onInterStateChange={setInterState}
        expectedDeliveryDate={expectedDeliveryDate}
        onExpectedDeliveryDateChange={setExpectedDeliveryDate}
        notes={notes}
        onNotesChange={setNotes}
      />

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Creating...' : 'Create Purchase Invoice'}
      </Button>
    </form>
  )
}
