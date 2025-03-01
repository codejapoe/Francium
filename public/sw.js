const CACHE_NAME = 'francium-v1.1.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.png',
  // Add other static assets you want to cache
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle supported schemes (http/https)
  if (!event.request.url.startsWith('http')) {
    return;
  }

    event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch((error) => {
          // Try to return cached response as fallback
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If no cached response, throw the error
              throw error;
            });
        });
    })
  );
});