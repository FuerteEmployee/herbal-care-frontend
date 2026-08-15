import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logoImg from '../../assets/img/logo.webp';
import { useAuth } from '../../context/AuthContext.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/kings-man', label: "King's Man" },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
];

export default function Header({ showBookNow = true, bookNowHref = '/checkout' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="nav">
      <div className="nav__in wrap">
        <Link className="brand" to="/" onClick={closeMenu}>
          <img src={logoImg} alt="Herbal King's Man" className="brand__logo" width="164" height="52" decoding="async" />
        </Link>

        <nav className={`menu${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              onClick={closeMenu}
              className={({ isActive }) => {
                const classes = [];
                if (isActive) classes.push('is-active');
                if (link.to === '/kings-man') classes.push('menu__kings-man');
                return classes.length > 0 ? classes.join(' ') : undefined;
              }}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav__cta">
          <LanguageSwitcher onOpen={closeMenu} />
          <Link to="/account" className="acct-chip" title={user ? user.name : 'Sign in — optional, ordering needs no account'}>
            {user ? 'My Account' : 'Sign In'}
          </Link>
          <button
            type="button"
            className={`burger${menuOpen ? ' is-open' : ''}`}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <i />
            <i />
            <i />
          </button>
        </div>
      </div>
    </header>
  );
}
