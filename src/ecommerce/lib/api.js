/*
 * Storefront account API — herbal-backend's /api/auth routes.
 *
 * This replaces the localStorage user store that used to live in hg.js: a
 * customer created here is a real User document in MongoDB, so the admin panel
 * sees them under Users and the account survives clearing the browser.
 *
 * Every call resolves to { ok: true, data } or { ok: false, error } rather than
 * throwing, because the account panels render `result.error` inline.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Shoppers expect to stay signed in across visits, so the token is kept in
// localStorage rather than sessionStorage (the admin panel makes the opposite
// trade deliberately — see src/api/tokenStore.js).
const TOKEN_KEY = 'hg_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode — the session just won't survive a reload */
  }
}

export function clearToken() {
  setToken(null);
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const token = auth ? getToken() : null;
  if (auth && !token) return { ok: false, error: 'Please sign in again.', status: 401 };

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    return { ok: false, error: 'Could not reach the server. Please check your connection and try again.', status: 0 };
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // A dead token should not leave the UI stuck in a half-signed-in state.
    // However, a wrong current password during password update should not log the user out.
    if (res.status === 401 && auth && path !== '/auth/me/password') clearToken();
    return {
      ok: false,
      error: data?.message || `Something went wrong (${res.status}). Please try again.`,
      status: res.status,
    };
  }

  return { ok: true, data };
}

/** Server address document → the shape the storefront forms use. */
export function mapAddress(a) {
  return {
    id: a._id,
    label: a.label || 'Home',
    name: a.fullName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 || '',
    city: a.city,
    state: a.state || 'Gujarat',
    pincode: a.pincode,
    isDefault: !!a.isDefault,
  };
}

/** …and back. Keeping `_id` means editing an address updates it in place. */
export function toApiAddress(a) {
  return {
    ...(a.id ? { _id: a.id } : {}),
    label: a.label || 'Home',
    fullName: a.name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 || '',
    city: a.city,
    state: a.state || 'Gujarat',
    pincode: a.pincode,
    isDefault: !!a.isDefault,
  };
}

export function mapUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    city: u.city || '',
    addresses: (u.addresses || []).map(mapAddress),
    joinedAt: u.createdAt,
  };
}

// POST /api/auth/register — returns a token, so a new account is signed in.
export async function register({ name, email, password, phone, city }) {
  const res = await request('/auth/register', {
    method: 'POST',
    body: { name, email, password, phone, city },
  });
  if (!res.ok) return res;
  setToken(res.data.token);
  return { ok: true, user: mapUser(res.data.user) };
}

// POST /api/auth/login
export async function login(email, password) {
  const res = await request('/auth/login', { method: 'POST', body: { email, password } });
  if (!res.ok) return res;
  setToken(res.data.token);
  return { ok: true, user: mapUser(res.data.user) };
}

// GET /api/auth/me — used on boot to turn a stored token back into a session.
export async function me() {
  const res = await request('/auth/me', { auth: true });
  if (!res.ok) return res;
  return { ok: true, user: mapUser(res.data.user) };
}

// PUT /api/auth/me — the controller patches only the fields it receives, so a
// profile save cannot wipe the address book and vice versa.
export async function updateProfile({ name, phone, city }) {
  const res = await request('/auth/me', { method: 'PUT', auth: true, body: { name, phone, city } });
  if (!res.ok) return res;
  return { ok: true, user: mapUser(res.data.user) };
}

// ───────────────────────────────────────────────────── saved addresses
// One address per request. The server validates each one and owns the "exactly
// one default" rule, so the storefront never rebuilds the whole list itself.
// Every call answers with the customer's full list, which the session merges in
// — these endpoints return { addresses }, not a whole user.

export async function listAddresses() {
  const res = await request('/auth/me/addresses', { auth: true });
  if (!res.ok) return res;
  return { ok: true, addresses: (res.data.addresses ?? []).map(mapAddress) };
}

export async function createAddress(address) {
  const res = await request('/auth/me/addresses', {
    method: 'POST',
    auth: true,
    body: { ...toApiAddress(address), isDefault: !!address.isDefault },
  });
  if (!res.ok) return res;
  return { ok: true, addresses: (res.data.addresses ?? []).map(mapAddress) };
}

