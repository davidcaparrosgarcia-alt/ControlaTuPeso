// sw.js - ControlaTuPeso+ v2.0.5 - Estrategia Stale-While-Revalidate (Corregida)

const CACHE_VERSION = 'v2.0.5';
const CACHE_NAME = `controlatupeso-cache-${CACHE_VERSION}`;

// Lista de recursos esenciales para el "cascarón" de la app.
// Los vídeos se han eliminado de esta lista para evitar errores de caché parcial.
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './iconos/icono-192.png',
  './iconos/icono-512.png',
  './iconos/icono-maskable-512.png',
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=Inter:wght@400;600;700&display=swap'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  self.skipWaiting(); // Forza la activación del nuevo SW
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`Cache ${CACHE_NAME} abierta. Guardando recursos...`);
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Fallo al cachear recursos durante la instalación:', err))
  );
});

// Activación y limpieza de cachés antiguas
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

// Estrategia de Fetch: Stale-While-Revalidate
self.addEventListener('fetch', event => {
  // Ignorar peticiones que no sean GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignorar peticiones de vídeo para evitar el error de contenido parcial (206)
  if (event.request.url.includes('.mp4') || event.request.url.includes('.webm')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(responseFromCache => {
        // Obtener el recurso de la red en paralelo
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Solo cachear respuestas válidas y completas (status 200)
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
          // El fetch falla si no hay red. La app seguirá funcionando con la caché.
          console.warn('Fetch fallido; la app funciona desde la caché.', err);
        });

        // Devolver la respuesta de la caché si existe, si no, esperar a la de la red.
        return responseFromCache || fetchPromise;
      });
    })
  );
});