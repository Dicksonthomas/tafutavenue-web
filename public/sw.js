const CACHE_VERSION = "v3";
const SHELL_CACHE = `tafutavenue-shell-${CACHE_VERSION}`;
const API_CACHE = `tafutavenue-api-${CACHE_VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, API_CACHE];

// Key entry-point pages, precached at install time so the app can still open
// (from the home-screen icon or a reopened tab) with no network at all.
// Everything else gets cached as the user visits it (see the fetch handler).
const SHELL_ROUTES = ["/login", "/dashboard/home", "/dashboard", "/admin"];
const STATIC_ASSETS = ["/icon-192.png", "/icon-512.png", "/manifest.json", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.allSettled(
        [...SHELL_ROUTES, ...STATIC_ASSETS].map((url) =>
          fetch(url).then((response) => response.ok && cache.put(url, response))
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !CURRENT_CACHES.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Offline strategy:
// - Page navigations: network-first (fresh when online), falling back to the
//   cached copy of that page, or a neutral "you're offline" page as a last
//   resort - NEVER the login page, since that would look like the user got
//   logged out when they're really just offline (their session is untouched).
// - API GET requests (any origin - the backend is a separate host from the
//   frontend): network-first, falling back to the last cached response so
//   previously loaded venues/bookings/settings are still viewable offline.
// - Everything else same-origin (JS/CSS/images from our own build): cache-first,
//   since these are content-hashed and safe to reuse indefinitely.
// Writes (POST/PUT/DELETE, e.g. creating a booking) are never cached and are
// left to fail naturally offline - they need a live server.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  const isApi = url.pathname.includes("/api/");

  if (isApi) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            // Resolving with `undefined` here would make the browser treat
            // this as an invalid response instead of a clean network error -
            // re-throw so the page's own fetch/axios call fails normally and
            // can show a proper "you're offline" message instead of a weird one.
            if (cached) return cached;
            throw new Error("Offline and not cached");
          })
        )
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/offline.html")))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
  }
});
