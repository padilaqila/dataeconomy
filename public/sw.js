const CACHE_NAME = 'sensus-cache-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Simple pass-through fetch since offline caching is handled mostly by Dexie
  // For a full offline experience, resources should be cached here
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
