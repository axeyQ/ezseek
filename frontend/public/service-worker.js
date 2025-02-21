// public/service-worker.js
const CACHE_NAME = 'pos-cache-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache
const urlsToCache = [
  '/',
  '/offline.html',
  '/styles/globals.css',
  // Add other static assets
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  try {
    const db = await openDB();
    const offlineActions = await db.getAll('offlineActions');
    
    for (const action of offlineActions) {
      try {
        await processOfflineAction(action);
        await db.delete('offlineActions', action.id);
      } catch (error) {
        console.error('Error processing offline action:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing orders:', error);
  }
}

async function processOfflineAction(action) {
  const response = await fetch(action.url, {
    method: action.method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(action.data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}