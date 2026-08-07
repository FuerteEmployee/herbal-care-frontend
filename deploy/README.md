# Deploy routing

This project builds **two** HTML documents into `dist/`:

| Document     | App                    | Owns       |
| ------------ | ---------------------- | ---------- |
| `index.html` | storefront (`src/ecommerce`) | `/`          |
| `admin.html` | admin panel (`src/main.jsx`) | `/admin/*`   |

They are separate documents on purpose — see the comment at the top of
[`vite.config.js`](../vite.config.js) for why the two stylesheets cannot share
a page.

Both apps use `BrowserRouter`, so a URL like `/admin/login` is **not a file on
disk**. The web server has to answer it with the correct HTML document and let
the router take it from there.

The failure mode when this is not configured is easy to misread: the URL
returns **HTTP 200**, not 404. A generic SPA fallback (`try_files $uri
/index.html`) answers `/admin/login` with the *storefront* document, whose
router has no `/admin` route, so it renders its own "page not found". The
server looks fine; the wrong app is running.

Quick way to tell which document a URL got:

```sh
curl -s https://herbalgujratcare.com/admin/login | grep -o '<title>[^<]*</title>'
```

`Herbal Gujarat Admin` is correct. `Herbal Gujarat | Herbal King's Man` means
the storefront was served and routing is not configured.

## Which file to use

| Host                         | File                             | Where it goes                              |
| ---------------------------- | -------------------------------- | ------------------------------------------ |
| **nginx** (current) | [`nginx.conf`](nginx.conf)       | into the site's `server { }` block, then `nginx -t && systemctl reload nginx` |
| Apache / cPanel              | [`.htaccess`](.htaccess)         | document root, beside `index.html`         |
| Netlify                      | [`../public/_redirects`](../public/_redirects) | already in the build output |

`_redirects` is **Netlify-only**. On nginx and Apache it is an inert text file
— on the current server it is being served as a public download, which the
configs here also close off.

## The client-side safety net

`index.html` carries a small inline script that hands `/admin/*` over to
`admin.html`, and `admin.html` carries one that restores the requested URL. Together
they make deep links work on **any** host whose fallback is `index.html`, with no
server configuration at all — which is what keeps the panel reachable when the
config above has not been applied yet.

It is a fallback, not the fix. It costs an extra document load and a brief flash
of the storefront before the panel takes over. Configure the server and the
scripts stop running entirely: `index.html` is never served for an `/admin` URL,
so the handoff never triggers and the restore finds nothing to restore. The two
do not conflict, so the scripts can stay.

If you remove them, `/admin/*` breaks the moment the server config is missing —
which is the state the site shipped in.

## Rules

Whatever the host, the rules are the same and the order matters:

1. `/admin` → `admin.html`
2. `/admin/*` → `admin.html`
3. `/login` → `admin.html` (old bookmark; the panel forwards it to `/admin/login`)
4. everything else → `index.html`

The admin rules must come first, or the storefront catch-all takes `/admin/*`.

Dev and preview do the same thing in JavaScript — `adminHtmlFallback()` in
`vite.config.js`. **Keep all four in sync**: `vite.config.js`,
`public/_redirects`, `deploy/nginx.conf`, `deploy/.htaccess`. If a new
top-level admin URL is ever added, it has to be added to each.
