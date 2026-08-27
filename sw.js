// Magverse Service Worker — caches app shell only, never API responses or personal data
const CACHE_VERSION = 'magverse-v8';
const SHELL_URLS = [
  '/',
  '/index.html',
  '/App.jsx',
];

// On install: cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

// On activate: delete any old cache versions
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve shell from cache; pass everything else (API calls, CDN) straight to network
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never intercept: Anthropic API, external CDNs, stock/weather endpoints
  if (url.hostname !== self.location.hostname) {
    e.respondWith(fetch(e.request));
    return;
  }

  // App shell: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      // Only cache successful shell responses
      if (resp.ok && SHELL_URLS.some(u => url.pathname === u || url.pathname === '/')) {
        const clone = resp.clone();
        caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
      }
      return resp;
    }))
  );
});
