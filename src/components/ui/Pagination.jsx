import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

const DEFAULT_SIZES = [10, 25, 50]

// Windowed page numbers with ellipses, so 40 pages don't render 40 buttons.
// Always shows first and last so the ends stay one click away.
function pageWindow(current, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const pages = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(totalPages - 1, current + 1)

  if (start > 2) pages.push('…')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < totalPages - 1) pages.push('…')
  pages.push(totalPages)

  return pages
}

export default function Pagination({
  page,
  pages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_SIZES,
  label = 'records',
}) {
  const totalPages = Math.max(1, pages)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="tbl-foot">
      <span className="tbl-foot-count">
        {total === 0 ? (
          `No ${label}`
        ) : (
          <>
            Showing <strong>{from}–{to}</strong> of <strong>{total}</strong> {label}
          </>
        )}
      </span>

      <div className="tbl-pager">
        {onPageSizeChange && (
          <label className="tbl-pager-size">
            Rows
            <select
              className="filter-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        )}

        <div className="tbl-pager-btns">
          <button
            className="tbl-page-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            aria-label="First page"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            className="tbl-page-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>

          {pageWindow(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="tbl-page-gap">…</span>
            ) : (
              <button
                key={p}
                className={`tbl-page-btn ${p === page ? 'tbl-page-btn-active' : ''}`}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            ),
          )}

          <button
            className="tbl-page-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
          <button
            className="tbl-page-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label="Last page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
