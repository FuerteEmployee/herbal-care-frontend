import { ChevronsLeft, ChevronsRight, LogOut, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import NavItem from './NavItem'
import { NAV_ITEMS } from '../../constants/roles'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }) {
  const { hasPermission, user, logout } = useAuth()
  const navigate = useNavigate()
  const items = NAV_ITEMS.filter((item) => !item.moduleKey || hasPermission(`${item.moduleKey}.view`))

  const name = user?.name ?? 'Admin'
  const roleName = user?.roleName ?? 'Admin'
  const initials = name.slice(0, 2).toUpperCase()

  function handleLogout() {
    onCloseMobile?.()
    logout()
    navigate('/admin/login', { replace: true })
  }

  const content = (
    <div className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`} style={{ width: '100%' }}>
      {/* The real logo carries the brand here — no wordmark text beside it.
          Expanded shows the full lockup; collapsed falls back to the square mark
          so it still reads inside a 64px rail. */}
      <div className="sidebar-logo-area">
        <img
          src={collapsed ? '/logo.png' : '/logo-full.png'}
          alt="Herbal Gujarat"
          className={collapsed ? 'sidebar-logo-mark' : 'sidebar-logo-full'}
        />
        {/* Two toggles, one per breakpoint — visibility is driven by
            .sidebar-collapse-desktop / -mobile in index.css, not by Tailwind
            display utilities (see the note there). */}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="sidebar-collapse-icon sidebar-collapse-desktop"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          className="sidebar-collapse-icon sidebar-collapse-mobile"
          aria-label="Close menu"
          title="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav scrollbar-thin">
        {!collapsed && <div className="sidebar-nav-label">Menu</div>}
        {items.map((item, i) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} onNavigate={onCloseMobile} index={i} />
        ))}
      </nav>

      {/* Signed-in account, mirroring the top bar. The logout button acts
          immediately rather than opening a menu — the whole point of having it
          down here is that it is one click from anywhere. */}
      <div className={`sidebar-user ${collapsed ? 'sidebar-user-collapsed' : ''}`}>
        <div className="avatar-initials" title={`${name} · ${roleName}`}>
          {initials}
        </div>
        {!collapsed && (
          <div className="sidebar-user-meta">
            <p className="sidebar-user-name">{name}</p>
            <p className="sidebar-user-role">{roleName}</p>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-logout-btn"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside
        style={{
          width: collapsed ? 64 : 248,
          flexShrink: 0,
          transition: 'width .3s ease',
          overflow: 'hidden',
        }}
        className="hidden lg:flex"
      >
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 animate-fade-in" style={{ background: 'rgba(23,29,21,.4)' }} onClick={onCloseMobile} />
          <aside style={{ width: 248 }} className="relative z-10 flex h-full animate-slide-in-left flex-col">
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
