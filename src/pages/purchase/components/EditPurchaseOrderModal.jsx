import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/ToastContext'
import PurchaseOrderFormBody, { emptyPurchaseItem } from './PurchaseOrderFormBody'
import { getSuppliers } from '../../../api/suppliers.api'
import { getProducts } from '../../../api/catalog.api'
import { updatePurchaseOrder } from '../../../api/purchase.api'

export default function EditPurchaseOrderModal({ open, onClose, order, onSaved }) {
  const { showToast } = useToast()
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [supplierId, setSupplierId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [items, setItems] = useState([emptyPurchaseItem()])
  const [interState, setInterState] = useState(false)
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    getSuppliers().then(setSuppliers)
    getProducts().then(setProducts)
  }, [open])

  useEffect(() => {
    if (!open || !order) return
    setSupplierId(order.supplierId ?? '')
    setWarehouseId(order.warehouseId ?? '')
    setItems(
      order.items?.length
        ? order.items.map((i) => ({
            productId: i.productId,
            qty: String(i.qty),
            price: String(i.price),
            gstPercent: String(i.gstPercent ?? ''),
            gsm: i.gsm ?? '',
            pageCount: i.pageCount ? String(i.pageCount) : '',
            paperSize: i.paperSize ?? '',
            color: i.color ?? '',
          }))
        : [emptyPurchaseItem()]
    )
    setInterState(!!order.interState)
    setExpectedDeliveryDate(order.expectedDeliveryDate ?? '')
    setNotes(order.notes ?? '')
  }, [open, order])

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }))
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.name} (${p.skuCode || p.sapCode})`, price: p.price }))

  async function handleSave() {
    if (!supplierId) {
      showToast('Select a supplier', 'error')
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

    setSaving(true)
    try {
      await updatePurchaseOrder(order.id, { supplierId, warehouseId, items: validItems, interState, expectedDeliveryDate, notes })
      showToast('Purchase order updated', 'success')
      onSaved?.()
      onClose()
    } catch (err) {
      showToast(err.message || 'Failed to update purchase order', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!order) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit ${order.poNumber}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </>
      }
    >
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
    </Modal>
  )
}
