/*
 * Storefront data helpers.
 *
 * Accounts are NOT here any more — signing up, signing in, the profile and the
 * address book all go through lib/api.js to herbal-backend, so a customer is a
 * real User document in MongoDB. What is left in this file is the catalogue,
 * formatting helpers, and the order/review store, which is still browser-local:
 * those need real Product ids and a guest-order endpoint before they can move
 * server-side.
 *
 * Order and review records are tagged with the signed-in customer's server id
 * (or null for a guest), so they line up with the account once orders do move.
 */
import comboImage from '../assets/img/combo-offer.png';
import bottleImage from '../assets/img/bottle-front.png';

const K = {
  reviews: 'hg_reviews',
  cart: 'hg_cart',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    return true;
  } catch {
    return false;
  }
}

function uid(prefix) {
  return prefix + Math.random().toString(36).slice(2, 8).toUpperCase() + Date.now().toString(36).slice(-3).toUpperCase();
}

export const PRODUCTS = {
  combo: {
    sku: 'combo',
    name: "Herbal King's Man — Combo (Buy 1 Get 1 Free)",
    short: 'Combo Pack · 60 Capsules',
    price: 1499,
    mrp: 2999,
    img: comboImage,
  },
  single: {
    sku: 'single',
    name: "Herbal King's Man — Single Pack",
    short: 'Single Pack · 30 Capsules',
    price: 999,
    mrp: 1499,
    img: bottleImage,
  },
};

export const STAGES = [
  { key: 'confirmed', label: 'Order Confirmed', after: 0, note: 'We have received your order.' },
  { key: 'packed', label: 'Packed', after: 6, note: 'Your pack is sealed and ready for pickup.' },
  { key: 'shipped', label: 'Shipped', after: 24, note: 'Handed over to our courier partner.' },
  { key: 'out', label: 'Out for Delivery', after: 60, note: 'Arriving today — please keep your phone reachable.' },
  { key: 'delivered', label: 'Delivered', after: 84, note: 'Delivered. Thank you for choosing Herbal Gujarat.' },
];

/**
 * Where the order actually is, from the status the admin panel sets.
 *
 * The tracker shows five stages but the backend has four live ones — there is
 * no "out for delivery" status for staff to set, so that step stays pending
 * until the order is marked delivered. Reading real status beats the old
 * elapsed-time simulation: the customer sees what the warehouse sees.
 */
const STATUS_STAGE_INDEX = {
  pending: 0, // Order Confirmed
  processing: 1, // Packed
  shipped: 2, // Shipped
  delivered: 4, // Delivered
};

export function progress(order) {
  if (order.status === 'cancelled') {
    const cancelledAt = order.statusHistory?.find((h) => h.status === 'cancelled')?.at ?? order.placedAt;
    return { index: -1, label: 'Cancelled', stages: STAGES, eta: null, cancelled: true, cancelledAt };
  }

  const idx = STATUS_STAGE_INDEX[order.status] ?? 0;
  // Timestamps come from statusHistory where the admin has moved the order on,
  // so each completed step shows when it actually happened.
  const stampFor = (stageKey) => {
    const status = Object.keys(STATUS_STAGE_INDEX).find((s) => STAGES[STATUS_STAGE_INDEX[s]]?.key === stageKey);
    const hit = order.statusHistory?.find((h) => h.status === status);
    return hit?.at ?? null;
  };

  const eta = new Date(new Date(order.placedAt).getTime() + STAGES[STAGES.length - 1].after * 3600000);
  return {
    index: idx,
    label: STAGES[idx].label,
    stages: STAGES,
    stampFor,
    eta,
    delivered: order.status === 'delivered',
    cancelled: false,
  };
}

export function allReviews() {
  return read(K.reviews, []);
}

export function myReviews(userId) {
  if (!userId) return [];
  return allReviews().filter((r) => r.userId === userId);
}

/** `data.user` is the signed-in customer — reviews still require an account. */
export function addReview(data) {
  const me = data.user || null;
  if (!me) return { ok: false, error: 'Please sign in to write a review.' };
  const rating = parseInt(data.rating, 10);
  if (!rating || rating < 1 || rating > 5) return { ok: false, error: 'Please select a star rating.' };
  if (!data.text || data.text.trim().length < 10) {
    return { ok: false, error: 'Please write at least a couple of lines about your experience.' };
  }

  const review = {
    id: uid('R'),
    userId: me.id,
    name: me.name,
    city: me.city || '',
    orderId: data.orderId || '',
    product: data.product || PRODUCTS.combo.name,
    rating,
    title: (data.title || '').trim(),
    text: data.text.trim(),
    at: new Date().toISOString(),
  };
  const list = allReviews();
  list.unshift(review);
  write(K.reviews, list);
  // Orders live on the server now, so "already reviewed" is derived by the
  // Reviews panel from the review list rather than flagged on the order.
  return { ok: true, review };
}

export function deleteReview(id, userId) {
  if (!userId) return { ok: false, error: 'Please sign in first.' };
  write(
    K.reviews,
    allReviews().filter((r) => !(r.id === id && r.userId === userId)),
  );
  return { ok: true };
}

export function money(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

export function formatDate(iso, withTime) {
  const d = new Date(iso);
  const opt = { day: 'numeric', month: 'short', year: 'numeric' };
  if (withTime) {
    opt.hour = 'numeric';
    opt.minute = '2-digit';
  }
  return d.toLocaleDateString('en-IN', opt);
}

export function stars(n) {
  return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
}

/** Pending pack selection passed from product page → checkout. */
export function setPick(sku, qty) {
  write(K.cart, { sku, qty: qty || 1 });
}

export function getPick() {
  return read(K.cart, { sku: 'combo', qty: 1 });
}
