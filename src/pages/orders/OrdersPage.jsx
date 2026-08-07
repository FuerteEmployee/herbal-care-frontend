import { useCallback, useEffect, useState } from 'react'
import {
  Search, Filter, Calendar, User, Truck, Eye, CheckCircle, XCircle, Clock, Package, MapPin, ClipboardList, RotateCcw, X, ShoppingCart,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/ToastContext'
import { usePermission } from '../../hooks/usePermission'
import TableEmpty from '../../components/ui/TableEmpty'
import TableLoading, { TableLoadBar } from '../../components/ui/TableLoading'
import Pagination from '../../components/ui/Pagination'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import {
  getOrdersPage,
  getOrderStats,
  updateOrderStatus,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  NEXT_STATUSES,
} from '../../api/orders.api'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

// Fulfilment state → chip tone, shared by the table and the detail drawer.
function statusPillClass(status) {
  switch (status) {
    case 'pending':    return 'pill-amber'
    case 'processing':  return 'pill-blue'
    case 'shipped':     return 'pill-indigo'
    case 'delivered':   return 'pill-green'
    case 'cancelled':   return 'pill-red'
    default:            return 'pill-slate'
  }
}

function paymentPillClass(status) {
  switch (status) {
    case 'paid':     return 'pill-green'
    case 'failed':   return 'pill-red'
    case 'refunded': return 'pill-slate'
    default:         return 'pill-amber'
  }
}

// Format any date value as dd-MM-yyyy
function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d)) return value
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

// The icon offered for advancing an order, per target status.
const ACTION_ICON = {
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
}

