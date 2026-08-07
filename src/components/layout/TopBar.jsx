import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function TopBar({ title }) {
  const { user, logout } = useAuth()
  const name = user?.name ?? 'Admin'
  const roleName = user?.roleName ?? 'Admin'
  const email = user?.email ?? ''
  const initials = name.slice(0, 2).toUpperCase()
  const navigate = useNavigate()

  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  function handleLogout() {
    setProfileOpen(false)
    logout()
    navigate('/admin/login', { replace: true })
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="topbar">


      {/* Page title */}
      <h1 className="topbar-title">{title}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>


        {/* Profile */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
            }}
          >
            <div className="topbar-avatar">{initials}</div>
            <div className="hidden sm:block" style={{ textAlign: 'left', lineHeight: 1.3 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{name}</p>
              <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{roleName}</p>
            </div>
            <ChevronDown size={13} style={{ color: 'var(--ink-muted)' }} className="hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="topbar-profile-dropdown">
              <div style={{ padding: '11px 14px 9px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{name}</p>
                <p style={{ fontSize: 11, color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {email}
                </p>
              </div>
              <hr style={{ margin: 0, border: 'none', borderTop: '1px solid var(--line-soft)' }} />
              <div style={{ padding: '6px' }}>
                <button className="topbar-menu-item topbar-menu-item-danger" onClick={handleLogout}>
                  <LogOut size={15} /> Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
