const CACHE_NAME = 'match-mate-v1';

// Only cache files that exist in the Vite dev environment
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Only cache files that exist, ignore errors for missing files
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.log('Failed to cache:', url, err);
              return null;
            })
          )
        );
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip Vite dev server requests
  if (event.request.url.includes('localhost:5173') && 
      (event.request.url.includes('@vite') || 
       event.request.url.includes('/src/') ||
       event.request.url.includes('vite.svg'))) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(err => {
          console.log('Fetch failed:', event.request.url, err);
          // Return a fallback response for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Network error', { status: 503 });
        });
      })
  );
});
