import React, { useEffect, useRef, useState } from 'react';

function blankFields(user) {
  return {
    name: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: user?.city || '',
    state: 'Gujarat',
    pincode: '',
    isDefault: false,
  };
}

export default function AddressesPanel({ addresses, user, onSave, onDelete, onSetDefault }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [fields, setFields] = useState(() => blankFields(user));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  // Which card is mid-request, so its buttons lock instead of firing twice.
  const [busyId, setBusyId] = useState('');
  const [listError, setListError] = useState('');
  const formRef = useRef(null);

  async function runAction(id, action) {
    setListError('');
    setBusyId(id);
    try {
      const result = await action();
      if (result && !result.ok) setListError(result.error);
    } catch {
      // A thrown error here means a bug rather than a rejected request, and
      // swallowing it silently is what made a failed save look like nothing
      // happened at all.
      setListError('Something went wrong. Please try again.');
    } finally {
      setBusyId('');
    }
  }

  useEffect(() => {
    if (formOpen) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [formOpen, editingId]);

  function openForNew() {
    setEditingId('');
    setFields(blankFields(user));
    setError('');
    setFormOpen(true);
  }

  function openForEdit(address) {
    setEditingId(address.id);
    setFields({
      name: address.name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state || 'Gujarat',
      pincode: address.pincode,
      isDefault: !!address.isDefault,
    });
    setError('');
    setFormOpen(true);
  }

  function update(field, value) {
    setFields((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const pin = fields.pincode.trim();
    if (!/^[0-9]{6}$/.test(pin)) {
      setError('Please enter a valid 6-digit pincode.');
      return;
    }
    if (!fields.name.trim() || !fields.phone.trim() || !fields.line1.trim() || !fields.city.trim()) {
      setError('Please fill in all the required fields.');
      return;
    }

    setSaving(true);
    try {
      const result = await onSave({
        id: editingId || null,
        name: fields.name.trim(),
        phone: fields.phone.trim(),
        line1: fields.line1.trim(),
        line2: fields.line2.trim(),
        city: fields.city.trim(),
        state: fields.state.trim() || 'Gujarat',
        pincode: pin,
        isDefault: fields.isDefault,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setFormOpen(false);
    } catch {
      // Same reasoning as runAction: never leave the form sitting there with no
      // explanation, or the shopper just clicks Save again and saves twice.
      setError('Something went wrong saving that address. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <h2>Saved Addresses</h2>
          <p>Save an address once and reuse it at checkout.</p>
        </div>
        <button type="button" className="btn btn--gold btn--sm" onClick={openForNew}>
          + Add Address
        </button>
      </div>

      {formOpen && (
        <form
          ref={formRef}
          noValidate
          onSubmit={handleSubmit}
          style={{ marginBottom: 28, padding: 22, border: '1px solid var(--green-line)', borderRadius: 'var(--radius-sm)', background: 'var(--cream)' }}
        >
          <div className="alert alert--err" hidden={!error}>
            {error}
          </div>
          <div className="form__row">
            <div className="field">
              <label htmlFor="a-name">Receiver Name *</label>
              <input type="text" id="a-name" required value={fields.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="a-phone">Mobile Number *</label>
              <input
                type="tel"
                id="a-phone"
                pattern="[0-9]{10}"
                maxLength={10}
                minLength={10}
                required
                value={fields.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="a-line1">House / Flat / Street *</label>
            <input type="text" id="a-line1" required value={fields.line1} onChange={(e) => update('line1', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="a-line2">Area / Landmark</label>
            <input type="text" id="a-line2" value={fields.line2} onChange={(e) => update('line2', e.target.value)} />
          </div>
          <div className="form__row">
            <div className="field">
              <label htmlFor="a-city">City *</label>
              <input type="text" id="a-city" required value={fields.city} onChange={(e) => update('city', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="a-state">State</label>
              <input type="text" id="a-state" value={fields.state} onChange={(e) => update('state', e.target.value)} />
            </div>
          </div>
          <div className="form__row">
            <div className="field">
              <label htmlFor="a-pin">Pincode *</label>
              <input
                type="text"
                id="a-pin"
                pattern="[0-9]{6}"
                placeholder="6 digits"
                required
                value={fields.pincode}
                onChange={(e) => update('pincode', e.target.value)}
              />
            </div>
            <div className="field" style={{ display: 'flex', alignItems: 'end' }}>
              <label
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  textTransform: 'none',
                  letterSpacing: 0,
                  fontSize: '.92rem',
                  fontWeight: 400,
                  color: 'var(--body)',
                }}
              >
                <input
                  type="checkbox"
                  checked={fields.isDefault}
                  onChange={(e) => update('isDefault', e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--green)' }}
                />
                Set as default address
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn--green" disabled={saving}>
              {saving ? 'Saving…' : 'Save Address'}
            </button>
            <button type="button" className="btn btn--outline" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="alert alert--err" hidden={!listError}>
        {listError}
      </div>

      <div className="addr-grid">
        {!addresses.length && (
          <div className="empty" style={{ gridColumn: '1/-1' }}>
            <em>📍</em>
            <h3>No saved addresses</h3>
            <p>Add a delivery address now and checkout becomes a two-tap job later.</p>
          </div>
        )}
        {addresses.map((address) => (
          <div className={`addr${address.isDefault ? ' is-default' : ''}`} key={address.id}>
            {address.isDefault && <span className="addr__tag">Default</span>}
            <strong>{address.name}</strong>
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ''}
            <br />
            {address.city}, {address.state} – {address.pincode}
            <br />
            Phone: {address.phone}
            <div className="addr__acts">
              <button type="button" onClick={() => openForEdit(address)} disabled={busyId === address.id}>
                Edit
              </button>
              {/* Only offered where it changes something — the default address
                  is already the one checkout preselects. */}
              {!address.isDefault && (
                <button type="button" onClick={() => runAction(address.id, () => onSetDefault(address.id))} disabled={busyId === address.id}>
                  Set as default
                </button>
              )}
              <button type="button" onClick={() => runAction(address.id, () => onDelete(address.id))} disabled={busyId === address.id}>
                {busyId === address.id ? 'Working…' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
