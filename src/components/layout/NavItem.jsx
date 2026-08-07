import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ICON_MAP } from './icons'

export default function NavItem({ item, collapsed, onNavigate, index = 0 }) {
  const Icon = ICON_MAP[item.icon]
  const location = useLocation()
  const isParentActive = location.pathname.startsWith(item.path)
  const [open, setOpen] = useState(() => isParentActive)

  useEffect(() => { if (isParentActive) setOpen(true) }, [isParentActive])

  if (item.children) {
    return (
      <div style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          style={{
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '9px 0' : '9px 12px'
          }}
          className={`nav-item w-full ${isParentActive ? 'nav-item-active' : ''}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, overflow: 'hidden', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            {Icon && <Icon size={16} className="nav-item-icon" />}
            {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
          </div>
          {!collapsed && (open ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}
        </button>

        {!collapsed && open && (
          <div className="nav-sub">
            {item.children.map((child) => {
              const sp = new URLSearchParams(location.search)
              const activeTab = sp.get('tab')
              const isChildActive = child.path.includes('?tab=')
                ? child.path.endsWith(`?tab=${activeTab}`)
                : location.pathname === child.path
              return (
                <NavLink
                  key={child.path}
                  to={child.path}
                  onClick={onNavigate}
                  className={`nav-sub-item ${isChildActive ? 'nav-sub-item-active' : ''}`}
                >
                  {child.label}
                </NavLink>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.path}
      // No `end`: prefix matching keeps the parent item highlighted on detail
      // pages (e.g. /admin/orders/:id lights up "Orders"). This was previously
      // unsafe only because Dashboard sat at /admin, a prefix of every route —
      // now that it's /admin/dashboard, no nav path is a prefix of another.
      onClick={onNavigate}
      style={{
        animationDelay: `${Math.min(index, 10) * 40}ms`,
        textDecoration: 'none',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '9px 0' : '9px 12px'
      }}
      className={({ isActive }) => `nav-item animate-fade-in ${isActive ? 'nav-item-active' : ''}`}
    >
      {Icon && <Icon size={16} className="nav-item-icon" />}
      {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
      {collapsed && <span className="nav-tooltip">{item.label}</span>}
    </NavLink>
  )
}
