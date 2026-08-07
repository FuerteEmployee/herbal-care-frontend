import { Inbox, SearchX, AlertCircle } from 'lucide-react'
import Button from './Button'

/**
 * The single "nothing to show" row used by every table, so an empty catalogue,
 * an over-narrow filter and a failed request never look the same.
 *
 *   variant="empty"    nothing exists yet
 *   variant="filtered" rows exist, the filters excluded them all
 *   variant="error"    the request failed — offers a retry
 */
const VARIANTS = {
  empty: { icon: Inbox, title: 'No Data Found', tone: '#c5cfbe' },
  filtered: { icon: SearchX, title: 'No Matches Found', tone: '#c5cfbe' },
  error: { icon: AlertCircle, title: 'Could Not Load Data', tone: '#e08e8e' },
}

export default function TableEmpty({
  colSpan,
  variant = 'empty',
  title,
  message,
  icon,
  onRetry,
  retryLabel = 'Retry',
}) {
  const preset = VARIANTS[variant] ?? VARIANTS.empty
  const Icon = icon ?? preset.icon

  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 0 }}>
        <div className="table-empty">
          <span className="table-empty-icon" style={{ color: preset.tone }}>
            <Icon size={26} strokeWidth={1.5} />
          </span>
          <p className="table-empty-title">{title ?? preset.title}</p>
          {message && <p className="table-empty-msg">{message}</p>}
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry} style={{ marginTop: 14 }}>
              {retryLabel}
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}
