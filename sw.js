// sw.js - ControlaTuPeso+ v2.0 - Estrategia Stale-While-Revalidate

const CACHE_VERSION = 'v2.0.3';
const CACHE_NAME = `controlatupeso-cache-${CACHE_VERSION}`;

const urlsToCache = [
  // El "cascarón" de la app
  './',
  './index.html',
  './manifest.json',
  './iconos/icono-192.png',
  './iconos/icono-512.png',
  './iconos/icono-maskable-512.png',
  './videos/intro.webm',
  './videos/intro.mp4',

  // Librerías externas (CDNs)
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=Inter:wght@400;600;700&display=swap'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`Cache ${CACHE_NAME} abierta. Guardando recursos...`);
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Fallo al cachear recursos durante la instalación:', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('Borrando caché antigua:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
        return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            // Silenciamos el error de fetch fallido cuando no hay conexión.
            // El usuario recibirá la respuesta de la caché si existe.
        });
        return response || fetchPromise;
      });
    })
  );
});