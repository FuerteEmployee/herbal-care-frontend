import React, { useState } from 'react';

export default function AuthPanel({ login, signup }) {
  const [tab, setTab] = useState('login');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regError, setRegError] = useState('');

  // Both forms hit the server now, so the buttons have to say so and refuse a
  // second click while the first is still in flight.
  const [busy, setBusy] = useState(false);

  function EyeIcon() {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  function EyeOffIcon() {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError('');
    setBusy(true);
    try {
      const result = await login(loginEmail, loginPass);
      if (!result.ok) {
        setLoginError(result.error);
        return;
      }
      setLoginEmail('');
      setLoginPass('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    setRegError('');
    setBusy(true);
    try {
      const result = await signup({
        name: regName,
        email: regEmail,
        phone: regPhone,
        city: regCity,
        password: regPass,
      });
      if (!result.ok) {
        setRegError(result.error);
        return;
      }
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegCity('');
      setRegPass('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <aside className="auth__aside">
        <span className="eyebrow" style={{ color: 'var(--gold-light)' }}>
          Member Benefits
        </span>
        <h3>Your Wellness Dashboard</h3>
        <ul className="checks">
          <li>Book packs in a few taps</li>
          <li>Save delivery addresses</li>
          <li>Track every order live</li>
          <li>Full order history in one place</li>
          <li>Write and manage your reviews</li>
        </ul>
        <p style={{ fontSize: '.86rem', color: 'rgba(255,255,255,.6)', marginTop: 24 }}>
          Need help? Call <b style={{ color: 'var(--gold-light)' }}>+91 84690 57530</b>
        </p>
      </aside>

      <div className="auth__body">
        <div className="tabs" role="tablist">
          <button
            type="button"
            className={tab === 'login' ? 'is-active' : undefined}
            role="tab"
            aria-selected={tab === 'login'}
            onClick={() => setTab('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={tab === 'reg' ? 'is-active' : undefined}
            role="tab"
            aria-selected={tab === 'reg'}
            onClick={() => setTab('reg')}
          >
            Create Account
          </button>
        </div>

        <div className="tabpane" hidden={tab !== 'login'}>
          <form noValidate onSubmit={handleLogin}>
            <div className="alert alert--err" hidden={!loginError}>
              {loginError}
            </div>
            <div className="field">
              <label htmlFor="l-email">Email Address *</label>
              <input
                type="email"
                id="l-email"
                name="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="l-pass">Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showLoginPass ? 'text' : 'password'}
                  id="l-pass"
                  name="password"
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  style={{ paddingRight: '46px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPass(!showLoginPass)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'none',
                    color: '#9aa093',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  aria-label={showLoginPass ? 'Hide password' : 'Show password'}
                >
                  {showLoginPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn--gold btn--block btn--lg" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
            <p className="form__note">
              New here?{' '}
              <button type="button" style={{ color: 'var(--gold-deep)', fontWeight: 600 }} onClick={() => setTab('reg')}>
                Create an account
              </button>
            </p>
          </form>
        </div>

        <div className="tabpane" hidden={tab !== 'reg'}>
          <form noValidate onSubmit={handleSignup}>
            <div className="alert alert--err" hidden={!regError}>
              {regError}
            </div>
            <div className="field">
              <label htmlFor="r-name">Full Name *</label>
              <input
                type="text"
                id="r-name"
                name="name"
                placeholder="Your name"
                required
                autoComplete="name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
            </div>
            <div className="form__row">
              <div className="field">
                <label htmlFor="r-email">Email Address *</label>
                <input
                  type="email"
                  id="r-email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="r-phone">Mobile Number *</label>
                <input
                  type="tel"
                  id="r-phone"
                  name="phone"
                  placeholder="10-digit mobile"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  minLength={10}
                  required
                  autoComplete="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="form__row">
              <div className="field">
                <label htmlFor="r-city">City</label>
                <input type="text" id="r-city" name="city" placeholder="Your city" value={regCity} onChange={(e) => setRegCity(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="r-pass">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    id="r-pass"
                    name="password"
                    placeholder="Minimum 6 characters"
                    required
                    autoComplete="new-password"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    style={{ paddingRight: '46px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'none',
                      color: '#9aa093',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    aria-label={showRegPass ? 'Hide password' : 'Show password'}
                  >
                    {showRegPass ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn--gold btn--block btn--lg" disabled={busy}>
              {busy ? 'Creating your account…' : 'Create Account'}
            </button>
            <p className="form__note">
              Already registered?{' '}
              <button type="button" style={{ color: 'var(--gold-deep)', fontWeight: 600 }} onClick={() => setTab('login')}>
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
