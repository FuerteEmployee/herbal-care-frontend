import React, { useCallback, useEffect, useState } from 'react';
import * as hg from '../../lib/hg.js';
import * as api from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

function TrackerOutput({ order, progress }) {
  return (
    <div className="tracker">
      <div className="tracker__eta">
        <div>
          Order <b>{order.ref}</b>
          <br />
          <span style={{ fontSize: '.84rem' }}>
            {order.product} · Qty {order.qty}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          {progress.cancelled ? (
            <>
              Status
              <br />
              <b style={{ color: '#99432c' }}>Cancelled</b>
            </>
          ) : progress.delivered ? (
            <>
              Delivered on
              <br />
              <b>{hg.formatDate(progress.eta)}</b>
            </>
          ) : (
            <>
              Expected delivery
              <br />
              <b>{hg.formatDate(progress.eta)}</b>
            </>
          )}
        </div>
      </div>

      {progress.cancelled ? (
        <div className="alert alert--err" style={{ margin: 0 }}>
          This order was cancelled on {hg.formatDate(progress.cancelledAt || order.placedAt, true)}. If this was a mistake,
          please call us on +91 84690 57530 and we will place it again.
        </div>
      ) : (
        <div className="tsteps">
          {progress.stages.map((stage, index) => {
            const cls = index < progress.index ? 'is-done' : index === progress.index ? 'is-now' : 'is-pending';
            // A step that has actually happened shows when the warehouse moved
            // it; the rest show the estimate off the order date.
            const stamp = progress.stampFor?.(stage.key);
            const expected = new Date(new Date(order.placedAt).getTime() + stage.after * 3600000);
            return (
              <div className={`tstep ${cls}`} key={stage.key}>
                <span className="tstep__when">
                  {index > progress.index
                    ? `Expected ${hg.formatDate(expected)}`
                    : hg.formatDate(stamp || order.placedAt, true)}
                </span>
                <b>{stage.label}</b>
                <p>{stage.note}</p>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 26, paddingTop: 22, borderTop: '1px solid var(--green-line)' }}>
        <h3 style={{ fontSize: '1.1rem' }}>Delivery Address</h3>
        <p style={{ fontSize: '.93rem', margin: 0 }}>
          {order.address.name}
          <br />
          {order.address.line1}
          {order.address.line2 && (
            <>
              <br />
              {order.address.line2}
            </>
          )}
          <br />
          {order.address.city}, {order.address.state} – {order.address.pincode}
          <br />
          Phone: {order.address.phone}
        </p>
      </div>
    </div>
  );
}

export default function TrackPanel({ presetId }) {
  const { user } = useAuth();
  const [id, setId] = useState(presetId || '');
  // The order id alone must not expose someone's address and phone number, so
  // the server checks the delivery mobile too. Prefilled for signed-in
  // customers, since we already know theirs.
  const [phone, setPhone] = useState(user?.phone || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const runTrack = useCallback(async (trackId, trackPhone) => {
    setError('');
    setResult(null);

    if (!String(trackId || '').trim()) {
      setError('Please enter your order ID.');
      return;
    }
    if (String(trackPhone || '').replace(/\D/g, '').length < 10) {
      setError('Please enter the 10-digit mobile number used on the order.');
      return;
    }

    setBusy(true);
    try {
      const res = await api.trackOrder(String(trackId).trim(), String(trackPhone).trim());
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult({ order: res.order, progress: hg.progress(res.order) });
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!presetId) return;
    setId(presetId);
    // Only auto-run when we already have a number to check against, which is
    // the case when a signed-in customer arrives from the confirmation screen.
    if (user?.phone) runTrack(presetId, user.phone);
  }, [presetId, user, runTrack]);

  function handleSubmit(event) {
    event.preventDefault();
    runTrack(id, phone);
  }

  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <h2>Track Your Order</h2>
          <p>Enter your order ID and the mobile number on the order to see exactly where your pack is.</p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} style={{ marginBottom: 26 }}>
        <div className="form__row" style={{ alignItems: 'end' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="t-id">Order ID *</label>
            <input
              type="text"
              id="t-id"
              placeholder="e.g. HG7K2M4P"
              required
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="t-phone">Mobile Number *</label>
            <input
              type="tel"
              id="t-phone"
              placeholder="10-digit mobile"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <button type="submit" className="btn btn--green btn--block btn--lg" disabled={busy}>
              {busy ? 'Checking…' : 'Track'}
            </button>
          </div>
        </div>
      </form>

      <div className="alert alert--err" hidden={!error}>
        {error}
      </div>
      {result && <TrackerOutput order={result.order} progress={result.progress} />}
    </section>
  );
}
