const CACHE_NAME = 'corte-san-girolamo-v6';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './assets/gallery.json',
  './assets/i18n.json',
  './assets/Home.jpg',
  './assets/logo.jpg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
].filter(Boolean);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => {
      if (key !== CACHE_NAME) return caches.delete(key);
    })))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(resp => resp || fetch(e.request).then(networkResp => {
        // stash a copy
        const copy = networkResp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
        return networkResp;
      }).catch(() => caches.match('./index.html')))
    );
  } else {
    e.respondWith(fetch(e.request).catch(() => new Response('Offline', {status: 503})));
  }
});