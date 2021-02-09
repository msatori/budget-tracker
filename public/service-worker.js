const APP_PREFIX = 'Budget_App-';
const VERSION = 'version_01';
const CACHE_NAME = APP_PREFIX + VERSION;


const FILES_TO_CACHE = [
    "./index.html",
    "/css/style.css",
    "./js/index.js",
    "./js/idb.js",
    "./manifest.json",
    "./icons/icon-72x72.png",
    "./icons/icon-96x96.png",
    "./icons/icon-128x128.png",
    "./icons/icon-144x144.png",
    "./icons/icon-152x152.png",
    "./icons/icon-192x192.png",
    "./icons/icon-348x348.png",
    "./icons/icon-512x512.png",
];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('installing cache : ' + CACHE_NAME)
            return cache.addAll(FILES_TO_CACHE)
        })
    )
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keyList) {
            let cacheKeeplist = keyList.filter(function (key) {
                return key.indexOf(APP_PREFIX);
            });
            cacheKeeplist.push(CACHE_NAME);

            return Promise.all(
                keyList.map(function (key, i) {
                    if (cacheKeeplist.indexOf(key) === -1) {
                        console.log('deleting cache : ' + keyList[i]);
                        return caches.delete(keyList[i]);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', function (e) {

    if (e.request.url.includes("/api/")) {
        e.respondWith(
            caches
                .open(CACHE_NAME)
                .then((cache) => {
                    return fetch(e.request)
                        .then((response) => {
                            //clone response
                            if (response === 200) {
                                cache.put(e.request, response.clone());
                            }

                            return response
                        })
                        .catch(() => {
                            //no network, try to get from cache
                            return cache.match(e.request);
                        });
                })
                .catch((err) => {
                    console.log(err)
                })
        );
        //stop fetch event 
        return;
    }

    //static assets for non-api requests - offline first
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