export async function updateAddress(id, address) {
  const res = await request(`/auth/me/addresses/${encodeURIComponent(id)}`, {
    method: 'PUT',
    auth: true,
    body: { ...toApiAddress(address), isDefault: !!address.isDefault },
  });
  if (!res.ok) return res;
  return { ok: true, addresses: (res.data.addresses ?? []).map(mapAddress) };
}

export async function deleteAddress(id) {
  const res = await request(`/auth/me/addresses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: true,
  });
  if (!res.ok) return res;
  return { ok: true, addresses: (res.data.addresses ?? []).map(mapAddress) };
}

export async function setDefaultAddress(id) {
  const res = await request(`/auth/me/addresses/${encodeURIComponent(id)}/default`, {
    method: 'PUT',
    auth: true,
  });
  if (!res.ok) return res;
  return { ok: true, addresses: (res.data.addresses ?? []).map(mapAddress) };
}

export async function changePassword(currentPassword, newPassword) {
  return request('/auth/me/password', {
    method: 'PUT',
    auth: true,
    body: { currentPassword, newPassword },
  });
}

export function logout() {
  clearToken();
}

// ─────────────────────────────────────────────────────────── orders
// Orders live in MongoDB, which is what puts them in front of the admin panel.
// The client never sends a price — it sends a sku and a quantity, and the
// server prices the order from its own pack table.

/** Server order document → the shape the account screens render. */
export function mapOrder(o) {
  const item = o.items?.[0] ?? {};
  return {
    id: o._id,
    // Short, speakable reference for the confirmation screen and phone calls.
    // Orders placed before the field existed fall back to the id tail.
    ref: o.orderRef || `HG-${String(o._id ?? '').slice(-6).toUpperCase()}`,
    product: item.name ?? '',
    img: item.image ?? '',
    qty: item.quantity ?? 1,
    unitPrice: item.price ?? 0,
    total: o.totalAmount ?? 0,
    shipping: o.shippingCharge ?? 0,
    payment: o.paymentMethod === 'online' ? 'Online / UPI' : 'Cash on Delivery',
    status: o.orderStatus ?? 'pending',
    statusHistory: (o.statusHistory ?? []).map((h) => ({ status: h.status, at: h.changedAt, note: h.note ?? '' })),
    address: {
      name: o.shippingAddress?.fullName ?? '',
      phone: o.shippingAddress?.phone ?? '',
      line1: o.shippingAddress?.line1 ?? '',
      line2: o.shippingAddress?.line2 ?? '',
      city: o.shippingAddress?.city ?? '',
      state: o.shippingAddress?.state ?? '',
      pincode: o.shippingAddress?.pincode ?? '',
    },
    notes: o.notes ?? '',
    guest: !o.user,
    placedAt: o.createdAt,
  };
}

// POST /api/orders/storefront — works signed in or as a guest.
export async function placeOrder({ sku, qty, address, notes, email }) {
  const res = await request('/orders/storefront', {
    method: 'POST',
    // Sent when we have one so the order is tied to the account; harmless when
    // we do not, because the endpoint accepts guests.
    auth: !!getToken(),
    body: { sku, qty, address, notes, email },
  });
  if (!res.ok) return res;
  return { ok: true, order: mapOrder(res.data.order) };
}

export async function myOrders() {
  const res = await request('/orders/my?limit=50', { auth: true });
  if (!res.ok) return res;
  return { ok: true, orders: (res.data.orders ?? []).map(mapOrder) };
}

// GET /api/orders/track/:id?phone= — guests track with the id plus the mobile
// number on the order, so an id alone cannot expose someone's address.
export async function trackOrder(id, phone) {
  const res = await request(`/orders/track/${encodeURIComponent(id)}?phone=${encodeURIComponent(phone)}`);
  if (!res.ok) return res;
  return { ok: true, order: mapOrder(res.data.order) };
}

export async function cancelOrder(id) {
  const res = await request(`/orders/my/${encodeURIComponent(id)}/cancel`, { method: 'PUT', auth: true });
  if (!res.ok) return res;
  return { ok: true, order: mapOrder(res.data.order) };
}

export async function sendEnquiry({ name, email, phone, subject, message, source }) {
  const res = await request('/contact', {
    method: 'POST',
    body: { name, email, phone, subject, message, source },
  });
  if (!res.ok) {
    throw new Error(res.error || 'Could not save your enquiry. Please check your network and try again.');
  }
  return res;
}

