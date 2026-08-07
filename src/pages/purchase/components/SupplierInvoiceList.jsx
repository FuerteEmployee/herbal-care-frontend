import { useEffect, useState } from 'react'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import PageHeader from '../../../components/ui/PageHeader'
import { useToast } from '../../../components/ui/ToastContext'
import { statusTone, formatStatusLabel } from '../../../lib/statusTone'
import { getSupplierInvoices, deleteSupplierInvoice } from '../../../api/supplierInvoices.api'
import { usePermission } from '../../../hooks/usePermission'
import CreateSupplierInvoiceModal from './CreateSupplierInvoiceModal'
import UpdatePaymentStatusModal from './UpdatePaymentStatusModal'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

const PAYMENT_STATUS_OPTIONS = ['pending', 'partial', 'paid'].map((s) => ({ value: s, label: formatStatusLabel(s) }))

export default function SupplierInvoiceList() {
  const { showToast } = useToast()
  const { can } = usePermission()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [payingInvoice, setPayingInvoice] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  function refresh() {
    setLoading(true)
    getSupplierInvoices()
      .then(setInvoices)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleDelete() {
    const target = deleteTarget
    setDeleteTarget(null)
    try {
      await deleteSupplierInvoice(target.id)
      showToast('Supplier invoice deleted', 'success')
      refresh()
    } catch (err) {
      showToast(err.message || 'Failed to delete supplier invoice', 'error')
    }
  }

  const columns = [
    { key: 'invoiceNumber', header: 'Invoice #', sortable: true },
    { key: 'poNumber', header: 'PO #' },
    { key: 'supplierName', header: 'Supplier' },
    { key: 'invoiceDate', header: 'Date', sortable: true },
    {
      key: 'grandTotal',
      header: 'Amount',
      sortable: true,
      className: 'tabular-nums',
      render: (row) => currency.format(row.grandTotal ?? 0),
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      render: (row) => <Badge tone={statusTone(row.paymentStatus)}>{formatStatusLabel(row.paymentStatus)}</Badge>,
    },
    { key: 'paymentDueDate', header: 'Due Date' },
  ]

  return (
    <div>
      <PageHeader
        title="Supplier Invoices"
        description="Vendor invoices raised against purchase orders, with payment tracking."
        action={
          can('purchase.create') && (
            <Button onClick={() => setCreating(true)}>New Invoice</Button>
          )
        }
      />

      <div className="mt-5">
        <DataTable
          columns={columns}
          data={invoices}
          loading={loading}
          searchable
          searchKeys={['invoiceNumber', 'poNumber', 'supplierName']}
          searchPlaceholder="Search by invoice #, PO # or supplier..."
          filters={[{ key: 'paymentStatus', label: 'Payment Status', options: PAYMENT_STATUS_OPTIONS }]}
          actions={(row) => (
            <>
              {can('purchase.edit') && (
                <Button variant="secondary" size="sm" onClick={() => setPayingInvoice(row)}>
                  Update Payment
                </Button>
              )}
              {can('purchase.delete') && (
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(row)}>
                  Delete
                </Button>
              )}
            </>
          )}
          emptyTitle="No supplier invoices found"
          emptyMessage="Create an invoice from an existing purchase order."
        />
      </div>

      <CreateSupplierInvoiceModal open={creating} onClose={() => setCreating(false)} onCreated={refresh} />
      <UpdatePaymentStatusModal open={!!payingInvoice} onClose={() => setPayingInvoice(null)} invoice={payingInvoice} onSaved={refresh} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete supplier invoice"
        message={`Are you sure you want to delete "${deleteTarget?.invoiceNumber}"? This cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  )
}
