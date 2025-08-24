// sw.js - ControlaTuPeso+ v2.0.6 - Estrategia Stale-While-Revalidate (Corregida)

const CACHE_VERSION = 'v2.0.6';
const CACHE_NAME = `controlatupeso-cache-${CACHE_VERSION}`;

// Lista de recursos esenciales para el "cascarón" de la app.
// Se ha eliminado la URL de Google Fonts para garantizar una instalación de caché fiable.
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
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  // La URL de Google Fonts ha sido eliminada de esta lista.
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
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Estrategia para las peticiones a Google Fonts y CDNs: solo red.
  // Esto evita problemas de caché con respuestas opacas o redirecciones.
  if (event.request.url.startsWith('https://fonts.googleapis.com') || 
      event.request.url.startsWith('https://fonts.gstatic.com')) {
    return;
  }
  
  // Ignorar peticiones de vídeo para evitar el error de contenido parcial (206)
  if (event.request.url.includes('.mp4') || event.request.url.includes('.webm')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(responseFromCache => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Solo cachear respuestas válidas y completas
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
          // El fetch falla si no hay red.
          console.warn(`Fetch fallido para ${event.request.url}; la app podría funcionar desde la caché.`);
        });

        return responseFromCache || fetchPromise;
      });
    })
  );
});