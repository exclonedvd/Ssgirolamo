const CACHE_NAME = 'corte-san-girolamo-v3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './planner.js',
  './manifest.webmanifest',
  './assets/gallery.json',
  './assets/i18n.json',
  './assets/Home.jpg',
  './assets/logo.jpg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './offline.html',
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
  const req = e.request;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith((async ()=>{
      try {
        const fresh = await fetch(req);
        const copy = fresh.clone();
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, copy);
        return fresh;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('./index.html')) || (await cache.match('./offline.html')) || new Response('Offline', {status: 503});
      }
    })());
    return;
  }
  // existing handler below
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(resp => resp || fetch(e.request).then(networkResp => {
        // stash a copy
        const copy = networkResp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
        return networkResp;
      }).catch(() => caches.match('./offline.html')))
    );
  } else {
    e.respondWith(fetch(e.request).catch(() => new Response('Offline', {status: 503})));
  }
});