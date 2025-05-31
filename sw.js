/*
 * Service Worker - Club Andino Águila Azul
 * PWA (Progressive Web App) functionality
 * 86 años promoviendo el montañismo en Chile
 */

const CACHE_NAME = 'club-andino-aguila-azul-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Archivos a cachear para funcionamiento offline
const STATIC_CACHE_FILES = [
    '/',
    '/index.html',
    '/socios.html',
    '/reservas.html',
    '/css/styles.css',
    '/js/main.js',
    '/manifest.json',
    // Iconos PWA
    '/icons/favicon.svg',
    // Fuentes del sistema (fallback)
    // Nota: Las fuentes del sistema no necesitan ser cacheadas
];

// Rutas que siempre deben intentar la red primero
const NETWORK_FIRST_ROUTES = [
    '/reservas.html',
    '/socios.html'
];

// Rutas que pueden funcionar desde caché
const CACHE_FIRST_ROUTES = [
    '/css/',
    '/js/',
    '/icons/',
    '/images/'
];

// === INSTALACIÓN DEL SERVICE WORKER ===
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Service Worker: Cacheando archivos estáticos');
                return cache.addAll(STATIC_CACHE_FILES);
            })
            .then(() => {
                console.log('✅ Service Worker: Instalación completada');
                // Forzar que el nuevo service worker se active inmediatamente
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Service Worker: Error en instalación:', error);
            })
    );
});

// === ACTIVACIÓN DEL SERVICE WORKER ===
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker: Activando...');
    
    event.waitUntil(
        Promise.all([
            // Limpiar cachés antiguos
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Service Worker: Eliminando caché antiguo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Tomar control de todas las páginas inmediatamente
            self.clients.claim()
        ]).then(() => {
            console.log('✅ Service Worker: Activación completada');
        })
    );
});

// === INTERCEPTAR PETICIONES DE RED ===
self.addEventListener('fetch', event => {
    // Solo manejar peticiones HTTP/HTTPS
    if (!event.request.url.startsWith('http')) {
        return;
    }

    // Ignorar peticiones a APIs externas específicas
    if (event.request.url.includes('formspree.io') || 
        event.request.url.includes('google-analytics.com') ||
        event.request.url.includes('googletagmanager.com')) {
        return;
    }

    const url = new URL(event.request.url);
    const path = url.pathname;

    // Estrategia basada en el tipo de recurso
    if (isNetworkFirst(path)) {
        event.respondWith(networkFirst(event.request));
    } else if (isCacheFirst(path)) {
        event.respondWith(cacheFirst(event.request));
    } else {
        event.respondWith(staleWhileRevalidate(event.request));
    }
});

// === ESTRATEGIAS DE CACHÉ ===

// Network First: Intenta red primero, caché como fallback
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Si la respuesta es exitosa, actualizar caché
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('🌐 Service Worker: Red no disponible, usando caché para:', request.url);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Si no hay caché disponible, mostrar página offline
        return await caches.match(OFFLINE_URL) || new Response('Página no disponible offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Cache First: Intenta caché primero, red como fallback
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // Opcional: actualizar caché en background
        fetch(request).then(response => {
            if (response.ok) {
                const cache = caches.open(CACHE_NAME);
                cache.then(c => c.put(request, response));
            }
        }).catch(() => {
            // Silenciar errores de red en background
        });
        
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('❌ Service Worker: Error obteniendo recurso:', request.url);
        return new Response('Recurso no disponible', {
            status: 404,
            statusText: 'Not Found'
        });
    }
}

// Stale While Revalidate: Devuelve caché y actualiza en background
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Actualizar en background
    const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => {
        // Silenciar errores si hay caché disponible
        return cachedResponse;
    });
    
    // Devolver caché inmediatamente si está disponible
    return cachedResponse || fetchPromise;
}

// === FUNCIONES AUXILIARES ===

function isNetworkFirst(path) {
    return NETWORK_FIRST_ROUTES.some(route => path.includes(route));
}

function isCacheFirst(path) {
    return CACHE_FIRST_ROUTES.some(route => path.includes(route));
}

// === MANEJO DE MENSAJES ===
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: CACHE_NAME,
            timestamp: new Date().toISOString()
        });
    }
});

// === SYNC EN BACKGROUND ===
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync-reservas') {
        event.waitUntil(syncReservations());
    }
});

async function syncReservations() {
    try {
        // Aquí iría la lógica para sincronizar reservas cuando hay conexión
        console.log('🔄 Service Worker: Sincronizando reservas...');
        
        // En una implementación real, aquí buscaríamos reservas pendientes
        // en IndexedDB y las enviaríamos al servidor
        
        return Promise.resolve();
    } catch (error) {
        console.error('❌ Service Worker: Error sincronizando reservas:', error);
        throw error;
    }
}

// === NOTIFICACIONES PUSH ===
self.addEventListener('push', event => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body || 'Nueva notificación del Club Andino Águila Azul',
        icon: '/icons/favicon.svg',
        badge: '/icons/favicon.svg',
        tag: data.tag || 'club-notification',
        data: data.data || {},
        actions: [
            {
                action: 'view',
                title: 'Ver',
                icon: '/icons/favicon.svg'
            },
            {
                action: 'dismiss',
                title: 'Cerrar',
                icon: '/icons/favicon.svg'
            }
        ],
        vibrate: [200, 100, 200],
        requireInteraction: true
    };
    
    event.waitUntil(
        self.registration.showNotification(
            data.title || 'Club Andino Águila Azul',
            options
        )
    );
});

// === MANEJO DE CLICS EN NOTIFICACIONES ===
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'view') {
        // Abrir la aplicación
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                // Si la app ya está abierta, enfocarla
                for (const client of clientList) {
                    if (client.url.includes('club_andino_aguila_azul') && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Si no está abierta, abrir nueva ventana
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    } else if (event.action === 'dismiss') {
        // Solo cerrar la notificación (ya se hizo arriba)
        return;
    } else {
        // Clic en el cuerpo de la notificación
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    }
});

// === MANEJO DE ERRORES ===
self.addEventListener('error', event => {
    console.error('❌ Service Worker: Error global:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('❌ Service Worker: Promise rechazada:', event.reason);
});

// === INFORMACIÓN DEL SERVICE WORKER ===
console.log(`
🏔️ Club Andino Águila Azul - Service Worker
📦 Cache: ${CACHE_NAME}
⚡ PWA Habilitada
🗓️ 86 años promoviendo el montañismo en Chile
`);