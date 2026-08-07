import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { SelectField, TextField, TextAreaField } from '../../../components/ui/FormField'
import { useToast } from '../../../components/ui/ToastContext'
import { getPurchaseOrders } from '../../../api/purchase.api'
import { createSupplierInvoice } from '../../../api/supplierInvoices.api'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

// Invoice line items always mirror the referenced purchase order — a vendor
// invoice bills what was ordered, so items are derived, not re-entered.
export default function CreateSupplierInvoiceModal({ open, onClose, onCreated }) {
  const { showToast } = useToast()
  const [orders, setOrders] = useState([])
  const [purchaseOrderId, setPurchaseOrderId] = useState('')
  const [paymentDueDate, setPaymentDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    getPurchaseOrders().then(setOrders)
    setPurchaseOrderId('')
    setPaymentDueDate('')
    setNotes('')
  }, [open])

  const selectedOrder = orders.find((o) => o.id === purchaseOrderId)
  const orderOptions = orders.map((o) => ({ value: o.id, label: `${o.poNumber} — ${o.supplier?.name ?? 'Unknown supplier'}` }))

  async function handleSave() {
    if (!selectedOrder) {
      showToast('Select a purchase order', 'error')
      return
    }
    setSaving(true)
    try {
      const invoice = await createSupplierInvoice({
        purchaseOrderId: selectedOrder.id,
        supplierId: selectedOrder.supplierId,
        items: selectedOrder.items,
        interState: selectedOrder.interState,
        paymentDueDate,
        notes,
      })
      showToast(`Invoice ${invoice.invoiceNumber} created`, 'success')
      onCreated?.()
      onClose()
    } catch (err) {
      showToast(err.message || 'Failed to create supplier invoice', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Supplier Invoice"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !selectedOrder}>
            {saving ? 'Creating...' : 'Create Invoice'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SelectField label="Purchase Order" required options={orderOptions} value={purchaseOrderId} onChange={(e) => setPurchaseOrderId(e.target.value)} />

        {selectedOrder && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm">
            <div className="mb-2 font-medium text-slate-700">{selectedOrder.items.length} item(s) from {selectedOrder.poNumber}</div>
            <ul className="space-y-1 text-slate-600">
              {selectedOrder.items.map((item, i) => (
                <li key={i} className="flex justify-between">
                  <span>{item.name} × {item.qty}</span>
                  <span className="tabular-nums">{currency.format(item.qty * item.price)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
              <span>Grand Total</span>
              <span className="tabular-nums">{currency.format(selectedOrder.grandTotal ?? selectedOrder.total)}</span>
            </div>
          </div>
        )}

        <TextField label="Payment Due Date" type="date" value={paymentDueDate} onChange={(e) => setPaymentDueDate(e.target.value)} />
        <TextAreaField label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Modal>
  )
}
