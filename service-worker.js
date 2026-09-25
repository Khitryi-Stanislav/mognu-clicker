const CACHE_NAME = 'mognu-v1';
const urlsToCache = [
  './',
  './index.html',
  './game.js',
  './manifest.json',
  'assets/characters/1.png',
  'assets/characters/2.png',
  'assets/characters/3.png',
  'assets/characters/4.png',
  'assets/characters/5.png',
  'assets/characters/6.png',
  'assets/characters/7.png',
  'assets/characters/8.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(() => {});
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});
