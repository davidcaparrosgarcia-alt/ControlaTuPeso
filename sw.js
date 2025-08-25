// sw.js - ControlaTuPeso+ v2.0.9 - Estrategia de Caché Robusta

const CACHE_VERSION = 'v2.0.9';
const CACHE_NAME = `controlatupeso-cache-${CACHE_VERSION}`;

// Lista de recursos esenciales para el "cascarón" de la app.
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
  // Las fuentes y vídeos se cargarán desde la red, no se pre-cachean.
];

// --- INSTALACIÓN ---
self.addEventListener('install', event => {
  self.skipWaiting(); // Activa el nuevo SW inmediatamente
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`Cache ${CACHE_NAME} abierta. Guardando recursos uno por uno...`);
        // Usamos cache.add para cada recurso. Si uno falla, Promise.all no se romperá
        // y podremos ver en la consola cuál es el problemático.
        const promises = urlsToCache.map(url => {
          return cache.add(url).catch(reason => {
            console.error(`Fallo al cachear: ${url}`, reason);
          });
        });
        return Promise.all(promises);
      })
      .then(() => {
        console.log('Todos los recursos esenciales han sido procesados.');
      })
      .catch(err => {
        console.error('Fallo grave durante la apertura del cache:', err);
      })
  );
});

// --- ACTIVACIÓN Y LIMPIEZA ---
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

// --- ESTRATEGIA DE FETCH (Cache first, then network) ---
self.addEventListener('fetch', event => {
  const { request } = event;

  // Ignorar peticiones que no sean GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar peticiones de vídeo para evitar errores de contenido parcial
  if (request.url.includes('.mp4') || request.url.includes('.webm')) {
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // Si el recurso está en la caché, lo devolvemos inmediatamente.
      if (cachedResponse) {
        return cachedResponse;
      }

      // Si no está en la caché, vamos a la red.
      return fetch(request).then(networkResponse => {
        // No intentamos cachear la respuesta aquí para mantener la lógica simple
        // y evitar los errores de "put" que veías antes. La caché se llena
        // principalmente durante la instalación.
        return networkResponse;
      }).catch(() => {
        // Si tanto la caché como la red fallan, no podemos hacer nada.
        // Esto solo pasará si el usuario está sin conexión y pide algo
        // que no se guardó en la caché inicial.
      });
    })
  );
});