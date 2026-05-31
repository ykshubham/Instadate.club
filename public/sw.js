const CACHE_NAME = 'instadate-react-pwa-v3';

const APP_SHELL = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './assets/glowing_hearts.png',
  './assets/social_mixer.png',
  './assets/secure_chemistry.png',
  './assets/happy_couple_joy.png',
  './assets/mumbai_rooftop_mixer.png',
  './assets/instadate_event_map.png',
  './assets/bandra_acoustic_mixer.png',
  './assets/rooftop_sunset_soiree.png',
  './assets/colaba_speakeasy.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  if (url.pathname.startsWith('/src/') || url.pathname.startsWith('/@vite/') || url.pathname.includes('/node_modules/.vite/')) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(response => response || caches.match('./offline.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }

          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});
