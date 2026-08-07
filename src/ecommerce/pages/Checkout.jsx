import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import TopBar from '../components/layout/TopBar.jsx';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';
import PageHead from '../components/layout/PageHead.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as hg from '../lib/hg.js';
import * as api from '../lib/api.js';

function blankAddress(user) {
  return {
    name: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: user?.city || '',
    state: 'Gujarat',
    pincode: '',
  };
}

export default function Checkout() {
  const { user, saveAddress } = useAuth();
  const [searchParams] = useSearchParams();
  const pick = useMemo(() => hg.getPick(), []);
  // Saved addresses come from the signed-in customer's server profile; a guest
  // simply has none.
  const addresses = useMemo(() => user?.addresses ?? [], [user]);
  const defaultAddress = useMemo(() => addresses.find((a) => a.isDefault) || addresses[0] || null, [addresses]);

  const initialSku = hg.PRODUCTS[searchParams.get('pack')] ? searchParams.get('pack') : hg.PRODUCTS[pick.sku] ? pick.sku : 'combo';
  const [sku, setSku] = useState(initialSku);
  const [qty, setQty] = useState(Math.max(1, Math.min(10, parseInt(pick.qty, 10) || 1)));
  const [selectedSavedId, setSelectedSavedId] = useState(defaultAddress ? defaultAddress.id : '');
  const [addr, setAddr] = useState(defaultAddress ? { ...defaultAddress } : blankAddress(user));
  const [saveChecked, setSaveChecked] = useState(!defaultAddress);
  // Cash on delivery is the only method offered today, so the server defaults
  // every storefront order to "cod" and the checkout does not send one.
  const [placing, setPlacing] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [doneOrder, setDoneOrder] = useState(null);
  const errorRef = useRef(null);

  useEffect(() => {
    document.title = 'Book Your Pack | Herbal Gujarat';
  }, []);

  const [detecting, setDetecting] = useState(false);
  const [detectNote, setDetectNote] = useState('');

  /** Promise wrapper so the two-attempt flow below reads as straight code. */
  function readPosition(options) {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  function handleDetectLocation() {
    if (!navigator.geolocation) {
      setError('Your browser cannot detect location. Please type the address in.');
      return;
    }

    setDetecting(true);
    setError('');
    setDetectNote('');

    (async () => {
      try {
        // GPS first — `maximumAge: 0` refuses a stale cached fix, which is the
        // usual cause of an address from wherever the device was last used.
        // Wi-Fi/cell positioning is the fallback when GPS cannot get a lock.
        let position;
        try {
          position = await readPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
        } catch {
          position = await readPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
        }

        const { latitude, longitude, accuracy } = position.coords;
        const res = await fetch(
          // zoom=18 is building level. `accept-language=en` matters because the
          // page may be translated — the courier needs a Latin-script address,
          // not a Gujarati one.
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=en`,
        );
        if (!res.ok) throw new Error('lookup failed');

        const data = await res.json();
        const a = data?.address;
        if (!a) throw new Error('no address');

        // House number and road first — that is what actually gets delivered to.
        const line1 = [[a.house_number, a.road].filter(Boolean).join(' '), a.building, a.residential]
          .filter(Boolean)
          .join(', ');
        const line2 = [a.neighbourhood, a.suburb, a.city_district]
          .filter(Boolean)
          .filter((v, i, all) => all.indexOf(v) === i)
          .join(', ');
        const city = a.city || a.town || a.village || a.municipality || a.county || '';

        setAddr((prev) => ({
          ...prev,
          line1: line1 || prev.line1,
          line2: line2 || prev.line2,
          city: city || prev.city,
          state: a.state || prev.state,
          pincode: a.postcode || prev.pincode,
        }));
        // Switch the saved-address radio across, or the filled fields look like
        // they belong to the saved address that is still selected.
        setSelectedSavedId('');

        // Accuracy is in metres. Anything past a block is worth flagging rather
        // than quietly presenting as exact.
        setDetectNote(
          accuracy && accuracy > 150
            ? `Location found, but only to about ${Math.round(accuracy)} m — please check the street and pincode below.`
            : 'Location filled in. Please check the details and add your house or flat number.',
        );
      } catch (err) {
        setError(
          err?.code === 1
            ? 'Location permission was blocked. Allow it in your browser, or type the address in.'
            : 'Could not work out your address from your location. Please type it in.',
        );
      } finally {
        setDetecting(false);
      }
    })();
  }

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [error]);

  function selectSavedAddress(id) {
    setSelectedSavedId(id);
    if (!id) {
      setAddr(blankAddress(user));
      setSaveChecked(true);
      return;
    }
    const hit = addresses.find((a) => a.id === id);
    if (hit) {
      setAddr({ ...hit });
      setSaveChecked(false);
    }
  }

  function updateAddr(field, value) {
    setAddr((prev) => ({ ...prev, [field]: value }));
  }

  function setClampedQty(next) {
    setQty(Math.max(1, Math.min(10, next)));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const payload = {
      name: addr.name.trim(),
      phone: addr.phone.trim(),
      line1: addr.line1.trim(),
      line2: (addr.line2 || '').trim(),
      city: addr.city.trim(),
      state: (addr.state || '').trim() || 'Gujarat',
      pincode: addr.pincode.trim(),
    };

    // Straight to the server: this is what puts the order in front of the
    // admin panel. Only the sku and quantity go up — the backend prices it.
    setPlacing(true);
    try {
      const result = await api.placeOrder({
        sku,
        qty,
        address: payload,
        notes: notes.trim(),
        email: user?.email || '',
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Fire-and-forget: the order is already placed, so a failure to save the
      // address to the customer's profile must not block the confirmation.
      if (user && saveChecked) {
        saveAddress({ ...payload, isDefault: addresses.length === 0 });
      }

      setDoneOrder(result.order);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setPlacing(false);
    }
  }

  const product = hg.PRODUCTS[sku];
  const subtotal = product.price * qty;
  const savedAmount = (product.mrp - product.price) * qty;

  return (
    <main>
      <TopBar />
      <Header showBookNow={false} />

      <PageHead
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: "King's Man", to: '/kings-man' }, { label: 'Book Now' }]}
        title={
          <>
            Book Your <span className="gold-text">Pack</span>
          </>
        }
        subtitle="No account needed — fill in your delivery details, choose your pack and pay on delivery. Our advisor calls to confirm every order."
      />

      <section className="section section--cream">
        <div className="wrap">
          {!user && !doneOrder && (
            <div className="guest-note">
              <strong>No account required.</strong> Fill in your details below and place the order straight away. Already
              have an account? <Link to="/account">Sign in</Link> to reuse a saved address.
            </div>
          )}

          {!doneOrder && (
            <div className="checkout">
              <div>
                <div className="panel" style={{ marginBottom: 26 }}>
                  <h3 className="step-title">
                    <i>1</i> Choose Your Pack
                  </h3>
                  <div className="pick">
                    {Object.keys(hg.PRODUCTS).map((key) => {
                      const p = hg.PRODUCTS[key];
                      return (
                        <label key={key}>
                          <input type="radio" name="sku" value={key} checked={key === sku} onChange={() => setSku(key)} />
                          <span className="pick__txt">
                            <strong>{p.name}</strong>
                            <span>
                              {p.short}
                              {key === 'combo' ? ' · Best value' : ''}
                            </span>
                          </span>
                          <span className="pick__price">
                            {hg.money(p.price)}
                            <s>{hg.money(p.mrp)}</s>
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 22, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '.82rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--green)' }}>
                      Quantity
                    </span>
                    <div className="qty">
                      <button type="button" aria-label="Decrease quantity" onClick={() => setClampedQty(qty - 1)}>
                        −
                      </button>
                      <span>{qty}</span>
                      <button type="button" aria-label="Increase quantity" onClick={() => setClampedQty(qty + 1)}>
                        +
                      </button>
                    </div>
                    <span style={{ fontSize: '.84rem', color: '#9aa093' }}>Maximum 10 per order</span>
                  </div>
                </div>

                <div className="panel" style={{ marginBottom: 26 }}>
                  <h3 className="step-title step-title--action">
                    <span>
                      <i>2</i> Delivery Address
                    </span>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm detect-btn"
                      onClick={handleDetectLocation}
                      disabled={detecting}
                      title="Fill the address below from your current location"
                    >
                      {detecting ? 'Locating…' : '📍 Use my location'}
                    </button>
                  </h3>

                  {addresses.length > 0 && (
                    <div className="pick" style={{ marginBottom: 22 }}>
                      <span style={{ fontSize: '.78rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--green)' }}>
                        Use a saved address
                      </span>
                      {addresses.map((a) => (
                        <label key={a.id}>
                          <input
                            type="radio"
                            name="saved"
                            value={a.id}
                            checked={selectedSavedId === a.id}
                            onChange={() => selectSavedAddress(a.id)}
                          />
                          <span className="pick__txt">
                            <strong>
                              {a.name}
                              {a.isDefault ? ' · Default' : ''}
                            </strong>
                            <span>
                              {a.line1}
                              {a.line2 ? `, ${a.line2}` : ''}, {a.city} – {a.pincode} · {a.phone}
                            </span>
                          </span>
                        </label>
                      ))}
                      <label>
                        <input type="radio" name="saved" value="" checked={selectedSavedId === ''} onChange={() => selectSavedAddress('')} />
                        <span className="pick__txt">
                          <strong>Use a new address</strong>
                          <span>Enter the details in the form below.</span>
                        </span>
                      </label>
                    </div>
                  )}

                  <form noValidate onSubmit={handleSubmit}>
                    {detectNote && <div className="alert alert--ok">{detectNote}</div>}

                    <div className="alert alert--err" ref={errorRef} hidden={!error}>
                      {error}
                    </div>

                    <div className="form__row">
                      <div className="field">
                        <label htmlFor="d-name">Receiver Name *</label>
                        <input
                          type="text"
                          id="d-name"
                          required
                          autoComplete="name"
                          value={addr.name}
                          onChange={(e) => updateAddr('name', e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="d-phone">Mobile Number *</label>
                        <input
                          type="tel"
                          id="d-phone"
                          pattern="[0-9]{10}"
                          maxLength={10}
                          minLength={10}
                          required
                          autoComplete="tel"
                          value={addr.phone}
                          onChange={(e) => updateAddr('phone', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label htmlFor="d-line1">House / Flat / Street *</label>
                      <input
                        type="text"
                        id="d-line1"
                        placeholder="e.g. 12, Shanti Residency, Nehru Road"
                        required
                        value={addr.line1}
                        onChange={(e) => updateAddr('line1', e.target.value)}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="d-line2">Area / Landmark</label>
                      <input
                        type="text"
                        id="d-line2"
                        placeholder="e.g. Near Swaminarayan Temple"
                        value={addr.line2}
                        onChange={(e) => updateAddr('line2', e.target.value)}
                      />
                    </div>

                    <div className="form__row">
                      <div className="field">
                        <label htmlFor="d-city">City *</label>
                        <input type="text" id="d-city" required value={addr.city} onChange={(e) => updateAddr('city', e.target.value)} />
                      </div>
                      <div className="field">
                        <label htmlFor="d-state">State</label>
                        <input type="text" id="d-state" value={addr.state} onChange={(e) => updateAddr('state', e.target.value)} />
                      </div>
                    </div>

                    <div className="form__row">
                      <div className="field">
                        <label htmlFor="d-pin">Pincode *</label>
                        <input
                          type="text"
                          id="d-pin"
                          pattern="[0-9]{6}"
                          placeholder="6 digits"
                          required
                          value={addr.pincode}
                          onChange={(e) => updateAddr('pincode', e.target.value)}
                        />
                      </div>
                      {user && (
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
                              checked={saveChecked}
                              onChange={(e) => setSaveChecked(e.target.checked)}
                              style={{ width: 18, height: 18, accentColor: 'var(--green)' }}
                            />
                            Save this address to my account
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="d-notes">Delivery Notes</label>
                      <textarea
                        id="d-notes"
                        placeholder="Any instruction for the delivery partner (optional)"
                        style={{ minHeight: 88 }}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    {/* No payment step: cash on delivery is the only method we
                        offer, so it is stated rather than chosen. */}
                    <div className="cod-note">
                      <strong>Cash on Delivery</strong>
                      <span>Pay the courier in cash when your pack arrives. No extra charge, no advance payment.</span>
                    </div>

                    <button
                      type="submit"
                      className="btn btn--gold btn--block btn--lg"
                      style={{ marginTop: 26 }}
                      disabled={placing}
                    >
                      {placing ? 'Placing your order…' : 'Place Order'}
                    </button>
                    <p className="form__note">
                      No sign-up needed. By placing the order you agree to our terms. Our team calls to confirm before
                      dispatch.
                    </p>
                  </form>
                </div>
              </div>

              <aside className="summary">
                <h3>Order Summary</h3>
                <div className="summary__item">
                  <img src={product.img} alt="" />
                  <div>
                    <b>{product.name}</b>
                    <span>{product.short}</span>
                    <span>Qty: {qty}</span>
                  </div>
                </div>
                <div className="srow">
                  <span>Subtotal</span>
                  <span>{hg.money(subtotal)}</span>
                </div>
                <div className="srow">
                  <span>Shipping</span>
                  <span style={{ color: 'var(--gold-deep)', fontWeight: 500 }}>FREE</span>
                </div>
                <div className="srow srow--save">
                  <span>You save</span>
                  <span>{hg.money(savedAmount)}</span>
                </div>
                <div className="srow srow--total">
                  <span>Total Payable</span>
                  <b>{hg.money(subtotal)}</b>
                </div>
                <p className="summary__note">Inclusive of all taxes · Free shipping across India · Cash on delivery available</p>
              </aside>
            </div>
          )}

          {doneOrder && (
            <div className="panel success">
              <div className="success__tick">✓</div>
              <h2>Order Placed Successfully</h2>
              <p>Thank you! Our wellness advisor will call you within 24 hours to confirm the delivery details.</p>
              <div className="success__id">{doneOrder.ref}</div>
              {!user && (
                <p className="form__note" style={{ marginTop: -14, marginBottom: 22 }}>
                  Note this order ID down — you can track the order with it and your mobile number any time, no account
                  needed.
                </p>
              )}
              <div style={{ textAlign: 'left', maxWidth: 460, margin: '0 auto 28px' }}>
                <div className="srow">
                  <span>Product</span>
                  <span style={{ textAlign: 'right' }}>
                    {doneOrder.product} × {doneOrder.qty}
                  </span>
                </div>
                <div className="srow">
                  <span>Payment</span>
                  <span>{doneOrder.payment}</span>
                </div>
                <div className="srow">
                  <span>Deliver to</span>
                  <span style={{ textAlign: 'right' }}>
                    {doneOrder.address.city} – {doneOrder.address.pincode}
                  </span>
                </div>
                <div className="srow srow--total">
                  <span>Total</span>
                  <b>{hg.money(doneOrder.total)}</b>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link className="btn btn--gold btn--lg" to={`/account?panel=track&id=${encodeURIComponent(doneOrder.id)}`}>
                  Track This Order
                </Link>
                {user ? (
                  <Link className="btn btn--outline btn--lg" to="/account">
                    View Order History
                  </Link>
                ) : (
                  <Link className="btn btn--outline btn--lg" to="/kings-man">
                    Continue Shopping
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer variant="checkout" />
    </main>
  );
}
