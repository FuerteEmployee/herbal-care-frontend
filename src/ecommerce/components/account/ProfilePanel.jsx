import React, { useState } from 'react';
import * as hg from '../../lib/hg.js';

export default function ProfilePanel({ user, saveUser, changePassword }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [city, setCity] = useState(user.city || '');
  const [profileOk, setProfileOk] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passOk, setPassOk] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

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

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileOk('');
    setProfileError('');
    if (!name.trim() || !phone.trim()) {
      setProfileError('Name and mobile number are required.');
      return;
    }

    setSavingProfile(true);
    try {
      const result = await saveUser({ name: name.trim(), phone: phone.trim(), city: city.trim() });
      if (!result.ok) {
        setProfileError(result.error);
        return;
      }
      setProfileOk('Your profile has been updated.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPassError('');
    setPassOk('');
    setSavingPass(true);
    try {
      const result = await changePassword(oldPass, newPass);
      if (!result.ok) {
        setPassError(result.error);
        return;
      }
      setPassOk('Password updated successfully.');
      setOldPass('');
      setNewPass('');
    } finally {
      setSavingPass(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <h2>My Profile</h2>
          <p>Keep your contact details current so we can reach you about orders.</p>
        </div>
      </div>

      <form noValidate onSubmit={handleProfileSubmit} style={{ marginBottom: 34 }}>
        <div className="alert alert--err" hidden={!profileError}>
          {profileError}
        </div>
        <div className="alert alert--ok" hidden={!profileOk}>
          {profileOk}
        </div>
        <div className="form__row">
          <div className="field">
            <label htmlFor="p-name">Full Name *</label>
            <input type="text" id="p-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="p-phone">Mobile Number *</label>
            <input type="tel" id="p-phone" pattern="[0-9]{10}" maxLength={10} minLength={10} required value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="form__row">
          <div className="field">
            <label htmlFor="p-email">Email Address</label>
            <input type="email" id="p-email" disabled value={user.email} />
            <span className="field__hint">Email is your login ID and cannot be changed here.</span>
          </div>
          <div className="field">
            <label htmlFor="p-city">City</label>
            <input type="text" id="p-city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>
        <button type="submit" className="btn btn--gold btn--lg" disabled={savingProfile}>
          {savingProfile ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <h3 style={{ fontSize: '1.15rem', paddingTop: 24, borderTop: '1px solid var(--green-line)' }}>Change Password</h3>
      <form noValidate onSubmit={handlePasswordSubmit}>
        <div className="alert alert--err" hidden={!passError}>
          {passError}
        </div>
        <div className="alert alert--ok" hidden={!passOk}>
          {passOk}
        </div>
        <div className="form__row">
          <div className="field">
            <label htmlFor="p-old">Current Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showOldPass ? 'text' : 'password'}
                id="p-old"
                required
                autoComplete="current-password"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                style={{ paddingRight: '46px' }}
              />
              <button
                type="button"
                onClick={() => setShowOldPass(!showOldPass)}
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
                aria-label={showOldPass ? 'Hide password' : 'Show password'}
              >
                {showOldPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="p-new">New Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPass ? 'text' : 'password'}
                id="p-new"
                required
                autoComplete="new-password"
                placeholder="Minimum 6 characters"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                style={{ paddingRight: '46px' }}
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
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
                aria-label={showNewPass ? 'Hide password' : 'Show password'}
              >
                {showNewPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
        </div>
        <button type="submit" className="btn btn--outline" disabled={savingPass}>
          {savingPass ? 'Updating…' : 'Update Password'}
        </button>
      </form>

      <p className="form__note" style={{ textAlign: 'left', marginTop: 26 }}>
        Member since <b style={{ color: 'var(--green)' }}>{hg.formatDate(user.joinedAt)}</b>
      </p>
    </section>
  );
}
