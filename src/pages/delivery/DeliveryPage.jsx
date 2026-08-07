import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Truck, MapPin, CheckCircle, Package, Search, Filter, AlertTriangle, Calendar, Phone,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/ToastContext'
import TableEmpty from '../../components/ui/TableEmpty'
import TableLoading, { TableLoadBar } from '../../components/ui/TableLoading'
import Pagination from '../../components/ui/Pagination'
import {
  getOrdersPage,
  updateOrderStatus,
  ORDER_STATUS_LABELS,
} from '../../api/orders.api'

// This screen is a dispatch board built on the order lifecycle, because that is
// all the backend models: an order is `processing` (packed, ready to go),
// `shipped` (in transit) or `delivered`.
//
// There is no Delivery or DeliveryExecutive collection on herbal-backend, so
// driver assignment, live GPS and delivery OTPs have nothing to talk to. Those
// controls are intentionally absent rather than faked — see the banner below.

const PAGE_SIZE_OPTIONS = [10, 25, 50]
const DISPATCH_STAGES = ['processing', 'shipped', 'delivered']

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function stagePill(status) {
  if (status === 'processing') return 'pill-blue'
  if (status === 'shipped') return 'pill-indigo'
  if (status === 'delivered') return 'pill-green'
  return 'pill-slate'
}

