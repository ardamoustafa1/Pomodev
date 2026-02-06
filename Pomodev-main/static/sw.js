const CACHE_NAME = 'pomodev-v8';
const STATIC_CACHE = 'pomodev-static-v8';
const DYNAMIC_CACHE = 'pomodev-dynamic-v8';

// Critical assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/static/style.css',
  '/static/script.js',
  '/static/favicon.svg',
  '/static/gamification.css',
  '/static/new_ui.css',
  '/static/layout-improvements.css',
  '/static/auth.js',
  '/static/shop.js',
  '/static/leaderboard.js',
  '/static/manifest.webmanifest'
];

// Sound files to cache on demand
const SOUND_FILES = [
  '/static/sounds/bell.mp3',
  '/static/sounds/clock.mp3',
  '/static/sounds/kitchen.mp3',
  '/static/sounds/rain.mp3',
  '/static/sounds/cafe.mp3',
  '/static/sounds/forest.mp3',
  '/static/sounds/fire.mp3'
];

// Install event - pre-cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls and external requests
  if (url.pathname.startsWith('/api/') || url.origin !== location.origin) {
    return;
  }

  // JS/CSS: Network First (güncellemeler yansısın), diğer static: Cache First
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(networkFirstWithCacheFallback(request));
  } else if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else if (isSoundFile(url.pathname)) {
    event.respondWith(cacheFirstWithNetworkFallback(request));
  } else {
    event.respondWith(networkFirstWithCacheFallback(request));
  }
});

// Check if request is for static asset
function isStaticAsset(pathname) {
  return pathname.match(/\.(css|js|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$/);
}

// Check if request is for sound file
function isSoundFile(pathname) {
  return pathname.match(/\.(mp3|wav|ogg)$/);
}

// Cache First strategy (for static assets)
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Cache First with Network Fallback (for sound files)
async function cacheFirstWithNetworkFallback(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Sound fetch failed:', error);
    return new Response('', { status: 503 });
  }
}

// Network First with Cache Fallback (for HTML pages)
async function networkFirstWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/');
    }

    return new Response('Offline', { status: 503 });
  }
}

// Listen for messages from the main thread
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data.action === 'clearCache' || event.data.action === 'forceUpdate') {
    caches.keys().then(keys => {
      keys.forEach(key => caches.delete(key));
    });
  }
});

// Background sync for offline actions (future feature)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pomodoros') {
    event.waitUntil(syncPomodoros());
  }
});

async function syncPomodoros() {
  // Future: Sync offline pomodoro data when back online
  console.log('[SW] Syncing pomodoros...');
}
