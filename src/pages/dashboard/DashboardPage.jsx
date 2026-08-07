import { useEffect, useState } from 'react'
import {
  ShoppingCart, Users, Package, MessageSquare, IndianRupee,
  Plus, AlertCircle, Clock, Truck, CheckCircle, XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import { getDashboard } from '../../api/admin.api'
import { ORDER_STATUS_LABELS } from '../../api/orders.api'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

// One colour per fulfilment state, matched to the status chips elsewhere.
const STATUS_COLORS = {
  pending: '#d4a017',
  processing: '#1d4ed8',
  shipped: '#4338ca',
  delivered: '#15803d',
  cancelled: '#b91c1c',
}

function statusBadgeClass(s) {
  if (s === 'pending') return 'badge badge-amber'
  if (s === 'processing') return 'badge badge-blue'
  if (s === 'shipped') return 'badge badge-purple'
  if (s === 'delivered') return 'badge badge-green'
  if (s === 'cancelled') return 'badge badge-red'
  return 'badge badge-slate'
}

function StatCard({ icon: Icon, label, value, iconColor, iconBg, hint }) {
  return (
    <div className="stat-card animate-fade-in-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-icon" style={{ background: iconBg, color: iconColor }}>
          <Icon size={18} strokeWidth={1.8} />
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      {hint && <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{hint}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getDashboard()
      .then((res) => {
        if (!cancelled) {
          setData(res)
          setError('')
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Dashboard" description="Loading today's figures…" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ width: '60%' }} />
              <div className="skeleton" style={{ width: '45%', height: 24 }} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="card" style={{ height: 300 }} />
          <div className="card" style={{ height: 300 }} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader title="Dashboard" />
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <AlertCircle size={30} strokeWidth={1.4} style={{ color: '#b91c1c', margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Could not load the dashboard</p>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  const { stats, recentOrders, recentCustomers } = data
  const orderCounts = stats.orders

  // Only statuses that actually occur, so the chart has no empty slices.
  const statusData = Object.entries(STATUS_COLORS)
    .map(([key, color]) => ({
      key,
      name: ORDER_STATUS_LABELS[key] ?? key,
      value: orderCounts[key] ?? 0,
      color,
    }))
    .filter((d) => d.value > 0)

  const hasOrders = (orderCounts.total ?? 0) > 0

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Live figures from the storefront — orders, revenue, catalogue and enquiries."
        action={
          <Link to="/admin/products">
            <Button><Plus size={15} /> Add Product</Button>
          </Link>
        }
      />

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={IndianRupee} label="Revenue" value={currency.format(stats.totalRevenue)}
          iconColor="#3d4a34" iconBg="#e4ede0" hint="From delivered orders"
        />
        <StatCard
          icon={ShoppingCart} label="Orders" value={orderCounts.total ?? 0}
          iconColor="#1d4ed8" iconBg="#eff5fe" hint={`${orderCounts.pending ?? 0} awaiting action`}
        />
        <StatCard
          icon={Users} label="Users" value={stats.totalCustomers}
          iconColor="#4338ca" iconBg="#f1f2fe"
        />
        <StatCard
          icon={Package} label="Active Products" value={stats.totalProducts}
          iconColor="#a16207" iconBg="#fdf6e3"
        />
        <StatCard
          icon={MessageSquare} label="New Enquiries" value={stats.newLeads}
          iconColor="#b91c1c" iconBg="#fdf1f1" hint="Unread contact forms"
        />
      </div>

      {/* Fulfilment breakdown */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card" style={{ padding: '20px 22px' }}>
          <h3 className="card-title">Orders by Status</h3>
          <p className="card-subtitle" style={{ marginBottom: 14 }}>Where every order currently sits</p>
          {hasOrders ? (
            <>
              <div style={{ height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3ef" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#9ba5a0', fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: '#9ba5a0', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#fff', borderRadius: 10, border: '1px solid #e7eae4', fontSize: 12 }}
                      formatter={(v) => [v, 'Orders']}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
                      {statusData.map((d) => (
                        <Cell key={d.key} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="status-legend">
                {[
                  { key: 'pending', icon: Clock },
                  { key: 'processing', icon: Package },
                  { key: 'shipped', icon: Truck },
                  { key: 'delivered', icon: CheckCircle },
                  { key: 'cancelled', icon: XCircle },
                ].map(({ key, icon: Icon }) => (
                  <span key={key}>
                    <Icon size={12} style={{ color: STATUS_COLORS[key] }} />
                    {ORDER_STATUS_LABELS[key]}
                    <strong>{orderCounts[key] ?? 0}</strong>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '48px 20px' }}>
              <ShoppingCart size={28} strokeWidth={1.3} className="empty-state-icon" />
              <p className="empty-state-msg">No orders yet — this fills in as the storefront takes orders.</p>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '20px 22px' }}>
          <h3 className="card-title">Order Mix</h3>
          <p className="card-subtitle" style={{ marginBottom: 14 }}>Share of orders per status</p>
          {hasOrders ? (
            <div style={{ position: 'relative', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={62} outerRadius={88} paddingAngle={4} dataKey="value">
                    {statusData.map((d) => (
                      <Cell key={d.key} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e7eae4' }}
                    formatter={(v, n) => [`${v} orders`, n]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>{orderCounts.total ?? 0}</div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  Orders
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '48px 20px' }}>
              <ShoppingCart size={28} strokeWidth={1.3} className="empty-state-icon" />
              <p className="empty-state-msg">Nothing to chart yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="tbl-card">
          <div className="tbl-head">
            <div>
              <p className="tbl-head-title">Recent Orders</p>
              <p className="tbl-head-sub">Last five placed</p>
            </div>
            <Link to="/admin/orders" className="link-more">View All →</Link>
          </div>
          <div className="tbl-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Date</th>
                  <th className="tbl-right">Amount</th>
                  <th className="tbl-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={4} className="tbl-empty">No orders yet.</td></tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td>
                        <div className="tbl-strong">{ord.customer}</div>
                        {ord.email && <div className="tbl-sub">{ord.email}</div>}
                      </td>
                      <td className="tbl-meta">{ord.date}</td>
                      <td className="tbl-num">{currency.format(ord.amount)}</td>
                      <td className="tbl-right">
                        <span className={statusBadgeClass(ord.status)}>
                          {ORDER_STATUS_LABELS[ord.status] ?? ord.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="tbl-card">
          <div className="tbl-head">
            <div>
              <p className="tbl-head-title">Newest Users</p>
              <p className="tbl-head-sub">Last five to register</p>
            </div>
            <Link to="/admin/users" className="link-more">View All →</Link>
          </div>
          <div className="tbl-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>User</th>
                  <th className="tbl-right">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentCustomers.length === 0 ? (
                  <tr><td colSpan={2} className="tbl-empty">No users yet.</td></tr>
                ) : (
                  recentCustomers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <span className="avatar-initials">{c.name.slice(0, 2).toUpperCase()}</span>
                          <div>
                            <div className="tbl-strong">{c.name}</div>
                            <div className="tbl-sub">{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="tbl-right tbl-meta">{c.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
