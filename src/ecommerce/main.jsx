import React, { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './assets/css/style.css';

const container = document.getElementById('root');

const tree = (
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

// scripts/prerender.js bakes the Home route's first render into this div at
// build time (see entry-server.jsx), so the browser already has real pixels
// to paint before this script ever runs. hydrateRoot attaches to that markup
// instead of discarding and re-rendering it — createRoot would wipe it and
// pay the full render cost again, throwing away the whole point of
// prerendering. Every other route (nothing is prerendered for them) still
// mounts into an empty div exactly as before, so this only changes behavior
// for "/".
if (container.hasChildNodes()) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
