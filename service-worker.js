
const CACHE = "pwa-v1";
const ASSETS = ["./", "./index.html", "./styles.css", "./app.js", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/apple-touch-icon-180.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});

// Cache-first for same-origin; network for cross-origin (maps/WA/weather).
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(resp => {
        try { 
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(req, copy)); 
        } catch(e) { /* ignore */ }
        return resp;
      }).catch(() => cached))
    );
  }
});
