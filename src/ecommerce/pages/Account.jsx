import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopBar from '../components/layout/TopBar.jsx';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';
import PageHead from '../components/layout/PageHead.jsx';
import AuthPanel from '../components/account/AuthPanel.jsx';
import AccountSkeleton from '../components/account/AccountSkeleton.jsx';
import OrdersPanel from '../components/account/OrdersPanel.jsx';
import TrackPanel from '../components/account/TrackPanel.jsx';
import AddressesPanel from '../components/account/AddressesPanel.jsx';
import ProfilePanel from '../components/account/ProfilePanel.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as api from '../lib/api.js';

const PANELS = ['orders', 'track', 'address', 'profile'];

export default function Account() {
  const { user, ready, login, signup, logout, saveUser, changePassword, saveAddress, deleteAddress, setDefaultAddress } =
    useAuth();
  const [searchParams] = useSearchParams();

  const [activePanel, setActivePanel] = useState(() => {
    const panel = searchParams.get('panel');
    return PANELS.includes(panel) ? panel : 'orders';
  });
  const [presetTrackId, setPresetTrackId] = useState(searchParams.get('id') || '');
  const [orders, setOrders] = useState([]);
  // Starts true so the first paint after sign-in shows order skeletons rather
  // than the "no orders yet" empty state.
  const [ordersLoading, setOrdersLoading] = useState(true);
  // Addresses live on the server user, so they come straight from the session
  // rather than being mirrored into local state.
  const addresses = user?.addresses ?? [];

  const panelRef = useRef(null);
  const scrollPendingRef = useRef(false);
  const deepLinkAppliedRef = useRef(false);

  useEffect(() => {
    document.title = user ? 'My Account | Herbal Gujarat' : 'Sign In | Herbal Gujarat';
  }, [user]);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setOrdersLoading(true);
    try {
      const result = await api.myOrders();
      if (result.ok) setOrders(result.orders);
    } finally {
      setOrdersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    // Orders come from the server
    loadOrders();
  }, [user, loadOrders]);

  useEffect(() => {
    if (!user || deepLinkAppliedRef.current) return;
    deepLinkAppliedRef.current = true;
    const panel = searchParams.get('panel');
    if (panel && PANELS.includes(panel)) {
      setActivePanel(panel);
      const id = searchParams.get('id');
      if (id) setPresetTrackId(id);
    }
  }, [user, searchParams]);

  useEffect(() => {
    if (scrollPendingRef.current) {
      scrollPendingRef.current = false;
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activePanel]);

  function goToPanel(panel, options = {}) {
    setActivePanel(panel);
    if (options.scroll) scrollPendingRef.current = true;
  }

  function handleTrackFromOrders(id) {
    setPresetTrackId(id);
    goToPanel('track', { scroll: true });
  }

  async function handleCancelOrder(id) {
    const order = orders.find((o) => o.id === id);
    if (!window.confirm(`Cancel order ${order?.ref ?? id}? This cannot be undone.`)) return;
    const result = await api.cancelOrder(id);
    if (!result.ok) {
      window.alert(result.error);
      return;
    }
    loadOrders();
  }

  // Address writes go to the server and refresh the session user, so there is
  // no local list to keep in step.
  function handleSaveAddress(data) {
    return saveAddress(data);
  }

  async function handleDeleteAddress(id) {
    // Returning the result lets the panel show the failure inline rather than
    // in an alert box.
    if (!window.confirm('Delete this address?')) return { ok: true };
    return deleteAddress(id);
  }

  function handleLogout() {
    logout();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main>
      <TopBar />
      <Header />

      <PageHead
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'My Account' }]}
        title={
          user ? (
            <>
              My <span className="gold-text">Account</span>
            </>
          ) : (
            <>
              Sign In / <span className="gold-text">Register</span>
            </>
          )
        }
        subtitle={
          user
            ? `Welcome back, ${user.name.split(' ')[0]}. Here is everything in one place.`
            : 'Create a free account to book packs, track orders and manage your reviews.'
        }
      />

      <section className="section section--cream">
        <div className="wrap">
          {/* Held back until the stored token has been exchanged for a
              profile, so a returning customer never sees the sign-in form
              flash before their dashboard. */}
          {!ready && <AccountSkeleton />}

          {ready && !user && <AuthPanel login={login} signup={signup} />}

          {user && (
            <div className="dash">
              <aside className="dash__side">
                <div className="dash__me">
                  <div className="dash__av">{user.name.charAt(0).toUpperCase()}</div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <nav className="dnav">
                  <button type="button" className={activePanel === 'orders' ? 'is-active' : undefined} onClick={() => goToPanel('orders')}>
                    {/* The badge is held back rather than showing 0 and then
                        correcting itself a moment later. */}
                    <em>📦</em> My Orders{' '}
                    {!ordersLoading && <span className="dnav__count">{orders.length}</span>}
                  </button>
                  <button type="button" className={activePanel === 'track' ? 'is-active' : undefined} onClick={() => goToPanel('track')}>
                    <em>🚚</em> Track Order
                  </button>
                  <button type="button" className={activePanel === 'address' ? 'is-active' : undefined} onClick={() => goToPanel('address')}>
                    <em>📍</em> Addresses <span className="dnav__count">{addresses.length}</span>
                  </button>
                  <button type="button" className={activePanel === 'profile' ? 'is-active' : undefined} onClick={() => goToPanel('profile')}>
                    <em>👤</em> Profile
                  </button>
                  <button type="button" onClick={handleLogout}>
                    <em>↩</em> Sign Out
                  </button>
                </nav>
              </aside>

              <div ref={panelRef}>
                {activePanel === 'orders' && (
                  <OrdersPanel
                    orders={orders}
                    loading={ordersLoading}
                    onTrack={handleTrackFromOrders}
                    onCancel={handleCancelOrder}
                  />
                )}
                {activePanel === 'track' && <TrackPanel presetId={presetTrackId} />}
                {activePanel === 'address' && (
                  <AddressesPanel
                    addresses={addresses}
                    user={user}
                    onSave={handleSaveAddress}
                    onDelete={handleDeleteAddress}
                    onSetDefault={setDefaultAddress}
                  />
                )}
                {activePanel === 'profile' && <ProfilePanel user={user} saveUser={saveUser} changePassword={changePassword} />}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer variant="account" />
    </main>
  );
}
