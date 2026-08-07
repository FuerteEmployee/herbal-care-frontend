import { Inbox } from 'lucide-react'

export default function EmptyState({ title = 'No data found', message = '' }) {
  return (
    <div className="empty-state">
      <Inbox size={48} strokeWidth={1.2} className="empty-state-icon" />
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-msg">{message}</p>}
    </div>
  )
}
