import React from 'react';
import { Link } from 'react-router-dom';
import * as hg from '../../lib/hg.js';

/** One order card's worth of placeholder, shaped like the real thing. */
function OrderCardSkeleton() {
  return (
    <article className="ocard" aria-hidden="true">
      <div className="ocard__top">
        <div className="skel-stack">
          <div className="skel skel--line" style={{ '--w': '120px' }} />
          <div className="skel skel--line" style={{ '--w': '170px' }} />
        </div>
        <div className="skel skel--pill" />
      </div>
      <div className="skel-row" style={{ padding: '16px 0' }}>
        <div className="skel skel--thumb" />
        <div className="skel-stack" style={{ flex: 1 }}>
          <div className="skel skel--line" style={{ '--w': '65%' }} />
          <div className="skel skel--line" style={{ '--w': '35%' }} />
        </div>
      </div>
      <div className="skel-row" style={{ gap: 10 }}>
        <div className="skel skel--btn" />
        <div className="skel skel--btn" style={{ '--w': '96px' }} />
      </div>
    </article>
  );
}

export default function OrdersPanel({ orders, loading, onTrack, onCancel }) {
  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <h2>My Orders</h2>
          <p>Every order you have placed with Herbal Gujarat.</p>
        </div>
        <Link to="/checkout" className="btn btn--gold btn--sm">
          Book Again
        </Link>
      </div>

      <div className="orders">
        {/* Skeletons rather than the empty state while the list is in flight —
            "No orders yet" flashing up in front of someone who has orders is
            worse than showing nothing. */}
        {loading && [0, 1, 2].map((i) => <OrderCardSkeleton key={i} />)}

        {!loading && !orders.length && (
          <div className="empty">
            <em>📦</em>
            <h3>No orders yet</h3>
            <p>You have not placed an order with us so far. The Buy 1 Get 1 Free combo is a good place to start.</p>
            <Link to="/checkout" className="btn btn--gold">
              Book Your First Pack
            </Link>
          </div>
        )}

        {!loading && orders.map((order) => {
          const pr = hg.progress(order);
          const canCancel = !pr.cancelled && pr.index < 3;
          return (
            <article className="ocard" key={order.id}>
              <div className="ocard__top">
                <div className="ocard__id">
                  {order.ref}
                  <span>Placed {hg.formatDate(order.placedAt, true)}</span>
                </div>
                {pr.cancelled ? (
                  <span className="pill pill--cancel">Cancelled</span>
                ) : pr.delivered ? (
                  <span className="pill pill--done">Delivered</span>
                ) : (
                  <span className="pill pill--active">{pr.label}</span>
                )}
              </div>
              <div className="ocard__body">
                <div className="ocard__info">
                  <h4>{order.product}</h4>
                  <p>
                    {order.product} · Qty {order.qty}
                  </p>
                  <p>Payment: {order.payment}</p>
                  <p style={{ color: '#9aa093' }}>
                    Deliver to: {order.address.name}, {order.address.city} – {order.address.pincode}
                  </p>
                </div>
                <div className="ocard__amt">
                  <b>{hg.money(order.total)}</b>
                  <span>Free shipping</span>
                </div>
              </div>
              <div className="ocard__foot">
                <button type="button" className="btn btn--green btn--sm" onClick={() => onTrack(order.id)}>
                  Track Order
                </button>
                {canCancel && (
                  <button type="button" className="btn btn--danger btn--sm" onClick={() => onCancel(order.id)}>
                    Cancel Order
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
