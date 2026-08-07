// Uses the shared .page-header rules (including the hairline rule beneath the
// title) so every screen starts at the same vertical rhythm.
export default function PageHeader({ title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-desc">{description}</p>}
      </div>
      {action && <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 8 }}>{action}</div>}
    </div>
  )
}