export default function OrdersPage() {
  const { showToast } = useToast()
  const { can } = usePermission()

  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [selectedOrder, setSelectedOrder] = useState(null)

  // Every filter goes to the server. Nothing below narrows the rows again in
  // the browser: with orders in the lakhs, "search" that only looks at the ten
  // rows already downloaded is not a search, and downloading the rest to fix
  // that is not an option.
  const debouncedSearch = useDebouncedValue(search)

  const filters = {
    status: statusFilter,
    paymentStatus: paymentFilter,
    search: debouncedSearch.trim(),
    from: fromDate,
    to: toDate,
  }
  // Serialised so the load callback depends on the filter *values*, not on a
  // fresh object identity every render.
  const filterKey = JSON.stringify(filters)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await getOrdersPage({ page, limit: pageSize, ...JSON.parse(filterKey) })
      setOrders(res.items)
      setTotal(res.total)
      setPages(res.pages)
    } catch (err) {
      setLoadError(err.message)
      setOrders([])
      setTotal(0)
      setPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filterKey])

  useEffect(() => {
    load()
  }, [load])

  // Any filter change puts the admin back on page 1 — page 7 of the old result
  // set is meaningless against the new one, and often past its end.
  useEffect(() => {
    setPage(1)
  }, [filterKey, pageSize])

  async function handleStatusChange(order, nextStatus) {
    setBusyId(order.id)
    try {
      const updated = await updateOrderStatus(order.id, nextStatus)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)))
      if (selectedOrder?.id === order.id) setSelectedOrder(updated)
      showToast(`${updated.orderRef} → ${ORDER_STATUS_LABELS[nextStatus]}`, 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const activeFilters = !!(statusFilter || paymentFilter || search.trim() || fromDate || toDate)

  function resetFilters() {
    setStatusFilter('')
    setPaymentFilter('')
    setSearch('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }


  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        description="Incoming storefront orders, their fulfilment state and dispatch progress."
      />

      {/* Summary — one grouped aggregation on the server, narrowed by the same
          filters as the table (minus status, which is what it counts along), so
          the tiles describe the whole matching set rather than this page. */}
      <OrderSummary filterKey={filterKey} />

      {/* Filters */}
      <div className="toolbar">

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} style={{ color: 'var(--ink-muted)' }} />
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <select className="filter-select" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
          <option value="">All Payments</option>
          <option value="pending">Payment pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        <div className="date-range">
          <input
            className="filter-select"
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => setFromDate(e.target.value)}
            aria-label="From date"
          />
          <span>→</span>
          <input
            className="filter-select"
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => setToDate(e.target.value)}
            aria-label="To date"
          />
        </div>

        {activeFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw size={13} /> Reset
          </Button>
        )}
        <div className="toolbar-search">
          <Search size={15} />
          <input
            type="search"
            autoComplete="off"
            placeholder="Search order ref, customer, email or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Orders table */}
      <div className="tbl-card">
        <div className="tbl-head">
          <div>
            <p className="tbl-head-title">Order List</p>
            <p className="tbl-head-sub">
              {activeFilters
                ? `${total} order${total === 1 ? '' : 's'} match your filters`
                : `${total} order${total === 1 ? '' : 's'} total`}
            </p>
          </div>
        </div>

        <TableLoadBar active={loading} />
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th style={{ width: '90px', whiteSpace: 'nowrap' }}>Date</th>
                <th className="tbl-center">Items</th>
                <th className="tbl-right">Total</th>
                <th className="tbl-center" style={{ width: '110px' }}>Payment</th>
                <th className="tbl-center" style={{ width: '110px' }}>Pay Type</th>
                <th className="tbl-center" style={{ width: '110px' }}>Status</th>
                <th className="tbl-right col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoading colSpan={9} />
              ) : loadError ? (
                <TableEmpty colSpan={9} variant="error" message={loadError} onRetry={load} />
              ) : orders.length === 0 ? (
                <TableEmpty
                  colSpan={9}
                  variant={activeFilters ? 'filtered' : 'empty'}
                  icon={ShoppingCart}
                  message={
                    activeFilters
                      ? 'No order matches these filters. Try widening the date range or clearing the status.'
                      : 'Orders placed on the storefront will appear here.'
                  }
                />
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id}>
                    <td className="tbl-mono">{ord.orderRef}</td>
                    <td>
                      <div className="tbl-strong">
                        {ord.customer?.name ?? 'Deleted customer'}
                        {/* Ordered without an account — worth showing, since
                            there is no customer record to look them up in. */}
                        {ord.customer?.isGuest && (
                          <span className="badge badge-slate" style={{ marginLeft: 7 }}>Guest</span>
                        )}
                      </div>
                      <div className="tbl-sub">{ord.customer?.phone || ord.customer?.email || '—'}</div>
                    </td>
                    <td style={{ width: '90px', whiteSpace: 'nowrap' }}>
                      <span className="tbl-meta">
                        <Calendar size={12} /> {formatDate(ord.date)}
                      </span>
                    </td>
                    <td className="tbl-center" style={{ fontWeight: 600 }}>{ord.itemCount}</td>
                    <td className="tbl-num">{currency.format(ord.total)}</td>
                    <td className="tbl-center">
                      <span className={`pill ${paymentPillClass(ord.paymentStatus)}`} style={{ textTransform: 'capitalize' }}>{ord.paymentStatus}</span>
                    </td>
                    <td className="tbl-center">
                      <span className="pill pill-slate">{ord.paymentMethod.toUpperCase()}</span>
                    </td>
                    <td className="tbl-center">
                      <span className={`pill ${statusPillClass(ord.status)}`}>
                        {ORDER_STATUS_LABELS[ord.status] ?? ord.status}
                      </span>
                    </td>
                    <td>
                      <div className="tbl-actions">
                        <button className="row-action" onClick={() => setSelectedOrder(ord)} title="View details">
                          <Eye size={15} />
                        </button>
                        {/* Only transitions the server accepts are offered, and
                            only to a role allowed to change an order. */}
                        {can('orders.edit') && (NEXT_STATUSES[ord.status] ?? []).map((next) => {
                          const Icon = ACTION_ICON[next] ?? CheckCircle
                          const danger = next === 'cancelled'
                          return (
                            <button
                              key={next}
                              className={`row-action ${danger ? 'row-action-red' : 'row-action-green'}`}
                              disabled={busyId === ord.id}
                              onClick={() => handleStatusChange(ord, next)}
                              title={`Mark ${ORDER_STATUS_LABELS[next]}`}
                            >
                              <Icon size={15} />
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                ))
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
            label="orders"
          />
        )}
      </div>

      {selectedOrder && (
        <OrderDetailDrawer
          order={selectedOrder}
          busy={busyId === selectedOrder.id}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}

// ─── Summary strip ──────────────────────────────────────────────────────────
// Counts per status, from one grouped aggregation on the server.
//
// This used to fire a limit=1 request per status and read `total` off each —
// five whole-collection counts on every load, none of which knew about the
// other filters. GET /api/orders/stats does it in one pass and takes the same
// filters as the table, so the tiles and the rows always describe the same set.
function OrderSummary({ filterKey }) {
  const [counts, setCounts] = useState(null)

  useEffect(() => {
    let cancelled = false
    // `status` is the axis being counted, so it is dropped from the filters.
    const { status: _ignored, ...rest } = JSON.parse(filterKey)
    setCounts(null)
    getOrderStats(rest)
      .then((res) => {
        if (!cancelled) setCounts(res.counts)
      })
      .catch(() => {
        if (!cancelled) setCounts({})
      })
    return () => {
      cancelled = true
    }
  }, [filterKey])

  const TILES = [
    { key: 'pending', label: 'Pending', icon: Clock, bg: '#fdf6e3', fg: '#a16207' },
    { key: 'processing', label: 'Processing', icon: Package, bg: '#eff5fe', fg: '#1d4ed8' },
    { key: 'shipped', label: 'Shipped', icon: Truck, bg: '#f1f2fe', fg: '#4338ca' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle, bg: '#edfaf0', fg: '#15803d' },
    { key: 'cancelled', label: 'Cancelled', icon: XCircle, bg: '#fdf1f1', fg: '#b91c1c' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {TILES.map(({ key, label, icon: Icon, bg, fg }) => (
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
  )
}

// ─── Detail drawer ──────────────────────────────────────────────────────────
function OrderDetailDrawer({ order, busy, onClose, onStatusChange }) {
  // Same rule as the table row: a role that cannot change an order gets the
  // detail view without the status buttons.
  const { can } = usePermission()
  const addr = order.shippingAddress

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel" style={{ width: '100%', maxWidth: 540 }}>
        <div className="drawer-header">
          <div>
            <h3 className="drawer-title">{order.orderRef}</h3>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>Placed on {order.date}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`pill ${statusPillClass(order.status)}`}>
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </span>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="drawer-body scrollbar-thin" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Customer */}
          <div>
            <h4 className="section-title"><User size={13} /> Customer</h4>
            <div className="card-flat" style={{ padding: 14 }}>
              <p className="tbl-strong" style={{ fontSize: 13.5 }}>{order.customer?.name ?? 'Deleted customer'}</p>
              {order.customer?.phone && (
                <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>{order.customer.phone}</p>
              )}
              {order.customer?.email && (
                <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{order.customer.email}</p>
              )}
            </div>
          </div>

          {/* Shipping address */}
          {addr && (
            <div>
              <h4 className="section-title"><MapPin size={13} /> Shipping Address</h4>
              <div
                className="card-flat"
                style={{ padding: 14, background: 'var(--surface-alt)', fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-soft)' }}
              >
                <p className="tbl-strong" style={{ fontSize: 13, marginBottom: 2 }}>{addr.fullName}</p>
                <p>{addr.phone}</p>
                <p>{addr.line1}</p>
                {addr.line2 && <p>{addr.line2}</p>}
                <p>{addr.city}, {addr.state} — {addr.pincode}</p>
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <h4 className="section-title"><ClipboardList size={13} /> Items</h4>
            <div className="card-flat" style={{ overflow: 'hidden' }}>
              <table className="tbl-inner">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="tbl-center">Qty</th>
                    <th className="tbl-right">Rate</th>
                    <th className="tbl-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500, color: 'var(--ink)' }}>{item.name}</td>
                      <td className="tbl-center">{item.qty}</td>
                      <td className="tbl-right">{currency.format(item.price)}</td>
                      <td className="tbl-num">{currency.format(item.price * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="order-totals">
                <div><span>Subtotal</span><span>{currency.format(order.subtotal)}</span></div>
                <div>
                  <span>Shipping</span>
                  <span>{order.shippingCharge === 0 ? 'Free' : currency.format(order.shippingCharge)}</span>
                </div>
                <div className="order-totals-grand">
                  <span>Total</span><span>{currency.format(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div>
            <h4 className="section-title">Payment</h4>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="pill pill-slate">{order.paymentMethod.toUpperCase()}</span>
              <span className={`pill ${paymentPillClass(order.paymentStatus)}`}>{order.paymentStatus}</span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <h4 className="section-title">Customer Note</h4>
              <p
                style={{
                  fontSize: 12.5, fontStyle: 'italic', lineHeight: 1.55,
                  background: '#fdf6e3', color: '#8a5a08',
                  border: '1px solid #f4e4b8', borderRadius: 10, padding: 12,
                }}
              >
                “{order.notes}”
              </p>
            </div>
          )}

          {/* Status history — written by the backend on every transition. */}
          {order.statusHistory.length > 0 && (
            <div>
              <h4 className="section-title">History</h4>
              <div className="timeline">
                {order.statusHistory.map((h, i) => (
                  <div key={i} className="timeline-row">
                    <span className={`timeline-dot ${i === order.statusHistory.length - 1 ? 'timeline-dot-active' : ''}`} />
                    <div>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>
                        {ORDER_STATUS_LABELS[h.status] ?? h.status}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                        {h.at ? new Date(h.at).toLocaleString('en-IN') : ''}
                        {h.note ? ` · ${h.note}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {can('orders.edit') && (NEXT_STATUSES[order.status] ?? []).length > 0 && (
          <div className="drawer-footer">
            {(NEXT_STATUSES[order.status] ?? []).map((next) => (
              <Button
                key={next}
                variant={next === 'cancelled' ? 'danger' : 'primary'}
                disabled={busy}
                onClick={() => onStatusChange(order, next)}
              >
                Mark {ORDER_STATUS_LABELS[next]}
              </Button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
