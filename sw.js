// Service Worker — Escáner XXIV Campeonato Regional del Sur (MDD 2026)
const CACHE_NAME = 'escaner-mdd2026-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// Instalación: precachear el shell de la app
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar cachés antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Estrategia: network-first para mantener datos frescos (escaneos en vivo),
// con fallback a caché para que la app abra incluso sin conexión.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo manejar peticiones GET de nuestro propio origen
  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Guardar copia en caché solo para el shell de la app (mismo origen)
        if (request.url.startsWith(self.location.origin)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
  );
});
