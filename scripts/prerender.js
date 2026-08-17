import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

/*
 * Postbuild step: bakes the Home route's first render into dist/index.html so
 * the browser has real pixels to paint before React's JS has even finished
 * downloading, let alone parsing and executing.
 *
 * Measured on this build (4x CPU throttle, matching Lighthouse's mobile
 * preset): the hero image, main.js, framework.js and the stylesheet are all
 * fetched within ~60ms, but first paint didn't happen until ~1250ms — the
 * entire gap was React's JS parse/compile/execute before there was any DOM to
 * paint. main.jsx now hydrates onto this markup with hydrateRoot instead of
 * replacing it with createRoot, so the browser can show it immediately and
 * React attaches to the existing nodes once it's ready, rather than
 * discarding them and re-rendering from scratch.
 *
 * This only ever prerenders "/" — see the comment in entry-server.jsx for why
 * every other route is left alone.
 *
 * The render must come from a real `vite build --ssr` pass, not a dev-mode
 * `ssrLoadModule` — dev-mode resolves image imports to their unbundled
 * `/src/...` dev paths, which don't exist in the deployed dist/ output at
 * all (they'd 404 in production). A production SSR build resolves them to
 * the same content-hashed `/assets/...` URLs the client build already
 * produced, since Vite's asset hashing is by file content, not build order.
 */

const root = dirname(fileURLToPath(import.meta.url)).replace(/[\\/]scripts$/, '');
const distIndexPath = resolve(root, 'dist/index.html');
const ssrOutDir = resolve(root, 'dist-server');

async function run() {
  // Invoked via `node <vite/bin/vite.js>` rather than the node_modules/.bin
  // shim — the .cmd shim needs `shell: true` on Windows, which then requires
  // passing the whole command as an unescaped string instead of an argv
  // array. Running the real JS entry directly under node sidesteps the shell
  // entirely, argv stays a real array, and it works the same on every OS.
  const viteBinJs = resolve(root, 'node_modules/vite/bin/vite.js');
  execFileSync(
    process.execPath,
    [viteBinJs, 'build', '--ssr', 'src/ecommerce/entry-server.jsx', '--outDir', 'dist-server'],
    { cwd: root, stdio: 'inherit' },
  );

  try {
    const { render } = await import(pathToFileURL(resolve(ssrOutDir, 'entry-server.js')).href);
    const appHtml = render('/');

    const template = readFileSync(distIndexPath, 'utf-8');
    if (!template.includes('<div id="root"></div>')) {
      throw new Error('prerender: expected an empty <div id="root"></div> in dist/index.html — has the template changed?');
    }
    const withMarkup = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
    writeFileSync(distIndexPath, withMarkup);
    console.log('[prerender] Home route baked into dist/index.html (%s KB of markup).', (appHtml.length / 1024).toFixed(1));
  } finally {
    // Build-time artifact only — never meant to ship, and it duplicates the
    // whole public/ folder alongside it, so clean it up unconditionally.
    rmSync(ssrOutDir, { recursive: true, force: true });
  }
}

run().catch((err) => {
  console.error('[prerender] failed:', err);
  process.exit(1);
});
