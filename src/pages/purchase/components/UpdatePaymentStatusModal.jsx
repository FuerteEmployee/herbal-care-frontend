import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { SelectField, TextField } from '../../../components/ui/FormField'
import { useToast } from '../../../components/ui/ToastContext'
import { updatePaymentStatus } from '../../../api/supplierInvoices.api'
import { PAYMENT_STATUS_OPTIONS } from '../supplierInvoices.schema'

export default function UpdatePaymentStatusModal({ open, onClose, invoice, onSaved }) {
  const { showToast } = useToast()
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [amountPaid, setAmountPaid] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !invoice) return
    setPaymentStatus(invoice.paymentStatus ?? 'pending')
    setAmountPaid(String(invoice.amountPaid ?? 0))
  }, [open, invoice])

  if (!invoice) return null

  async function handleSave() {
    setSaving(true)
    try {
      await updatePaymentStatus(invoice.id, paymentStatus, Number(amountPaid) || 0)
      showToast('Payment status updated', 'success')
      onSaved?.()
      onClose()
    } catch (err) {
      showToast(err.message || 'Failed to update payment status', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Update Payment — ${invoice.invoiceNumber}`}
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
      <div className="space-y-4">
        <SelectField label="Payment Status" options={PAYMENT_STATUS_OPTIONS} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} />
        <TextField label="Amount Paid (₹)" type="number" min="0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
      </div>
    </Modal>
  )
}
