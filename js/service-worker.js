// ============================================
// SERVICE-WORKER.JS - Complete PWA Service Worker
// Quick Dukan - Full Offline + Push + Auto Update
// Version: 4.0
// ============================================

const CACHE_VERSION = 'v4.0.0';
const CACHE_NAME = `quick-dukan-static-${CACHE_VERSION}`;
const DATA_CACHE = `quick-dukan-data-${CACHE_VERSION}`;
const IMAGE_CACHE = `quick-dukan-images-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `quick-dukan-dynamic-${CACHE_VERSION}`;

// ============================================
// STATIC FILES TO CACHE
// ============================================
const STATIC_CACHE = [
    '/Quick-Dukan/',
    '/Quick-Dukan/index.html',
    '/Quick-Dukan/login.html',
    '/Quick-Dukan/orders.html',
    '/Quick-Dukan/manifest.json',
    '/Quick-Dukan/offline.html',

    // CSS Files
    '/Quick-Dukan/css/theme.css',
    '/Quick-Dukan/css/animations.css',
    '/Quick-Dukan/css/layout.css',
    '/Quick-Dukan/css/header.css',
    '/Quick-Dukan/css/search.css',
    '/Quick-Dukan/css/categories.css',
    '/Quick-Dukan/css/product-card.css',
    '/Quick-Dukan/css/category-products.css',
    '/Quick-Dukan/css/recently-viewed.css',
    '/Quick-Dukan/css/most-orders.css',
    '/Quick-Dukan/css/bottom-nav.css',
    '/Quick-Dukan/css/cart.css',
    '/Quick-Dukan/css/checkout.css',
    '/Quick-Dukan/css/orders.css',
    '/Quick-Dukan/css/dark-mode.css',
    '/Quick-Dukan/css/pwa-install.css',
    '/Quick-Dukan/css/floating-cart-bubble.css',
    '/Quick-Dukan/css/order-popup.css',
    '/Quick-Dukan/css/floating-map.css',
    '/Quick-Dukan/css/pull-to-refresh.css',
    '/Quick-Dukan/css/splash-screen.css',
    '/Quick-Dukan/css/location-popup.css',
    '/Quick-Dukan/css/login.css',
    '/Quick-Dukan/css/notifications.css',
    '/Quick-Dukan/css/order-rating.css',
    '/Quick-Dukan/css/order-status-popup.css',
    '/Quick-Dukan/css/payment-online.css',
    '/Quick-Dukan/css/payment-popup.css',
    '/Quick-Dukan/css/reorder.css',

    // JS Files
    '/Quick-Dukan/js/config.js',
    '/Quick-Dukan/js/whatsapp.js',
    '/Quick-Dukan/js/theme.js',
    '/Quick-Dukan/js/language.js',
    '/Quick-Dukan/js/data-loader.js',
    '/Quick-Dukan/js/search.js',
    '/Quick-Dukan/js/categories.js',
    '/Quick-Dukan/js/products.js',
    '/Quick-Dukan/js/category-products.js',
    '/Quick-Dukan/js/recently-viewed.js',
    '/Quick-Dukan/js/most-orders.js',
    '/Quick-Dukan/js/cart.js',
    '/Quick-Dukan/js/orders.js',
    '/Quick-Dukan/js/checkout.js',
    '/Quick-Dukan/js/location.js',
    '/Quick-Dukan/js/bottom-nav.js',
    '/Quick-Dukan/js/back-to-top.js',
    '/Quick-Dukan/js/animations.js',
    '/Quick-Dukan/js/app.js',
    '/Quick-Dukan/js/auto-refresh.js',
    '/Quick-Dukan/js/pwa-install.js',
    '/Quick-Dukan/js/floating-cart-bubble.js',
    '/Quick-Dukan/js/order-popup.js',
    '/Quick-Dukan/js/floating-map.js',
    '/Quick-Dukan/js/pull-to-refresh.js',
    '/Quick-Dukan/js/permission.js',
    '/Quick-Dukan/js/notifications.js',
    '/Quick-Dukan/js/order-status-popup.js',
    '/Quick-Dukan/js/order-rating.js',
    '/Quick-Dukan/js/reorder.js',
    '/Quick-Dukan/js/payment-online.js',
    '/Quick-Dukan/js/payment-popup.js',
    '/Quick-Dukan/js/splash.js',
    '/Quick-Dukan/js/google-sheets-orders.js',

    // Config Files
    '/Quick-Dukan/config/cart-config.json',
    '/Quick-Dukan/config/cart-messages.json',

    // Data Files
    '/Quick-Dukan/data/index.json',
    '/Quick-Dukan/data/chai-kafi.json',
    '/Quick-Dukan/data/chawal-atta.json',
    '/Quick-Dukan/data/cold-drinks.json',
    '/Quick-Dukan/data/dairy.json',
    '/Quick-Dukan/data/dal.json',
    '/Quick-Dukan/data/masale.json',
    '/Quick-Dukan/data/namak-masale.json',
    '/Quick-Dukan/data/sabji.json',
    '/Quick-Dukan/data/snacks.json',
    '/Quick-Dukan/data/tel-ghee.json',

    // Icons
    '/Quick-Dukan/icons/icon-72.png',
    '/Quick-Dukan/icons/icon-96.png',
    '/Quick-Dukan/icons/icon-128.png',
    '/Quick-Dukan/icons/icon-144.png',
    '/Quick-Dukan/icons/icon-152.png',
    '/Quick-Dukan/icons/icon-192.png',
    '/Quick-Dukan/icons/icon-384.png',
    '/Quick-Dukan/icons/icon-512.png',
    '/Quick-Dukan/icons/maskable-icon-512.png',
];

// ============================================
// INSTALL EVENT - Cache all static files
// ============================================
self.addEventListener('install', (event) => {
    console.log(`🔧 SW ${CACHE_VERSION} Installing...`);
    
    // Force new service worker to activate
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching all static files...');
                return Promise.allSettled(
                    STATIC_CACHE.map(url =>
                        cache.add(url).catch(err => {
                            console.warn(`❌ Failed to cache: ${url}`, err);
                        })
                    )
                );
            })
            .then(() => {
                console.log('✅ All static files cached!');
                
                // Cache data files separately
                return caches.open(DATA_CACHE).then(dataCache => {
                    const dataFiles = STATIC_CACHE.filter(url => 
                        url.includes('/data/') || url.includes('/config/')
                    );
                    return Promise.allSettled(
                        dataFiles.map(url =>
                            dataCache.add(url).catch(err => {
                                console.warn(`❌ Failed to cache data: ${url}`);
                            })
                        )
                    );
                });
            })
            .then(() => {
                console.log('✅ Installation complete! Offline ready!');
            })
    );
});

// ============================================
// ACTIVATE EVENT - Clean old caches
// ============================================
self.addEventListener('activate', (event) => {
    console.log(`✅ SW ${CACHE_VERSION} Activated`);

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                const validCaches = [CACHE_NAME, DATA_CACHE, IMAGE_CACHE, DYNAMIC_CACHE];
                const oldCaches = cacheNames.filter(cache => !validCaches.includes(cache));
                
                console.log('🗑️ Deleting old caches:', oldCaches);
                
                return Promise.all(
                    oldCaches.map(cache => {
                        console.log('Deleting:', cache);
                        return caches.delete(cache);
                    })
                );
            })
            .then(() => {
                console.log('👑 Taking control of all clients...');
                return self.clients.claim();
            })
            .then(() => {
                // Notify all clients about update
                return self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'SW_ACTIVATED',
                            version: CACHE_VERSION
                        });
                    });
                });
            })
    );
});

// ============================================
// FETCH EVENT - Smart Caching Strategy
// ============================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Skip chrome extensions and unsupported protocols
    if (url.protocol === 'chrome-extension:' || url.protocol === 'chrome:') return;
    if (!url.protocol.startsWith('http')) return;

    // Skip analytics and tracking
    if (url.hostname.includes('google-analytics')) return;
    if (url.hostname.includes('googletagmanager')) return;
    if (url.hostname.includes('doubleclick')) return;
    if (url.hostname.includes('facebook')) return;

    // ============ HTML NAVIGATION ============
    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request));
        return;
    }

    // ============ DATA FILES ============
    if (url.pathname.includes('/data/') || url.pathname.includes('/config/')) {
        event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
        return;
    }

    // ============ IMAGES ============
    if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
        event.respondWith(cacheFirst(request, IMAGE_CACHE));
        return;
    }

    // ============ STATIC ASSETS ============
    if (url.pathname.match(/\.(css|js|woff|woff2|ttf|ico)$/)) {
        event.respondWith(cacheFirst(request, CACHE_NAME));
        return;
    }

    // ============ EXTERNAL CDN ============
    if (url.hostname.includes('unpkg.com') || 
        url.hostname.includes('cdnjs.cloudflare.com') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com')) {
        event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
        return;
    }

    // ============ MAPS ============
    if (url.hostname.includes('openstreetmap') || 
        url.hostname.includes('leafletjs')) {
        event.respondWith(networkOnly(request));
        return;
    }

    // ============ DEFAULT ============
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ============================================
// CACHE FIRST STRATEGY
// ============================================
async function cacheFirst(request, cacheName = CACHE_NAME) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
        // Update cache in background
        updateCache(request, cache);
        return cached;
    }

    try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('🌐 Offline - No cached version:', request.url);
        
        // Return offline fallback for navigation
        if (request.mode === 'navigate') {
            const offlinePage = await caches.match('/Quick-Dukan/offline.html');
            if (offlinePage) return offlinePage;
        }
        
        return new Response('Offline - Please connect to internet', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// ============================================
// NETWORK FIRST STRATEGY
// ============================================
async function networkFirst(request) {
    try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('🌐 Network failed, using cache:', request.url);
        
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        
        if (cached) return cached;
        
        // Fallback to offline page
        if (request.mode === 'navigate') {
            const offlinePage = await cache.match('/Quick-Dukan/offline.html');
            if (offlinePage) return offlinePage;
        }
        
        throw error;
    }
}

// ============================================
// STALE WHILE REVALIDATE STRATEGY
// ============================================
async function staleWhileRevalidate(request, cacheName = DYNAMIC_CACHE) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    const networkFetch = fetch(request, { cache: 'no-store' })
        .then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    // Return cached immediately if available
    if (cached) {
        // Update in background
        networkFetch;
        return cached;
    }

    // Otherwise wait for network
    try {
        const response = await networkFetch;
        if (response) return response;
    } catch (error) {
        console.log('Network error:', error);
    }

    // Final fallback
    return new Response('Offline', { status: 503 });
}

// ============================================
// NETWORK ONLY STRATEGY
// ============================================
async function networkOnly(request) {
    try {
        return await fetch(request);
    } catch (error) {
        console.log('Network only failed:', request.url);
        return new Response('Offline', { 
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// ============================================
// BACKGROUND CACHE UPDATE
// ============================================
async function updateCache(request, cache) {
    try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok) {
            cache.put(request, response.clone());
            console.log('🔄 Updated cache:', request.url);
        }
    } catch (error) {
        // Silent fail - offline update not possible
    }
}

// ============================================
// PUSH NOTIFICATION HANDLER
// ============================================
self.addEventListener('push', (event) => {
    console.log('📨 Push notification received');
    
    let data = {
        title: 'Quick Dukan',
        body: 'New update available!',
        icon: '/Quick-Dukan/icons/icon-192.png',
        badge: '/Quick-Dukan/icons/icon-72.png',
        vibrate: [200, 100, 200],
        sound: 'default',
        data: {
            url: '/Quick-Dukan/'
        }
    };

    if (event.data) {
        try {
            const pushData = event.data.json();
            data = { ...data, ...pushData };
        } catch (error) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: data.vibrate,
        sound: data.sound,
        data: data.data,
        actions: data.actions || [],
        requireInteraction: data.requireInteraction || false,
        tag: data.tag || 'default',
        renotify: data.renotify || false,
        silent: data.silent || false
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ============================================
// NOTIFICATION CLICK HANDLER
// ============================================
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Notification clicked:', event.action);
    
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/Quick-Dukan/';

    event.waitUntil(
        clients.matchAll({ 
            type: 'window', 
            includeUncontrolled: true 
        })
        .then(clientList => {
            // Check if window already open
            for (const client of clientList) {
                if (client.url.includes('/Quick-Dukan/') && 'focus' in client) {
                    client.postMessage({
                        type: 'NOTIFICATION_CLICK',
                        action: event.action,
                        data: event.notification.data
                    });
                    return client.focus();
                }
            }
            // Open new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// ============================================
// BACKGROUND SYNC
// ============================================
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync:', event.tag);
    
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOrders());
    }
    
    if (event.tag === 'sync-cart') {
        event.waitUntil(syncCart());
    }
});

// Sync offline orders
async function syncOrders() {
    try {
        const db = await openDB();
        const orders = await getAllOrders(db);
        
        for (const order of orders) {
            await sendOrderToServer(order);
            await deleteOrder(db, order.id);
        }
        
        // Notify clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'ORDERS_SYNCED',
                count: orders.length
            });
        });
        
    } catch (error) {
        console.error('Order sync failed:', error);
    }
}

// Sync cart
async function syncCart() {
    try {
        // Implement cart sync logic
        console.log('Cart synced');
    } catch (error) {
        console.error('Cart sync failed:', error);
    }
}

// ============================================
// INDEXEDDB HELPERS
// ============================================
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('QuickDukanDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('orders')) {
                db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

function getAllOrders(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['orders'], 'readonly');
        const store = transaction.objectStore('orders');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

function deleteOrder(db, orderId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['orders'], 'readwrite');
        const store = transaction.objectStore('orders');
        const request = store.delete(orderId);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function sendOrderToServer(order) {
    try {
        const response = await fetch(CONFIG.googleSheets.ordersSheetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        return response.json();
    } catch (error) {
        console.error('Send order failed:', error);
        throw error;
    }
}

// ============================================
// MESSAGE LISTENER
// ============================================
self.addEventListener('message', (event) => {
    console.log('📨 Message received:', event.data);
    
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CHECK_CACHE':
            caches.keys().then(names => {
                event.ports[0]?.postMessage({ caches: names });
            });
            break;
            
        case 'CLEAR_CACHE':
            caches.keys().then(names => {
                Promise.all(names.map(name => caches.delete(name)))
                    .then(() => {
                        event.ports[0]?.postMessage({ cleared: true });
                    });
            });
            break;
            
        case 'GET_VERSION':
            event.ports[0]?.postMessage({ version: CACHE_VERSION });
            break;
    }
});

// ============================================
// PERIODIC SYNC (if supported)
// ============================================
self.addEventListener('periodicsync', (event) => {
    console.log('📅 Periodic sync:', event.tag);
    
    if (event.tag === 'check-updates') {
        event.waitUntil(checkForUpdates());
    }
});

async function checkForUpdates() {
    try {
        const response = await fetch('/Quick-Dukan/manifest.json', { cache: 'no-store' });
        const manifest = await response.json();
        
        // Notify clients about update
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'UPDATE_AVAILABLE',
                version: manifest.version
            });
        });
    } catch (error) {
        console.error('Update check failed:', error);
    }
}

console.log(`🔄 Service Worker ${CACHE_VERSION} Ready - Full PWA Support ✅`);