#!/usr/bin/env node
/**
 * Minimal static file server for E2E tests — zero dependencies.
 *
 * The apps are single-file HTML with no build step, so Playwright just needs
 * something to serve the repo root over http. Usage: node scripts/serve.js [port]
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = parseInt(process.argv[2] || process.env.PORT || '4173', 10);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  let rel = decodeURIComponent((req.url || '/').split('?')[0]);
  if (rel === '/') rel = '/index.html';
  // Local stand-ins for the Vercel rewrites (api/job-og, api/event-og): serve
  // the static shell so job/event share URLs work in local dev + E2E too.
  else if (rel === '/job') rel = '/careers.html';
  else if (rel === '/event' || rel === '/event.html') rel = '/event-shell.html';
  // Content Studio was renamed from events-admin — keep the old path working.
  else if (rel === '/events-admin' || rel === '/events-admin.html') rel = '/content-studio.html';
  // Emulate Vercel's cleanUrls: /careers -> /careers.html when the file exists.
  else if (!path.extname(rel)) {
    try { if (fs.existsSync(path.join(ROOT, rel + '.html'))) rel = rel + '.html'; } catch (_) {}
  }
  // Contain to the repo root — no path traversal.
  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      // Serve the custom 404 page (mirrors Vercel serving /404.html), else plain text.
      fs.readFile(path.join(ROOT, '404.html'), (e2, page) => {
        if (e2) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return; }
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(page);
      });
      return;
    }
    // Dev server: never let the browser cache assets, so edits to shared files
    // (site-chrome.css/js, etc.) always show on reload without a hard refresh.
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.end(buf);
  });
});

server.listen(PORT, () => console.log('Static server on http://127.0.0.1:' + PORT + ' (root: ' + ROOT + ')'));
