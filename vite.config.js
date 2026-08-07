import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = dirname(fileURLToPath(import.meta.url))

// Two apps, one project. The storefront (src/ecommerce) owns `/`, the admin
// panel (src/main.jsx) owns `/admin/*`, and each gets its own HTML document
// rather than sharing one router.
//
// They have to be separate documents: the storefront's assets/css/style.css is
// unlayered and restyles bare `body`, `a`, `button`, `h1`–`h4`, while the panel
// is Tailwind, whose rules all sit in @layer base / @layer utilities. Unlayered
// CSS outranks *any* layered rule regardless of specificity, so loading both
// into one page would let the storefront's reset override every utility class
// in the panel — and both files define :root { --ink; --shadow-sm } with
// different values. Separate documents keep each stylesheet to its own app.
const HTML = { main: 'index.html', admin: 'admin.html' }

/**
 * Both apps use BrowserRouter, so deep links need an HTML fallback. Vite's
 * built-in one always resolves to index.html, which would hand /admin/orders
 * the storefront. This maps the panel's URLs to admin.html first and leaves
 * everything else — including /admin.html itself and all asset requests — to
 * Vite's own fallback.
 *
 * Keep this list in sync with public/_redirects, which does the same job in
 * production; dev, preview and the deployed site should agree on who serves
 * what. /login is here because the panel still redirects that old bookmark on
 * to /admin/login.
 */
function adminHtmlFallback() {
  const isAdminUrl = (path) =>
    path === '/admin' || path === '/login' || path.startsWith('/admin/')

  const rewrite = (req, _res, next) => {
    if (isAdminUrl((req.url || '').split('?')[0])) req.url = '/admin.html'
    next()
  }
  // Block bodies on purpose: `middlewares.use()` returns the connect app, which
  // is itself a function, and Vite treats a returned function as a post-hook to
  // invoke with no arguments — which crashes the server on startup.
  return {
    name: 'admin-html-fallback',
    configureServer(server) {
      server.middlewares.use(rewrite)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), adminHtmlFallback()],
  server: { port: 5173, strictPort: true },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, HTML.main),
        admin: resolve(root, HTML.admin),
      },
    },
  },
})
