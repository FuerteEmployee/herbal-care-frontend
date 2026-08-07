import { X } from 'lucide-react'

const SIZES = { sm: 420, md: 560, lg: 720, xl: 880 }

export default function Drawer({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  if (!open) return null

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel" style={{ width: '100%', maxWidth: SIZES[size] ?? SIZES.md }}>
        <div className="drawer-header">
          <div>
            <h2 className="drawer-title">{title}</h2>
            {subtitle && <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="drawer-body scrollbar-thin">{children}</div>
        {footer && <div className="drawer-footer">{footer}</div>}
      </div>
    </>
  )
}
