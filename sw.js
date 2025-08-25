// sw.js - ControlaTuPeso+ v2.0.9 - Estrategia de Caché Robusta (Final)

const CACHE_VERSION = 'v2.0.9';
const CACHE_NAME = `controlatupeso-cache-${CACHE_VERSION}`;

// Lista de recursos ESENCIALES y LOCALES para el "cascarón" de la app.
// Usamos rutas absolutas (empezando con /) para evitar ambigüedades.
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/iconos/icono-192.png',
  '/iconos/icono-512.png',
  '/iconos/icono-maskable-512.png'
];

// --- INSTALACIÓN ---
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`[SW] Cache ${CACHE_NAME} abierta. Guardando App Shell...`);
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => {
        console.log('[SW] App Shell cacheada con éxito.');
      })
      .catch(err => {
        console.error('[SW] Fallo al cachear el App Shell durante la instalación:', err);
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
            console.log('[SW] Borrando caché antigua:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Service Worker activado y reclamando clientes.');
      return self.clients.claim();
    })
  );
});

// --- ESTRATEGIA DE FETCH (Stale-While-Revalidate) ---
self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (request.url.includes('.mp4') || request.url.includes('.webm')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          // Si la petición es exitosa, actualizamos la caché
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
          // Si la red falla, no hacemos nada, ya que devolveremos la respuesta de la caché si existe.
        });

        // Devolvemos la respuesta de la caché si existe, si no, esperamos a la de la red.
        return cachedResponse || fetchPromise;
      });
    })
  );
});```

### Plan de Acción Final (Súper Importante)

1.  **Reemplaza** los contenidos de `index.html` y `sw.js` con los códigos que te he dado.
2.  **Sube ambos archivos** a Netlify.
3.  Abre las **Herramientas de Desarrollador** (F12) en tu navegador.
4.  Ve a la pestaña **"Aplicación"** -> **"Service Workers"**.
5.  Marca **"Actualizar al volver a cargar"** ("Update on reload").
6.  Haz clic en **"Anular registro"** ("Unregister").
7.  Haz clic derecho en el botón de recargar del navegador y selecciona **"Vaciar la caché y volver a cargar de manera forzada"** ("Empty Cache and Hard Reload").

Con estos cambios, la aplicación tiene que funcionar. El error de sintaxis está corregido y la lógica del Service Worker es ahora estándar y robusta, evitando los problemas con los CDNs y las rutas.

De nuevo, lamento sinceramente todo este proceso. Confío en que esta es la solución definitiva.