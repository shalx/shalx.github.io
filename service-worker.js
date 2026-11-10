"use strict";

/* Fix-Pin: network-first updates, offline fallback. */
const CACHE_NAME = "fix-pin-cache-v7";
const CACHE_PREFIX = "fix-pin-cache-";
const APP_FILES = [
    "./", "./index.html", "./style.css", "./storage.js",
    "./files.js", "./map.js", "./app.js", "./fullscreen.js",
    "./manifest.json", "./icon-192.png", "./icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        // Don't fail installation if a single optional file is missing.
        await Promise.all(APP_FILES.map(async path => {
            try {
                const response = await fetch(new Request(path, { cache: "no-store" }));
                if (response.ok) await cache.put(path, response);
            } catch (error) {
                console.warn("Fix-Pin: cannot precache", path, error);
            }
        }));
        await self.skipWaiting();
    })());
});

self.addEventListener("activate", event => {
    event.waitUntil((async () => {
        const names = await caches.keys();
        await Promise.all(names.filter(name =>
            name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME
        ).map(name => caches.delete(name)));
        await self.clients.claim();
    })());
});

self.addEventListener("fetch", event => {
    const request = event.request;
    if (request.method !== "GET") return;
    const url = new URL(request.url);
    // Leave third-party map tiles, search services, and CDN assets alone.
    if (url.origin !== self.location.origin ||
        !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        // Use the canonical pathname as the cache key for navigation so
        // ?fixpin_refresh=... doesn't create an unbounded number of entries.
        const key = request.mode === "navigate"
            ? new URL("./index.html", self.registration.scope).href
            : request;
        try {
            const response = await fetch(request, { cache: "no-store" });
            if (response.ok && response.type === "basic") {
                await cache.put(key, response.clone());
            }
            return response;
        } catch (error) {
            const fallback = await cache.match(key) ||
                (request.mode === "navigate"
                    ? await cache.match(new URL("./", self.registration.scope).href)
                    : undefined);
            if (fallback) return fallback;
            return Response.error();
        }
    })());
});
