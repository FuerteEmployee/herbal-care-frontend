import { useState } from 'react'
import { Printer } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import { useToast } from '../../../components/ui/ToastContext'
import { statusTone, formatStatusLabel } from '../../../lib/statusTone'
import { deletePurchaseOrder, updatePurchaseOrderStatus, getPurchaseInvoicePrintData } from '../../../api/purchase.api'
import EditPurchaseOrderModal from './EditPurchaseOrderModal'
import { usePermission } from '../../../hooks/usePermission'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

const STATUS_OPTIONS = ['draft', 'pending', 'approved', 'dispatched', 'partially_received', 'received', 'cancelled'].map((s) => ({
  value: s,
  label: formatStatusLabel(s),
}))

// Reusable table for any enriched purchase-order list (supplier orders /
// pending purchases / purchase history). Edit/Delete are offered on all purchase orders.
export default function PurchaseOrderTable({ data, loading, isHistory = false, emptyTitle = 'No purchase orders found', emptyMessage = 'Purchase orders will appear here.', onChanged }) {
  const { showToast } = useToast()
  const { can } = usePermission()
  const [editingOrder, setEditingOrder] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [approvingId, setApprovingId] = useState(null)
  const [printingId, setPrintingId] = useState(null)

  async function handlePrint(row) {
    setPrintingId(row.id)
    try {
      const data = await getPurchaseInvoicePrintData(row.id)
      const { invoice, companyDetails } = data
      
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        showToast('Popup blocker prevented print preview. Please allow popups.', 'error')
        return
      }

      const itemsHtml = invoice.items.map((item, idx) => {
        const lineBase = item.qty * item.price
        const gstAmt = (lineBase * (item.gstPercent || 0)) / 100
        const total = lineBase + gstAmt
        return '<tr>' +
          '<td>' + (idx + 1) + '</td>' +
          '<td>' +
            '<div style="font-weight: 600; color: #1e293b;">' + (item.product?.name ?? 'Unknown Product') + '</div>' +
            '<div style="font-size: 10px; color: #64748b; font-family: monospace;">SAP Code: ' + (item.product?.sku ?? '—') + '</div>' +
            '<div style="font-size: 10px; color: #64748b; font-family: monospace;">SKU: ' + (item.product?.skuCode ?? '—') + '</div>' +
            (item.gsm ? '<span style="font-size: 10px; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; margin-right: 4px;">' + item.gsm + ' GSM</span>' : '') +
            (item.pageCount ? '<span style="font-size: 10px; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; margin-right: 4px;">' + item.pageCount + ' Pages</span>' : '') +
            (item.paperSize ? '<span style="font-size: 10px; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; margin-right: 4px;">Size: ' + item.paperSize + '</span>' : '') +
            (item.color ? '<span style="font-size: 10px; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; margin-right: 4px;">Ink: ' + item.color + '</span>' : '') +
          '</td>' +
          '<td class="num-col">' + item.qty + '</td>' +
          '<td class="num-col">₹' + Number(item.price).toFixed(2) + '</td>' +
          '<td class="num-col">' + item.gstPercent + '%</td>' +
          '<td class="num-col">₹' + gstAmt.toFixed(2) + '</td>' +
          '<td class="num-col">₹' + total.toFixed(2) + '</td>' +
        '</tr>'
      }).join('')

      const formattedTotal = Number(invoice.total || invoice.grandTotal).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
      const formattedSubtotal = Number(invoice.subtotal).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
      const formattedCgst = Number(invoice.cgst).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
      const formattedSgst = Number(invoice.sgst).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
      const formattedIgst = Number(invoice.igst).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
      const formattedGstTotal = Number(invoice.cgst + invoice.sgst + invoice.igst).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Purchase Invoice - ${invoice.poNumber}</title>
          <style>
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 40px;
              font-size: 11px;
              line-height: 1.4;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header-left h1 {
              margin: 0 0 5px 0;
              font-size: 24px;
              color: #002c69;
              font-weight: 800;
              letter-spacing: -0.02em;
            }
            .header-left p {
              margin: 2px 0;
              color: #475569;
            }
            .header-right {
              text-align: right;
            }
            .header-right h2 {
              margin: 0 0 5px 0;
              font-size: 18px;
              color: #475569;
              font-weight: 700;
            }
            .header-right p {
              margin: 2px 0;
              color: #475569;
            }
            .details-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 24px;
              margin-bottom: 24px;
            }
            .section-title {
              font-weight: 700;
              text-transform: uppercase;
              font-size: 9px;
              color: #64748b;
              margin-bottom: 8px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 4px;
              letter-spacing: 0.05em;
            }
            .info-block p {
              margin: 3px 0;
              color: #334155;
            }
            .info-block strong {
              color: #0f172a;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .items-table th {
              background-color: #f8fafc;
              border-bottom: 2px solid #e2e8f0;
              padding: 8px 10px;
              text-align: left;
              font-weight: 700;
              color: #475569;
              text-transform: uppercase;
              font-size: 9px;
              letter-spacing: 0.02em;
            }
            .items-table td {
              padding: 10px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: top;
              color: #334155;
            }
            .items-table .num-col {
              text-align: right;
              font-variant-numeric: tabular-nums;
            }
            .totals-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
              page-break-inside: avoid;
            }
            .notes-block {
              flex: 1;
              margin-right: 40px;
              background: #f8fafc;
              padding: 12px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              max-width: 400px;
            }
            .notes-title {
              font-weight: 700;
              font-size: 9px;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 6px;
              letter-spacing: 0.05em;
            }
            .notes-content {
              color: #475569;
              white-space: pre-wrap;
            }
            .totals-table {
              width: 280px;
              border-collapse: collapse;
            }
            .totals-table td {
              padding: 5px 8px;
            }
            .totals-table .label {
              color: #64748b;
              text-align: right;
            }
            .totals-table .val {
              text-align: right;
              font-variant-numeric: tabular-nums;
              font-weight: 500;
              color: #0f172a;
            }
            .totals-table .grand-total {
              font-size: 13px;
              font-weight: 800;
              color: #002c69;
              border-top: 1.5px solid #002c69;
              border-bottom: 3px double #002c69;
              padding-top: 8px;
              padding-bottom: 8px;
            }
            .signatures-row {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
              page-break-inside: avoid;
            }
            .signature-box {
              text-align: center;
              width: 220px;
            }
            .signature-line {
              border-top: 1px solid #cbd5e1;
              margin-top: 45px;
              padding-top: 6px;
              font-weight: 600;
              color: #475569;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              font-size: 9px;
              color: #94a3b8;
              display: flex;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            @media print {
              body {
                padding: 0;
              }
              @page {
                size: A4;
                margin: 20mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-left">
                <h1>${companyDetails.name}</h1>
                <p>${companyDetails.address}</p>
                <p>GSTIN: <strong>${companyDetails.gstin}</strong></p>
                <p>Email: ${companyDetails.email} | Phone: ${companyDetails.phone}</p>
              </div>
              <div class="header-right">
                <h2>PURCHASE INVOICE</h2>
                <p>Invoice No: <strong>${invoice.poNumber}</strong></p>
                <p>Date: <strong>${invoice.date}</strong></p>
                <p>Status: <strong style="text-transform: uppercase;">${invoice.status}</strong></p>
              </div>
            </div>

            <div class="details-grid">
              <div class="info-block">
                <div class="section-title">Supplier Details</div>
                <p><strong>${invoice.supplier?.name ?? '—'}</strong></p>
                ${invoice.supplier?.address ? ('<p>' + invoice.supplier.address + ', ' + (invoice.supplier.city || '') + ', ' + (invoice.supplier.state || '') + ' - ' + (invoice.supplier.pincode || '') + '</p>') : ''}
                ${invoice.supplier?.gstNumber ? ('<p>GSTIN: <strong>' + invoice.supplier.gstNumber + '</strong></p>') : ''}
                ${invoice.supplier?.contact ? ('<p>Phone: ' + invoice.supplier.contact + '</p>') : ''}
                ${invoice.supplier?.email ? ('<p>Email: ' + invoice.supplier.email + '</p>') : ''}
              </div>
              <div class="info-block">
                <div class="section-title">Delivery Warehouse</div>
                <p><strong>${invoice.warehouse?.name ?? '—'}</strong></p>
                ${invoice.warehouse?.code ? ('<p>Code: <strong>' + invoice.warehouse.code + '</strong></p>') : ''}
                ${invoice.warehouse?.location ? ('<p>Address: ' + invoice.warehouse.location + '</p>') : ''}
                ${invoice.expectedDeliveryDate ? ('<p style="margin-top: 8px;">Expected Delivery: <strong>' + invoice.expectedDeliveryDate + '</strong></p>') : ''}
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 40px;">S.No.</th>
                  <th>Product Details</th>
                  <th class="num-col" style="width: 60px;">Qty</th>
                  <th class="num-col" style="width: 100px;">Rate</th>
                  <th class="num-col" style="width: 70px;">GST %</th>
                  <th class="num-col" style="width: 90px;">GST Amt</th>
                  <th class="num-col" style="width: 110px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="totals-section">
              <div class="notes-block">
                <div class="notes-title">Notes / Terms</div>
                <div class="notes-content">${invoice.notes || 'No special notes or terms specified.'}</div>
              </div>
              <div>
                <table class="totals-table">
                  <tr>
                    <td class="label">Subtotal</td>
                    <td class="val">${formattedSubtotal}</td>
                  </tr>
                  ${invoice.interState ? `
                    <tr>
                      <td class="label">IGST</td>
                      <td class="val">${formattedIgst}</td>
                    </tr>
                  ` : `
                    <tr>
                      <td class="label">CGST</td>
                      <td class="val">${formattedCgst}</td>
                    </tr>
                    <tr>
                      <td class="label">SGST</td>
                      <td class="val">${formattedSgst}</td>
                    </tr>
                  `}
                  <tr>
                    <td class="label">GST Total</td>
                    <td class="val">${formattedGstTotal}</td>
                  </tr>
                  <tr>
                    <td class="label grand-total">Grand Total</td>
                    <td class="val grand-total">${formattedTotal}</td>
                  </tr>
                </table>
              </div>
            </div>

            <div class="signatures-row">
              <div class="signature-box">
                <div class="signature-line">Prepared By</div>
              </div>
              <div class="signature-box">
                <div class="signature-line">Authorized Signatory</div>
              </div>
            </div>

            <div class="footer">
              <span>Printed on: ${new Date().toLocaleString('en-IN')}</span>
              <span>Page 1 of 1</span>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `
      printWindow.document.write(htmlContent)
      printWindow.document.close()
    } catch (err) {
      showToast(err.message || 'Failed to fetch print data', 'error')
    } finally {
      setPrintingId(null)
    }
  }

  const rows = (data ?? []).map((row) => ({ ...row, supplierName: row.supplier?.name }))

  async function handleDelete() {
    const target = deleteTarget
    setDeleteTarget(null)
    try {
      await deletePurchaseOrder(target.id)
      showToast('Purchase order deleted', 'success')
      onChanged?.()
    } catch (err) {
      showToast(err.message || 'Failed to delete purchase order', 'error')
    }
  }

  async function handleApprove(row) {
    setApprovingId(row.id)
    try {
      await updatePurchaseOrderStatus(row.id, 'approved')
      showToast(`${row.poNumber} approved`, 'success')
      onChanged?.()
    } catch (err) {
      showToast(err.message || 'Failed to approve purchase order', 'error')
    } finally {
      setApprovingId(null)
    }
  }

  const columns = [
    { key: 'poNumber', header: 'PI ID', sortable: true },
    { key: 'supplierName', header: 'Supplier', render: (row) => row.supplier?.name ?? '—' },
    { key: 'date', header: 'Date', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={statusTone(row.status)}>{formatStatusLabel(row.status)}</Badge>,
    },
    {
      key: 'itemCount',
      header: 'Items',
      render: (row) => row.items?.length ?? 0,
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      className: 'tabular-nums',
      render: (row) => currency.format(row.total ?? 0),
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        searchable
        searchKeys={['poNumber', 'supplierName']}
        searchPlaceholder="Search by PI ID or supplier..."
        filters={[{ key: 'status', label: 'Status', options: STATUS_OPTIONS }]}
        actions={(row) => (
          <>
            {row.status === 'pending' && can('purchase.approve') && (
              <Button variant="secondary" size="sm" disabled={approvingId === row.id} onClick={() => handleApprove(row)}>
                {approvingId === row.id ? 'Approving...' : 'Approve'}
              </Button>
            )}
            {can('purchase.edit') && (
              <Button variant="secondary" size="sm" onClick={() => setEditingOrder(row)}>
                Edit
              </Button>
            )}
            {can('purchase.delete') && (
              <Button variant="danger" size="sm" onClick={() => setDeleteTarget(row)}>
                Delete
              </Button>
            )}
            {isHistory && (
              <Button
                variant="secondary"
                size="sm"
                className="inline-flex items-center gap-1"
                disabled={printingId === row.id}
                onClick={() => handlePrint(row)}
              >
                <Printer size={14} /> {printingId === row.id ? 'Printing...' : 'Print'}
              </Button>
            )}
          </>
        )}
        emptyTitle={emptyTitle}
        emptyMessage={emptyMessage}
      />

      <EditPurchaseOrderModal
        open={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        order={editingOrder}
        onSaved={onChanged}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete purchase order"
        message={`Are you sure you want to delete "${deleteTarget?.poNumber}"? This cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
      />
    </>
  )
}
