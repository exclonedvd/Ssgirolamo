
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('csg-v1').then((cache) => cache.addAll([
      '/',
      '/content.json',
      '/icons/icon-192.png',
      '/icons/icon-512.png'
    ]))
  );
});
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
