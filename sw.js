// sw.js - ControlaTuPeso+ v2.0.7 - Estrategia Stale-While-Revalidate (Versión de Producción)

const CACHE_VERSION = 'v2.0.7';
const CACHE_NAME = `controlatupeso-cache-${CACHE_VERSION}`;

// Lista de recursos esenciales para el "cascarón" de la app.
// Ahora se usan las URLs de PRODUCCIÓN para React.
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './iconos/icono-192.png',
  './iconos/icono-512.png',
  './iconos/icono-maskable-512.png',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  // Las fuentes y los vídeos se cargarán desde la red, no se cachean aquí.
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`Cache ${CACHE_NAME} abierta. Guardando recursos...`);
        // Usamos peticiones individuales para depurar mejor si algo falla
        const promises = urlsToCache.map(url => {
          return fetch(url, { mode: 'no-cors' }) // 'no-cors' para los CDNs
            .then(response => cache.put(url, response))
            .catch(err => console.error(`Fallo al cachear ${url}:`, err));
        });
        return Promise.all(promises);
      })
      .catch(err => console.error('Fallo grave durante la instalación del cache:', err))
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
        console.log('Service Worker activado y reclamando clientes.');
        return self.clients.claim();
    })
  );
});

// Estrategia de Fetch
self.addEventListener('fetch', event => {
  const { request } = event;

  // Ignorar peticiones que no sean GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Para los CDNs y archivos de la app, usar la estrategia "Stale-While-Revalidate"
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(cachedResponse => {
        const fetchedResponse = fetch(request).then(networkResponse => {
          // Solo cachear si la respuesta es válida
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            console.warn(`Fetch fallido para: ${request.url}`);
        });
        
        // Devolver desde la caché primero, y si no, esperar a la red
        return cachedResponse || fetchedResponse;
      });
    })
  );
});