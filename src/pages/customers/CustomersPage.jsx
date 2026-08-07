import { useCallback, useEffect, useState } from 'react'
import { Search, Mail, Phone, Calendar, MapPin, UserX, UserCheck, Users } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import TableEmpty from '../../components/ui/TableEmpty'
import TableLoading, { TableLoadBar } from '../../components/ui/TableLoading'
import Pagination from '../../components/ui/Pagination'
import { useToast } from '../../components/ui/ToastContext'
import { usePermission } from '../../hooks/usePermission'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { getCustomers, toggleCustomerStatus } from '../../api/admin.api'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function CustomersPage() {
  const { showToast } = useToast()
  const { can } = usePermission()

  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [search, setSearch] = useState('')
  const [pendingToggle, setPendingToggle] = useState(null)

  // The search box queries the database, not the loaded rows — so it waits for
  // typing to settle rather than firing per keystroke.
  const debouncedSearch = useDebouncedValue(search)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, pageSize])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await getCustomers({ page, limit: pageSize, search: debouncedSearch.trim() })
      setCustomers(res.items)
      setTotal(res.total)
      setPages(res.pages)
    } catch (err) {
      setLoadError(err.message)
      setCustomers([])
      setTotal(0)
      setPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, pageSize])

  useEffect(() => {
    load()
  }, [load])

  async function handleToggle() {
    if (!pendingToggle) return
    try {
      await toggleCustomerStatus(pendingToggle.id)
      showToast(
        `${pendingToggle.name} ${pendingToggle.status === 'active' ? 'deactivated' : 'activated'}.`,
        'success',
      )
      load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPendingToggle(null)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        description="Everyone who has registered on the storefront. Deactivating blocks sign-in."
      />

      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={15} />
          <input
            type="search"
            autoComplete="off"
            placeholder="Search users by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="tbl-card">
        <div className="tbl-head">
          <div>
            <p className="tbl-head-title">Registered Users</p>
            <p className="tbl-head-sub">
              {total} user{total === 1 ? '' : 's'} total
            </p>
          </div>
        </div>

        <TableLoadBar active={loading} />
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th className="tbl-center">Addresses</th>
                <th>Joined</th>
                <th>Status</th>
                <th className="tbl-right col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoading colSpan={6} />
              ) : loadError ? (
                <TableEmpty colSpan={6} variant="error" message={loadError} onRetry={load} />
              ) : customers.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  variant={debouncedSearch ? 'filtered' : 'empty'}
                  icon={Users}
                  message={
                    debouncedSearch
                      ? `No user matches “${debouncedSearch}”. Try a different name or email.`
                      : 'Users appear here once they register on the storefront.'
                  }
                />
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <span className="avatar-initials">
                          {c.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="tbl-strong">{c.name}</div>
                      </div>
                    </td>
                    <td>
                      <div className="tbl-sub" style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 0 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Mail size={10} /> {c.email}
                        </span>
                        {c.phone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={10} /> {c.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="tbl-center">
                      {c.addresses.length > 0 ? (
                        <span className="tbl-meta">
                          <MapPin size={11} /> {c.addresses.length}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--ink-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className="tbl-meta">
                        <Calendar size={12} /> {c.date}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${c.status === 'active' ? 'pill-green' : 'pill-slate'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div className="tbl-actions">
                        {can('customers.edit') ? (
                          <button
                            className={`row-action ${c.status === 'active' ? 'row-action-red' : 'row-action-green'}`}
                            title={c.status === 'active' ? 'Deactivate account' : 'Activate account'}
                            onClick={() => setPendingToggle(c)}
                          >
                            {c.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        ) : (
                          <span className="tbl-meta">View only</span>
                        )}
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
            label="users"
          />
        )}
      </div>

      <ConfirmDialog
        open={!!pendingToggle}
        onClose={() => setPendingToggle(null)}
        onConfirm={handleToggle}
        title={pendingToggle?.status === 'active' ? 'Deactivate user?' : 'Activate user?'}
        message={
          pendingToggle?.status === 'active'
            ? `${pendingToggle?.name} will no longer be able to sign in or place orders.`
            : `${pendingToggle?.name} will be able to sign in and place orders again.`
        }
        confirmLabel={pendingToggle?.status === 'active' ? 'Deactivate' : 'Activate'}
        tone={pendingToggle?.status === 'active' ? 'danger' : 'primary'}
      />
    </div>
  )
}
