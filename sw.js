// Cache para uso sin internet. Cambia VERSION al publicar una actualización.
const VERSION = "rs-v7";
const ARCHIVOS = ["./", "index.html", "trackers.js", "manifest.json", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Intenta la red (para recibir actualizaciones); si no hay señal en 3 s, usa la cache
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cacheada = await cache.match(e.request, { ignoreSearch: true });
    const red = fetch(e.request, { cache: "no-cache" })
      .then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; });
    if (!cacheada) return red;
    const espera = new Promise(ok => setTimeout(() => ok(cacheada), 3000));
    return Promise.race([red.catch(() => cacheada), espera]);
  }));
});