function formatAddress(addr) {
  if (!addr) return '—'
  return [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
}

export default function DeliveryPage() {
  const { showToast } = useToast()

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busyId, setBusyId] = useState(null)

  // Defaults to `shipped` — the consignments actually on the road.
  const [stage, setStage] = useState('shipped')
  const [search, setSearch] = useState('')
  const [counts, setCounts] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await getOrdersPage({ page, limit: pageSize, status: stage })
      setRows(res.items)
      setTotal(res.total)
      setPages(res.pages)
    } catch (err) {
      setLoadError(err.message)
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, stage, pageSize])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [stage, pageSize])

  // One cheap count per stage for the summary strip.
  const refreshCounts = useCallback(() => {
    Promise.all(
      DISPATCH_STAGES.map((s) =>
        getOrdersPage({ page: 1, limit: 1, status: s })
          .then((r) => [s, r.total])
          .catch(() => [s, 0]),
      ),
    ).then((pairs) => setCounts(Object.fromEntries(pairs)))
  }, [])

  useEffect(() => {
    refreshCounts()
  }, [refreshCounts])

  async function advance(order, next) {
    setBusyId(order.id)
    try {
      await updateOrderStatus(order.id, next)
      showToast(`${order.orderRef} → ${ORDER_STATUS_LABELS[next]}`, 'success')
      // The row leaves the current stage filter, so reload rather than patch.
      load()
      refreshCounts()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (o) =>
        o.orderRef.toLowerCase().includes(q) ||
        (o.customer?.name ?? '').toLowerCase().includes(q) ||
        formatAddress(o.shippingAddress).toLowerCase().includes(q),
    )
  }, [rows, search])


  const STAGE_TILES = [
    { key: 'processing', label: 'Ready to Dispatch', icon: Package, bg: '#eff5fe', fg: '#1d4ed8' },
    { key: 'shipped', label: 'In Transit', icon: Truck, bg: '#f1f2fe', fg: '#4338ca' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle, bg: '#edfaf0', fg: '#15803d' },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Deliveries"
        description="Dispatch board for packed and in-transit orders, driven by each order's fulfilment stage."
      />

      {/* Read-only counters. Stage selection is the dropdown in the toolbar —
          tiles that also filtered were an invisible second control. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STAGE_TILES.map(({ key, label, icon: Icon, bg, fg }) => (
          <div key={key} className="mini-stat">
            <div className="mini-stat-icon" style={{ background: bg, color: fg }}>
              <Icon size={17} />
            </div>
            <div>
              <p className="mini-stat-label">{label}</p>
              {counts ? (
                <p className="mini-stat-value">{counts[key] ?? 0}</p>
              ) : (
                <div className="skeleton" style={{ width: 26, height: 18, marginTop: 3 }} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="notice-warn">
        <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          <strong>Driver assignment, live tracking and delivery OTP aren’t available.</strong> The backend has
          no delivery-executive or delivery collection — only the order’s fulfilment stage. This board moves
          orders between <em>ready&nbsp;→ in&nbsp;transit&nbsp;→ delivered</em>; the rest needs new backend models
          and endpoints first.
        </span>
      </div>

      {/* Filters */}
      <div className="toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} style={{ color: 'var(--ink-muted)' }} />
          <select className="filter-select" value={stage} onChange={(e) => setStage(e.target.value)}>
            {DISPATCH_STAGES.map((s) => (
              <option key={s} value={s}>
                {s === 'processing' ? 'Ready to Dispatch' : ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-search">
          <Search size={15} />
          <input
            type="search"
            autoComplete="off"
            placeholder="Search order ref, customer or address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Consignments */}
      <div className="tbl-card">
        <div className="tbl-head">
          <div>
            <p className="tbl-head-title">
              {stage === 'processing' ? 'Ready to Dispatch' : ORDER_STATUS_LABELS[stage]}
            </p>
            <p className="tbl-head-sub">
              {visible.length !== rows.length
                ? `${visible.length} of ${rows.length} on this page match`
                : `${total} consignment${total === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        <TableLoadBar active={loading} />
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Order</th>
                <th>Recipient &amp; Address</th>
                <th>Placed</th>
                <th className="tbl-center">Items</th>
                <th className="tbl-right">Value</th>
                <th>Stage</th>
                <th className="tbl-right col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoading colSpan={7} />
              ) : loadError ? (
                <TableEmpty colSpan={7} variant="error" message={loadError} onRetry={load} />
              ) : visible.length === 0 ? (
                <TableEmpty
                  colSpan={7}
                  variant={search.trim() ? 'filtered' : 'empty'}
                  icon={Truck}
                  message={
                    search.trim()
                      ? 'No consignment matches your search.'
                      : stage === 'processing'
                        ? 'Nothing packed and waiting. Move an order to Processing from the Orders screen first.'
                        : `No ${ORDER_STATUS_LABELS[stage].toLowerCase()} consignments right now.`
                  }
                />
              ) : (
                visible.map((o) => {
                  const addr = o.shippingAddress
                  return (
                    <tr key={o.id}>
                      <td className="tbl-mono">{o.orderRef}</td>
                      <td style={{ maxWidth: 300, whiteSpace: 'normal' }}>
                        <div className="tbl-strong">{addr?.fullName || o.customer?.name || '—'}</div>
                        <div className="tbl-sub" style={{ display: 'flex', alignItems: 'flex-start', gap: 4, lineHeight: 1.45 }}>
                          <MapPin size={11} style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{formatAddress(addr)}</span>
                        </div>
                        {(addr?.phone || o.customer?.phone) && (
                          <div className="tbl-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={10} /> {addr?.phone || o.customer?.phone}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="tbl-meta"><Calendar size={12} /> {o.date}</span>
                      </td>
                      <td className="tbl-center" style={{ fontWeight: 600 }}>{o.itemCount}</td>
                      <td className="tbl-num">{currency.format(o.total)}</td>
                      <td>
                        <span className={`pill ${stagePill(o.status)}`}>
                          {o.status === 'processing' ? 'Ready' : ORDER_STATUS_LABELS[o.status]}
                        </span>
                        {o.paymentMethod === 'cod' && o.paymentStatus !== 'paid' && (
                          <div className="tbl-sub">COD — collect {currency.format(o.total)}</div>
                        )}
                      </td>
                      <td>
                        <div className="tbl-actions">
                          {o.status === 'processing' && (
                            <Button size="xs" disabled={busyId === o.id} onClick={() => advance(o, 'shipped')}>
                              <Truck size={12} /> Dispatch
                            </Button>
                          )}
                          {o.status === 'shipped' && (
                            <Button size="xs" variant="success" disabled={busyId === o.id} onClick={() => advance(o, 'delivered')}>
                              <CheckCircle size={12} /> Delivered
                            </Button>
                          )}
                          {o.status === 'delivered' && (
                            <span style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>Complete</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && !loadError && (
          <Pagination
            page={page}
            pages={pages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            label="consignments"
          />
        )}
      </div>
    </div>
  )
}
