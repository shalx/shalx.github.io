const CACHE_NAME="fix pin-cache-v1";
const urlsToCache=["/","index.html","manifest.json","https://unpkg.com/leaflet@1.9.4/dist/leaflet.js","https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"];

self.addEventListener("install", e=>{
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener("fetch", e=>{
  e.respondWith(
    caches.match(e.request).then(response=>response||fetch(e.request))
  );
});
