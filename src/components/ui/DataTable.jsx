import { useEffect, useMemo, useState } from 'react'
import { ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import EmptyState from './EmptyState'

function SkeletonRows({ columns, rows, selectable, actions }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {selectable && (
            <td>
              <div className="skeleton" style={{ width: 22 }} />
            </td>
          )}
          {columns.map((col) => (
            <td key={col.key}>
              {/* Vary the bar width per column so the placeholder reads as a
                  table rather than a block of identical grey. */}
              <div className="skeleton" style={{ width: `${40 + ((col.key.length * 7) % 50)}%` }} />
            </td>
          ))}
          {actions && (
            <td>
              <div className="skeleton" style={{ width: 56, marginLeft: 'auto' }} />
            </td>
          )}
        </tr>
      ))}
    </tbody>
  )
}

export default function DataTable({
  columns,
  data,
  loading = false,
  getRowId = (row) => row.id,
  searchable = true,
  searchKeys = [],
  searchPlaceholder = 'Search...',
  filters = [],
  toolbarExtra,
  server,
  actions,
  pageSize = 8,
  emptyTitle = 'No records found',
  emptyMessage = 'Try adjusting your search or filters.',
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  bulkActions = [],
}) {
  const serverSide = !!server
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState({})
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [page, setPage] = useState(1)

  // Server-mode search box: keep the input responsive on every keystroke,
  // but debounce the actual server request.
  const [localSearch, setLocalSearch] = useState(server?.searchValue ?? '')
  useEffect(() => {
    if (serverSide) setLocalSearch(server.searchValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSide, server?.searchValue])
  useEffect(() => {
    if (!serverSide) return
    const t = setTimeout(() => {
      if (localSearch !== server.searchValue) server.onSearchChange(localSearch)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch, serverSide])

  const filtered = useMemo(() => {
    if (serverSide) return data ?? []
    let rows = data ?? []

    if (search && searchKeys.length > 0) {
      const q = search.toLowerCase()
      rows = rows.filter((row) =>
        searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(q))
      )
    }

    Object.entries(filterValues).forEach(([key, value]) => {
      if (value) rows = rows.filter((row) => String(row[key]) === String(value))
    })

    if (sort.key) {
      rows = [...rows].sort((a, b) => {
        const av = a[sort.key]
        const bv = b[sort.key]
        if (av === bv) return 0
        const result = av > bv ? 1 : -1
        return sort.dir === 'asc' ? result : -result
      })
    }

    return rows
  }, [data, search, searchKeys, filterValues, sort, serverSide])

  // When a server-side page-size selector is opted into (server.pageSize),
  // that value drives the "Showing X-Y of Z" math instead of the static
  // pageSize prop — other server-side tables that don't opt in are
  // unaffected since server.pageSize is then undefined.
  const effectivePageSize = serverSide && server.pageSize != null ? server.pageSize : pageSize
  const totalCount = serverSide ? server.total : filtered.length
  const totalPages = Math.max(1, Math.ceil(totalCount / effectivePageSize))
  const currentPage = serverSide ? server.page : Math.min(page, totalPages)
  const paged = serverSide ? filtered : filtered.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize)
  const goToPage = (p) => (serverSide ? server.onPageChange(p) : setPage(p))

  const selectedSet = new Set(selectedIds)
  const allPagedSelected = paged.length > 0 && paged.every((row) => selectedSet.has(getRowId(row)))



  function toggleSort(key) {
    if (serverSide) {
      server.onSortChange(key)
      return
    }
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }
  const activeSortKey = serverSide ? server.sortKey : sort.key
  const activeSortDir = serverSide ? server.sortDir : sort.dir

  function updateFilter(key, value) {
    setFilterValues((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const showToolbar = searchable || filters.length > 0 || !!toolbarExtra
  const showBulkBar = selectable && selectedIds.length > 0

  const tableHead = (
    <thead>
      <tr>
        {selectable && (
          <th style={{ width: 56 }}>
            {/* Select-all checkbox intentionally omitted — this column shows a
                running row number instead. */}
            Sr.
          </th>
        )}
        {columns.map((col) => (
          <th key={col.key} className={col.className ?? ''}>
            {col.sortable ? (
              <button
                onClick={() => toggleSort(col.key)}
                className="tbl-sort-btn"
                type="button"
              >
                {col.header}
                {activeSortKey === col.key ? (
                  activeSortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                ) : (
                  <ChevronsUpDown size={12} style={{ opacity: .45 }} />
                )}
              </button>
            ) : (
              col.header
            )}
          </th>
        ))}
        {actions && <th className="tbl-right col-actions">Actions</th>}
      </tr>
    </thead>
  )

  return (
    <div className="tbl-card">
      {showBulkBar && (
        <div className="tbl-bulkbar">
          <span style={{ fontWeight: 600, color: 'var(--brand-deep)' }}>{selectedIds.length} selected</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {bulkActions.map((action) => (
              <button
                key={action.label}
                onClick={() => action.onClick(selectedIds)}
                className={`btn btn-xs ${action.tone === 'danger' ? 'btn-danger' : 'btn-secondary'}`}
              >
                {action.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => onSelectionChange([])}
            className="btn btn-ghost btn-xs"
            style={{ marginLeft: 'auto' }}
          >
            Clear selection
          </button>
        </div>
      )}

      {showToolbar && (
        <div className="data-table-toolbar">
          {searchable && (
            <div className="data-table-search-wrap">
              <Search size={15} className="data-table-search-icon" />
              <input
                className="data-table-search-input"
                value={serverSide ? localSearch : search}
                onChange={(e) => {
                  if (serverSide) {
                    setLocalSearch(e.target.value)
                    return
                  }
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder={searchPlaceholder}
              />
            </div>
          )}
          {filters.map((filter) => (
            <select
              key={filter.key}
              className="filter-select"
              value={filterValues[filter.key] ?? ''}
              onChange={(e) => updateFilter(filter.key, e.target.value)}
            >
              <option value="">{filter.label}: All</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
          {toolbarExtra && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>{toolbarExtra}</div>
          )}
        </div>
      )}

      {loading ? (
        <>
          <div className="tbl-scroll">
            <table className="data-table">
              {tableHead}
              <SkeletonRows columns={columns} rows={effectivePageSize} selectable={selectable} actions={!!actions} />
            </table>
          </div>
          {/* Skeleton pagination — keeps the card height stable while loading. */}
          <div className="tbl-foot">
            <div className="skeleton" style={{ width: 130 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 8 }} />
              <div className="skeleton" style={{ width: 38 }} />
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 8 }} />
            </div>
          </div>
        </>
      ) : filtered.length === 0 ? (
        <EmptyState title={emptyTitle} message={emptyMessage} />
      ) : (
        <>
          <div className="tbl-scroll">
            <table className="data-table">
              {tableHead}
              <tbody>
                {paged.map((row, index) => {
                  const srNumber = (currentPage - 1) * effectivePageSize + index + 1
                  return (
                    <tr
                      key={getRowId(row)}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={onRowClick ? 'tbl-row-clickable' : ''}
                    >
                      {selectable && (
                        <td style={{ color: 'var(--ink-muted)', fontWeight: 600 }} onClick={(e) => e.stopPropagation()}>
                          {srNumber}
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key} className={col.className ?? ''} style={{ whiteSpace: 'nowrap' }}>
                          {col.render ? col.render(row) : row[col.key]}
                        </td>
                      ))}
                      {actions && (
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="tbl-actions">{actions(row)}</div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="tbl-foot">
            <span>
              Showing {(currentPage - 1) * effectivePageSize + 1}–{Math.min(currentPage * effectivePageSize, totalCount)} of{' '}
              <strong style={{ color: 'var(--ink)' }}>{totalCount}</strong>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {server?.onPageSizeChange && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  Rows
                  <select
                    className="filter-select"
                    style={{ padding: '4px 26px 4px 8px', fontSize: 12, borderRadius: 7 }}
                    value={server.pageSize}
                    onChange={(e) => server.onPageSizeChange(Number(e.target.value))}
                  >
                    {server.pageSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  className="tbl-page-btn"
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  style={{ minWidth: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}
                >
                  <ChevronLeft size={15} />
                </button>
                {(() => {
                  const pages = []
                  const range = 1
                  const addPage = (p) => {
                    pages.push(
                      <button
                        key={p}
                        className={`tbl-page-btn ${currentPage === p ? 'active' : ''}`}
                        onClick={() => goToPage(p)}
                        style={{
                          fontWeight: currentPage === p ? '700' : '500',
                          borderColor: currentPage === p ? 'var(--brand)' : 'var(--line)',
                          background: currentPage === p ? 'var(--brand-tint)' : 'var(--surface)',
                          color: currentPage === p ? 'var(--brand-deep)' : 'var(--ink-body)',
                          minWidth: 28, height: 28, padding: '0 8px', borderRadius: 8,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
                        }}
                      >
                        {p}
                      </button>
                    )
                  }
                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) {
                      addPage(i)
                    }
                  } else {
                    addPage(1)
                    if (currentPage > 3) {
                      pages.push(<span key="dots-left" style={{ padding: '0 4px', color: 'var(--ink-muted)', fontSize: 12 }}>...</span>)
                    }
                    const start = Math.max(2, currentPage - range)
                    const end = Math.min(totalPages - 1, currentPage + range)
                    for (let i = start; i <= end; i++) {
                      addPage(i)
                    }
                    if (currentPage < totalPages - 2) {
                      pages.push(<span key="dots-right" style={{ padding: '0 4px', color: 'var(--ink-muted)', fontSize: 12 }}>...</span>)
                    }
                    addPage(totalPages)
                  }
                  return pages
                })()}
                <button
                  className="tbl-page-btn"
                  onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  style={{ minWidth: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
