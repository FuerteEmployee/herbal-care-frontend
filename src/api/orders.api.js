import { api } from './httpClient'

// Orders as herbal-backend actually models them (src/models/Order.js):
// a single `orderStatus` enum, one `totalAmount`, `quantity` per line, and an
// embedded shippingAddress. Status changes go through one endpoint —
// PUT /api/orders/:id/status — which also restores stock when cancelling.

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

// Which statuses an order may move to next. Drives the row actions so the UI
// never offers a transition the server would reject.
export const NEXT_STATUSES = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

export function mapOrderFromApi(o) {
  const items = (o.items ?? []).map((i) => ({
    productId: typeof i.product === 'object' ? i.product?._id : i.product,
    name: i.name,
    image: i.image ?? '',
    price: i.price ?? 0,
    qty: i.quantity ?? 0,
  }))

  // Storefront orders carry a printed reference the customer quotes on the
  // phone. Older orders predate the field, so fall back to the ObjectId tail
  // rather than printing 24 hex characters.
  const orderRef = o.orderRef || `ORD-${String(o._id ?? '').slice(-6).toUpperCase()}`

  // Guest orders have no `user` — the storefront takes orders without an
  // account. Their contact details live on the order itself, with the delivery
  // address as the last resort, so the list never shows a blank customer.
  const customer = o.user
    ? {
        id: o.user._id ?? o.user,
        name: o.user.name ?? '',
        email: o.user.email ?? '',
        phone: o.user.phone ?? '',
        isGuest: false,
      }
    : {
        id: null,
        name: o.guest?.name || o.shippingAddress?.fullName || 'Guest',
        email: o.guest?.email ?? '',
        phone: o.guest?.phone || o.shippingAddress?.phone || '',
        isGuest: true,
      }

  return {
    id: o._id,
    orderRef,
    customer,
    items,
    itemCount: items.reduce((sum, i) => sum + i.qty, 0),
    shippingAddress: o.shippingAddress ?? null,
    paymentMethod: o.paymentMethod ?? 'cod',
    paymentStatus: o.paymentStatus ?? 'pending',
    status: o.orderStatus ?? 'pending',
    subtotal: o.subtotal ?? 0,
    shippingCharge: o.shippingCharge ?? 0,
    total: o.totalAmount ?? 0,
    notes: o.notes ?? '',
    statusHistory: (o.statusHistory ?? []).map((h) => ({
      status: h.status,
      at: h.changedAt,
      note: h.note ?? '',
    })),
    date: (o.createdAt ?? '').slice(0, 10),
    createdAt: o.createdAt,
  }
}

function toQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, v)
  })
  return qs.toString()
}

// GET /api/orders?page&limit&status&paymentStatus&search&from&to
//   → { total, page, pages, orders }
//
// Every filter the Orders screen offers is a query parameter: the table only
// ever holds one page, so nothing here is narrowed in the browser afterwards.
// `from`/`to` are YYYY-MM-DD and the server reads them as whole UTC days,
// matching the date each row displays.
export async function getOrdersPage({
  page = 1,
  limit = 10,
  status,
  paymentStatus,
  search,
  from,
  to,
} = {}) {
  const qs = toQuery({ page, limit, status, paymentStatus, search, from, to })
  const res = await api.get(`/orders${qs ? `?${qs}` : ''}`)
  return {
    items: (res.orders ?? []).map(mapOrderFromApi),
    total: res.total ?? 0,
    page: res.page ?? page,
    pages: res.pages ?? 1,
  }
}

// GET /api/orders/stats?paymentStatus&search&from&to → counts per order status.
//
// One grouped aggregation for the summary strip. Takes the same filters as the
// list minus `status`, so the tiles count within whatever the admin is looking
// at rather than across the whole table.
export async function getOrderStats({ paymentStatus, search, from, to } = {}) {
  const qs = toQuery({ paymentStatus, search, from, to })
  const res = await api.get(`/orders/stats${qs ? `?${qs}` : ''}`)
  return { counts: res.counts ?? {}, total: res.total ?? 0 }
}

export async function getOrderById(id) {
  const { order } = await api.get(`/orders/${id}`)
  return mapOrderFromApi(order)
}

// PUT /api/orders/:id/status — the server validates the target status, appends
// a statusHistory entry, marks delivered orders paid, and restores stock on
// cancellation.
export async function updateOrderStatus(id, status, note) {
  const { order } = await api.put(`/orders/${id}/status`, { status, note })
  return mapOrderFromApi(order)
}
