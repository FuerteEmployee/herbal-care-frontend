// Nav structure only. `moduleKey` maps an entry to a permission prefix — the
// nav item and its route are visible when the logged-in admin has
// "<moduleKey>.view"; `null` means every signed-in admin can see it.
//
// The permission list comes from the server: each admin points at a Role
// document, and login / /admin/me return the resolved keys. Ticking or
// clearing "<moduleKey>.view" on the Roles screen is therefore what shows or
// hides a sidebar entry — the keys here must match herbal-backend's
// src/config/permissions.js.
//
// Labels are the noun the screen manages, not a description of the action —
// "Products", not "Products Add" — so the rail reads as a list of sections.
export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard', moduleKey: 'dashboard' },
  { label: 'Orders', path: '/admin/orders', icon: 'ShoppingCart', moduleKey: 'orders' },
  // "Users" matches the backend model (src/models/User.js). moduleKey stays
  // 'customers' because that string is the permission key in admin.api.js —
  // it's internal and never shown.
  { label: 'Users', path: '/admin/users', icon: 'Users', moduleKey: 'customers' },
  { label: 'Enquiries', path: '/admin/leads', icon: 'MessageSquare', moduleKey: 'leads' },

  // ── Temporarily hidden ───────────────────────────────────────────────────
  // Parked, not deleted: the pages and their API modules are untouched on disk.
  // Uncomment a line here and its matching <Route> in App.jsx to bring one back.
  // { label: 'Products', path: '/admin/products', icon: 'Package', moduleKey: 'products' },
  // { label: 'Categories', path: '/admin/categories', icon: 'Tags', moduleKey: 'categories' },
  // { label: 'Deliveries', path: '/admin/delivery', icon: 'Truck', moduleKey: 'delivery' },
  // { label: 'Purchases', path: '/admin/purchase', icon: 'FileText', moduleKey: 'purchase' },
  // { label: 'Blogs', path: '/admin/blogs', icon: 'BookOpen', moduleKey: 'blogs' },
  // { label: 'Reviews', path: '/admin/reviews', icon: 'Star', moduleKey: 'reviews' },
  // ─────────────────────────────────────────────────────────────────────────

  // Superadmin only — the role endpoints are superadmin-gated server-side, and
  // "roles.*" is withheld from the default admin permission set, so these two
  // entries and their routes stay hidden for a plain admin.
  { label: 'Admin Users', path: '/admin/admins', icon: 'ShieldCheck', moduleKey: 'roles' },
  { label: 'Roles', path: '/admin/roles', icon: 'KeyRound', moduleKey: 'roles' },
]

// Longest-prefix match, same convention the old per-item roles list used.
export function findNavItem(path) {
  const candidates = NAV_ITEMS.filter((item) => path === item.path || path.startsWith(`${item.path}/`))
  if (candidates.length === 0) return undefined
  return candidates.reduce((a, b) => (b.path.length > a.path.length ? b : a))
}

/** Computes the first section the admin has permission to view */
export function getDefaultRedirectPath(hasPermission) {
  for (const item of NAV_ITEMS) {
    if (!item.moduleKey || hasPermission(`${item.moduleKey}.view`)) {
      return item.path;
    }
  }
  return '/admin/dashboard';
}
