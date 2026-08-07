/**
 * Loading row for a table body — a spinner and a message, not skeleton bars.
 *
 * Skeleton rows imply "your data is arriving and it looks like this", which is
 * a guess about both shape and row count. A spinner just says "fetching", and
 * doesn't flash a fake five-row table before an empty result.
 *
 * Pair with <TableLoadBar /> above the table for the indeterminate progress
 * line, which is what actually communicates "still working" on a slow request.
 */
export default function TableLoading({ colSpan, message = 'Loading' }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 0 }}>
        <div className="tbl-loading">
          <span className="tbl-spinner" />
          <span className="tbl-loading-text">
            {message}
            <span className="tbl-loading-dots" />
          </span>
        </div>
      </td>
    </tr>
  )
}

export function TableLoadBar({ active }) {
  if (!active) return null
  return <div className="tbl-loadbar" role="progressbar" aria-label="Loading data" />
}
