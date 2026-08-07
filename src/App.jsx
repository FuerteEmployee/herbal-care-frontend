import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/ui/ToastContext'
import AdminLayout from './components/layout/AdminLayout'
import RequireAuth from './components/layout/RequireAuth'
import RouteGate from './components/layout/RouteGate'
import { getDefaultRedirectPath } from './constants/roles'

function AdminIndexRedirect() {
  const { hasPermission } = useAuth()
  return <Navigate to={getDefaultRedirectPath(hasPermission)} replace />
}

import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import OrdersPage from './pages/orders/OrdersPage'
import CustomersPage from './pages/customers/CustomersPage'
import LeadsPage from './pages/leads/LeadsPage'
import AdminsPage from './pages/admins/AdminsPage'

// ── Temporarily disabled ──────────────────────────────────────────────────
// Parked, not deleted — the page files and their API modules are untouched.
// Uncomment the import and its <Route> below, plus the matching NAV_ITEMS entry
// in constants/roles.js, to bring one back.
// import ProductsPage from './pages/products/ProductsPage'
// import CategoriesPage from './pages/categories/CategoriesPage'
import RolesPage from './pages/roles/RolesPage'
// import DeliveryPage from './pages/delivery/DeliveryPage'
// import PurchasePage from './pages/purchase/PurchasePage'
// import BlogsPage from './pages/blogs/BlogsPage'
// import ReviewsPage from './pages/reviews/ReviewsPage'
// ──────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ScrollToTop />
          {/* Everything lives under /admin, sign-in included, so the whole panel
              is one URL prefix — /admin/login, /admin/dashboard, /admin/products…
              /admin/login is declared as its own route rather than a child of the
              guarded /admin branch, otherwise reaching the login screen would
              itself require being logged in.

              `/` is not routed here: it belongs to the storefront, which is a
              separate document (index.html → src/ecommerce). This app is only
              ever served for the /admin prefix — see vite.config.js and
              public/_redirects. */}
          <Routes>
            <Route path="/admin/login" element={<LoginPage />} />
            {/* Old top-level bookmark. */}
            <Route path="/login" element={<Navigate to="/admin/login" replace />} />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              {/* RouteGate turns a nav item's moduleKey into a permission check,
                  so a plain admin hitting a superadmin-only URL directly gets the
                  access screen instead of the page. */}
              <Route index element={<AdminIndexRedirect />} />
              <Route path="dashboard" element={<RouteGate><DashboardPage /></RouteGate>} />
              <Route path="orders" element={<RouteGate><OrdersPage /></RouteGate>} />
              <Route path="users" element={<RouteGate><CustomersPage /></RouteGate>} />
              {/* Old path — the section was renamed Customers → Users. */}
              <Route path="customers" element={<Navigate to="/admin/users" replace />} />
              <Route path="leads" element={<RouteGate><LeadsPage /></RouteGate>} />
              <Route path="admins" element={<RouteGate><AdminsPage /></RouteGate>} />
              <Route path="roles" element={<RouteGate><RolesPage /></RouteGate>} />

              {/* Temporarily disabled — see the commented imports above.
              <Route path="products" element={<RouteGate><ProductsPage /></RouteGate>} />
              <Route path="products/add" element={<Navigate to="/admin/products" replace />} />
              <Route path="categories" element={<RouteGate><CategoriesPage /></RouteGate>} />
              <Route path="delivery" element={<RouteGate><DeliveryPage /></RouteGate>} />
              <Route path="purchase" element={<RouteGate><PurchasePage /></RouteGate>} />
              <Route path="blogs" element={<RouteGate><BlogsPage /></RouteGate>} />
              <Route path="reviews" element={<RouteGate><ReviewsPage /></RouteGate>} />
              */}
            </Route>
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
