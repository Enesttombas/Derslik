// Enes Derslik Service Worker: caches application shell only.
// Does NOT cache unvisited PDFs or promise offline PDF access.
const CACHE_NAME = "enes-derslik-shell-v1";
const SHELL_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Do not intercept non-GET requests or PDF endpoints
  if (request.method !== "GET" || url.pathname.startsWith("/api/pdfs/")) {
    return;
  }

  // Network-first strategy with cache fallback for navigation/shell
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache successful responses for shell assets only
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.pathname === "/" || url.pathname.endsWith(".css") || url.pathname.endsWith(".js"))
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (request.mode === "navigate") {
          return caches.match("/");
        }
        return new Response("Çevrimdışısınız. Bu kaynak önbellekte bulunmuyor.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      })
  );
});
