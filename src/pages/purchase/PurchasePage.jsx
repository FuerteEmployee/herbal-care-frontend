import { PackageX, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'

// The purchase module was carried over from a different project. Its views call
// /purchase, /suppliers, /supplier-invoices and /warehouse — none of which exist
// on herbal-backend, which has no Supplier, PurchaseOrder, SupplierInvoice or
// Warehouse model at all.
//
// The original views are still on disk under ./components (CreatePurchaseForm,
// SupplierOrdersView, PendingPurchasesView, PurchaseHistoryView,
// SupplierInvoiceList) and can be wired straight back up once those collections
// and routes exist. Until then this screen says so plainly instead of rendering
// four tabs of failed requests.
const MISSING = [
  { model: 'Supplier', purpose: 'who you buy stock from' },
  { model: 'PurchaseOrder', purpose: 'what was ordered, at what price and GST' },
  { model: 'SupplierInvoice', purpose: 'billing and payment status against a PO' },
  { model: 'Warehouse', purpose: 'where received stock lands' },
]

export default function PurchasePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchases"
        description="Supplier purchase orders, invoices and stock receipts."
      />

      <div className="card" style={{ padding: '38px 32px', textAlign: 'center' }}>
        <PackageX size={34} strokeWidth={1.3} style={{ color: '#c5cfbe', margin: '0 auto 14px' }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
          Purchasing isn’t available yet
        </h3>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', maxWidth: 520, margin: '0 auto 22px', lineHeight: 1.6 }}>
          This screen needs four collections the backend doesn’t have. The UI for it is already built and
          waiting — it just has nothing to read from or write to.
        </p>

        <div
          className="card-flat"
          style={{ maxWidth: 480, margin: '0 auto', textAlign: 'left', overflow: 'hidden' }}
        >
          <table className="tbl-inner">
            <thead>
              <tr>
                <th>Needed model</th>
                <th>Holds</th>
              </tr>
            </thead>
            <tbody>
              {MISSING.map((m) => (
                <tr key={m.model}>
                  <td className="tbl-mono" style={{ whiteSpace: 'nowrap' }}>{m.model}</td>
                  <td style={{ color: 'var(--ink-soft)' }}>{m.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <Link to="/admin/products">
            <Button variant="secondary">
              Manage Products <ArrowRight size={14} />
            </Button>
          </Link>
          <Link to="/admin/orders">
            <Button>
              Go to Orders <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
