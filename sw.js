// Magverse Service Worker — caches app shell only, never API responses or personal data
const CACHE_VERSION = 'magverse-v11';
// App.jsx is NOT cached here — the ?v=XX query param in index.html + browser HTTP cache handles it.
// Only cache the minimal shell needed for offline load.
const SHELL_URLS = [
  '/',
  '/index.html',
];

// On install: cache the shell and immediately take over
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

// On activate: delete all old cache versions and claim all clients so the update takes effect immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for App.jsx (always get latest); cache-first for shell; passthrough for external
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never intercept external requests (APIs, CDNs)
  if (url.hostname !== self.location.hostname) {
    e.respondWith(fetch(e.request));
    return;
  }

  // App.jsx: always network-first so updates are never stuck
  if (url.pathname === '/App.jsx') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Shell (index.html, /): cache-first with network fallback
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      if (resp.ok && SHELL_URLS.some(u => url.pathname === u || url.pathname === '/')) {
        const clone = resp.clone();
        caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
      }
      return resp;
    }))
  );
});
