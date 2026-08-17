import React, { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

/*
 * Build-time-only entry point (see scripts/prerender.js). Renders exactly the
 * same component tree main.jsx hydrates on the client — StrictMode +
 * <Router> + AuthProvider + App — swapping BrowserRouter for StaticRouter
 * since there is no `window`/history here. Whatever this produces for "/" is
 * what gets baked into dist/index.html's #root, so it has to match the
 * client's first render exactly or React logs a hydration mismatch and
 * patches over the difference (see the comment in scripts/prerender.js for
 * what happens if it doesn't).
 *
 * Only "/" is ever prerendered — every other route is a lazy chunk the
 * visitor never sees until they've already navigated client-side, so there's
 * no first-paint benefit to prerendering them and no reason to take on the
 * risk of SSR-ing pages that were never audited for it.
 */
export function render(url) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </StaticRouter>
    </StrictMode>,
  );
}
