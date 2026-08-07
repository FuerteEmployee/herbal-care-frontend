import { useCallback, useEffect, useState } from 'react'
import {
  MessageSquare, Plus, Mail, Phone, Calendar, Search, Filter, FileText, Trash2, RotateCcw,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useToast } from '../../components/ui/ToastContext'
import { usePermission } from '../../hooks/usePermission'
import TableEmpty from '../../components/ui/TableEmpty'
import TableLoading, { TableLoadBar } from '../../components/ui/TableLoading'
import Pagination from '../../components/ui/Pagination'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import {
  getLeadsPage,
  createLead,
  updateLeadStatus,
  deleteLead,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
} from '../../api/leads.api'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

// Tone for the inline status dropdown in the table.
function statusSelectClass(status) {
  if (status === 'new') return 'lead-status-new'
  if (status === 'read') return 'lead-status-contacted'
  return 'lead-status-closed'
}

export default function LeadsPage() {
  const { showToast } = useToast()
  const { can } = usePermission()

  const [leads, setLeads] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')

  const [activeNotesLead, setActiveNotesLead] = useState(null)
  const [tempNotes, setTempNotes] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)

  // Status, source and search are all applied by the database. Search in
  // particular used to run over the loaded page only, so it quietly searched
  // ten rows out of however many the table holds.
  const debouncedSearch = useDebouncedValue(search)
  const filterKey = JSON.stringify({
    status: statusFilter,
    source: sourceFilter,
    search: debouncedSearch.trim(),
  })

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await getLeadsPage({ page, limit: pageSize, ...JSON.parse(filterKey) })
      setLeads(res.items)
      setTotal(res.total)
      setPages(res.pages)
    } catch (err) {
      setLoadError(err.message)
      setLeads([])
      setTotal(0)
      setPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filterKey])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [filterKey, pageSize])

  async function handleCreateLead(e) {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim() || !newMessage.trim()) {
      showToast('Name, email and message are required.', 'error')
      return
    }
    setSubmitting(true)
    try {
      await createLead({
        name: newName,
        email: newEmail,
        phone: newPhone,
        subject: newSubject,
        message: newMessage,
      })
      showToast(`Enquiry from "${newName}" logged.`, 'success')
      setNewName(''); setNewEmail(''); setNewPhone(''); setNewSubject(''); setNewMessage('')
      setShowAddForm(false)
      if (page !== 1) setPage(1)
      else load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatusChange(lead, status) {
    try {
      const updated = await updateLeadStatus(lead.id, status, lead.notes)
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)))
      showToast(`Marked ${LEAD_STATUS_LABELS[status]}.`, 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleSaveNotes() {
    if (!activeNotesLead) return
    try {
      const updated = await updateLeadStatus(activeNotesLead.id, activeNotesLead.status, tempNotes)
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
      showToast('Follow-up note saved.', 'success')
      setActiveNotesLead(null)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    try {
      await deleteLead(pendingDelete.id)
      showToast('Enquiry deleted.', 'success')
      if (leads.length === 1 && page > 1) setPage((p) => p - 1)
      else load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPendingDelete(null)
    }
  }

  const activeFilters = !!(statusFilter || sourceFilter || search.trim())

  return (
    <div className="space-y-5">
      <PageHeader
        title="Enquiries"
        description="Contact-form submissions from the website, plus enquiries you log by hand."
        action={
          can('leads.create') && (
            <Button onClick={() => setShowAddForm((v) => !v)}>
              <Plus size={15} /> {showAddForm ? 'Cancel Entry' : 'Log Enquiry'}
            </Button>
          )
        }
      />

      {showAddForm && (
        <div className="card animate-fade-in-up" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <MessageSquare size={17} style={{ color: 'var(--brand)' }} />
            <h3 className="card-title">New Enquiry</h3>
          </div>
          {/* autoComplete off throughout: these are the *customer's* details,
              not the signed-in admin's, so browser contact autofill is wrong here. */}
          <form onSubmit={handleCreateLead} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="form-field">
                <label className="form-label form-label-req">Customer Name</label>
                <input className="form-input" type="text" required name="leadCustomerName" autoComplete="off" placeholder="e.g. Rajesh Kumar"
                  value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label form-label-req">Email Address</label>
                <input className="form-input" type="email" required name="leadCustomerEmail" autoComplete="off" spellCheck={false} placeholder="e.g. rajesh@gmail.com"
                  value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label">Phone Number</label>
                <input className="form-input" type="tel" name="leadCustomerPhone" autoComplete="off" placeholder="10-digit mobile"
                  pattern="[0-9]{10}" maxLength={10} minLength={10}
                  value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="form-field sm:col-span-1">
                <label className="form-label">Subject</label>
                <input className="form-input" type="text" name="leadSubject" autoComplete="off" placeholder="e.g. Bulk order"
                  value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
              </div>
              <div className="form-field sm:col-span-3">
                <label className="form-label form-label-req">Enquiry / Message</label>
                <textarea className="form-textarea" rows={2} required
                  placeholder="What is the customer asking for?"
                  value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  style={{ minHeight: 62 }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save Enquiry'}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} style={{ color: 'var(--ink-muted)' }} />
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select className="filter-select" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="">All Sources</option>
            <option value="Home Page">Home Page</option>
            <option value="Contact Page">Contact Page</option>
            <option value="Product Page">Product Page</option>
            <option value="Product Combo Page">Product Combo Page</option>
            <option value="Manual">Manual</option>
          </select>
        </div>
        {activeFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setStatusFilter(''); setSourceFilter(''); setSearch('') }}>
            <RotateCcw size={13} /> Reset
          </Button>
        )}
        <div className="toolbar-search">
          <Search size={15} />
          <input type="search" autoComplete="off" placeholder="Search by name, email, phone or message…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Leads table */}
      <div className="tbl-card">
        <div className="tbl-head">
          <div>
            <p className="tbl-head-title">Enquiry List</p>
            <p className="tbl-head-sub">
              {activeFilters
                ? `${total} enquir${total === 1 ? 'y' : 'ies'} match your filters`
                : `${total} enquir${total === 1 ? 'y' : 'ies'} total`}
            </p>
          </div>
        </div>
        <TableLoadBar active={loading} />
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Source</th>
                <th>Subject</th>
                <th style={{ minWidth: 240 }}>Enquiry</th>
                <th>Follow-up</th>
                <th>Status</th>
                <th className="tbl-right col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoading colSpan={8} />
              ) : loadError ? (
                <TableEmpty colSpan={8} variant="error" message={loadError} onRetry={load} />
              ) : leads.length === 0 ? (
                <TableEmpty
                  colSpan={8}
                  variant={activeFilters ? 'filtered' : 'empty'}
                  icon={MessageSquare}
                  message={
                    activeFilters
                      ? 'No enquiry matches these filters.'
                      : 'Contact-form submissions will appear here. You can also log one by hand.'
                  }
                />
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id}>
                    <td><span className="tbl-meta"><Calendar size={12} /> {lead.date}</span></td>
                    <td>
                      <div className="tbl-strong">{lead.name}</div>
                      <div className="tbl-sub" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Mail size={10} /> {lead.email}
                        </span>
                        {lead.phone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={10} /> {lead.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="tbl-meta" style={{ fontWeight: 500, color: 'var(--ink)' }}>
                        {lead.source}
                      </span>
                    </td>
                    <td>
                      {lead.subject
                        ? <span className="pill pill-slate">{lead.subject}</span>
                        : <span style={{ color: 'var(--ink-muted)' }}>—</span>}
                    </td>
                    <td className="tbl-wrap-text"
                      style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontStyle: 'italic', maxWidth: 280 }}>
                      “{lead.message}”
                    </td>
                    <td>
                      {lead.notes ? (
                        <div className="tbl-clip" style={{ maxWidth: 160, fontSize: 12.5, color: 'var(--brand)', fontWeight: 500 }}>
                          {lead.notes}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12.5, color: 'var(--ink-muted)', fontStyle: 'italic' }}>No notes</span>
                      )}
                    </td>
                    <td>
                      {/* Read-only roles see the status, they just cannot move
                          it — the select would 403 on change. */}
                      {can('leads.edit') ? (
                        <select
                          className={`lead-status-select ${statusSelectClass(lead.status)}`}
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead, e.target.value)}
                        >
                          {LEAD_STATUSES.map((s) => (
                            <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="pill pill-slate">{LEAD_STATUS_LABELS[lead.status]}</span>
                      )}
                    </td>
                    <td>
                      <div className="tbl-actions">
                        <button
                          className="row-action"
                          title="Follow-up note"
                          onClick={() => { setActiveNotesLead(lead); setTempNotes(lead.notes) }}
                          style={{ display: 'none' }} /* Hidden as requested, keep handler for modal */
                        >
                          <FileText size={15} />
                        </button>
                        {can('leads.delete') && (
                          <button
                            className="row-action row-action-red"
                            title="Delete enquiry"
                            onClick={() => setPendingDelete(lead)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {!can('leads.delete') && !can('leads.edit') && (
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
            label="enquiries"
          />
        )}
      </div>

      {/* Follow-up note editor */}
      {activeNotesLead && (
        <div className="modal-backdrop">
          <div className="fixed inset-0" onClick={() => setActiveNotesLead(null)} />
          <div className="confirm-dialog-box" style={{ maxWidth: 440, position: 'relative', zIndex: 1 }}>
            <h3 className="confirm-dialog-title">Follow-up Note</h3>
            <p className="confirm-dialog-message">
              Saved to this enquiry as the admin note — visible only to your team.
            </p>
            <textarea
              className="form-textarea"
              rows={4}
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="e.g. Sent catalogue. Customer wants a sample pack of 3 oils."
              style={{ marginTop: 16 }}
            />
            <div className="confirm-dialog-actions">
              <Button variant="secondary" onClick={() => setActiveNotesLead(null)}>Cancel</Button>
              <Button onClick={handleSaveNotes}>Save Note</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete enquiry?"
        message={`The enquiry from "${pendingDelete?.name}" will be permanently removed.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
