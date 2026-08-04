"use strict";

/*
=========================================
FIX-PIN
service-worker.js
=========================================
*/

const CACHE_NAME = "fix-pin-cache-v3";


const APP_FILES = [

    "./",
    "./index.html",

    "./style.css",

    "./storage.js",
    "./files.js",
    "./map.js",
    "./app.js",

    "./manifest.json",

    "./icon-192.png",
    "./icon-512.png"

];


/*
=========================================
INSTALL
=========================================
*/

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(cache => {

                    return cache.addAll(
                        APP_FILES
                    );

                })

        );

        self.skipWaiting();

    }
);


/*
=========================================
ACTIVATE
=========================================
*/

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches
                .keys()
                .then(cacheNames => {

                    return Promise.all(

                        cacheNames.map(
                            cacheName => {

                                if (
                                    cacheName !==
                                    CACHE_NAME
                                ) {

                                    return caches.delete(
                                        cacheName
                                    );

                                }

                                return null;

                            }
                        )

                    );

                })

        );

        self.clients.claim();

    }
);


/*
=========================================
FETCH
=========================================
*/

self.addEventListener(
    "fetch",
    event => {

        const request =
            event.request;


        if (
            request.method !== "GET"
        ) {

            return;

        }


        /*
        =================================
        PAGE NAVIGATION
        =================================
        */

        if (
            request.mode === "navigate"
        ) {

            event.respondWith(

                fetch(request)

                    .then(response => {

                        const copy =
                            response.clone();

                        caches
                            .open(CACHE_NAME)
                            .then(cache => {

                                cache.put(
                                    "./index.html",
                                    copy
                                );

                            });

                        return response;

                    })

                    .catch(() => {

                        return caches.match(
                            "./index.html"
                        );

                    })

            );

            return;

        }


        /*
        =================================
        FILES AND EXTERNAL RESOURCES
        =================================
        */

        event.respondWith(

            caches
                .match(request)
                .then(cachedResponse => {

                    if (cachedResponse) {

                        return cachedResponse;

                    }

                    return fetch(request)
                        .then(response => {

                            if (
                                !response ||
                                response.status !== 200
                            ) {

                                return response;

                            }

                            const copy =
                                response.clone();

                            caches
                                .open(CACHE_NAME)
                                .then(cache => {

                                    cache.put(
                                        request,
                                        copy
                                    );

                                });

                            return response;

                        });

                })

        );

    }
);
