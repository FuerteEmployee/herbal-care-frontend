import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * Postbuild step: makes dist/index.html's stylesheet non-render-blocking by
 * inlining src/ecommerce/assets/css/critical.css (see the comment in that
 * file for what it contains and how it was generated) directly into <head>,
 * then turning Vite's auto-injected `<link rel="stylesheet">` for the full
 * ~52KB style.css into the same print-media-swap pattern index.html already
 * uses for the Google Fonts link — downloaded in parallel, applied the
 * instant it arrives, never blocking first paint.
 *
 * This only touches dist/index.html (the storefront). admin.html's stylesheet
 * is untouched — the admin panel is behind a login, isn't measured for this
 * effort, and critical.css was extracted from the storefront's Home route
 * specifically, so it has no bearing on the admin bundle's CSS.
 */

const root = dirname(fileURLToPath(import.meta.url)).replace(/[\\/]scripts$/, '');
const distIndexPath = resolve(root, 'dist/index.html');
const criticalCssPath = resolve(root, 'src/ecommerce/assets/css/critical.css');

function run() {
  const criticalCss = readFileSync(criticalCssPath, 'utf-8');
  let html = readFileSync(distIndexPath, 'utf-8');

  const linkPattern = /<link rel="stylesheet" crossorigin href="([^"]+\.css)">/;
  const match = html.match(linkPattern);
  if (!match) {
    throw new Error('inline-critical-css: expected a `<link rel="stylesheet" crossorigin href="...">` in dist/index.html — did Vite\'s CSS output tag change shape?');
  }
  const cssHref = match[1];

  const deferredLink = [
    `<link rel="preload" as="style" crossorigin href="${cssHref}" />`,
    `<link rel="stylesheet" crossorigin href="${cssHref}" media="print" onload="this.media='all'" />`,
    `<noscript><link rel="stylesheet" crossorigin href="${cssHref}" /></noscript>`,
  ].join('\n    ');

  html = html.replace(linkPattern, deferredLink);
  html = html.replace('</head>', `<style>${criticalCss}</style>\n  </head>`);

  writeFileSync(distIndexPath, html);
  console.log('[inline-critical-css] inlined %s KB of critical CSS, deferred %s.', (criticalCss.length / 1024).toFixed(1), cssHref);
}

run();
