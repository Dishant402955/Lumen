/* Lumen offline service worker — shell + static + runtime caches */
const VERSION = "v4";
const SHELL = `lumen-shell-${VERSION}`;
const STATIC = `lumen-static-${VERSION}`;
const RUNTIME = `lumen-runtime-${VERSION}`;
const ALL_CACHES = [SHELL, STATIC, RUNTIME];

const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon.svg",
];
const RUNTIME_LIMIT = 80;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      await cache.addAll(PRECACHE);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !ALL_CACHES.includes(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.postMessage({ type: "LUMEN_SW_ACTIVATED", version: VERSION });
      }
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // App navigations: network first, cached shell fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Next.js build assets + fonts: cache first, then network
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|webp|svg|ico)$/i)
  ) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }

  // Everything else same-origin: stale-while-revalidate into runtime cache
  event.respondWith(staleWhileRevalidate(request, RUNTIME));
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL);
      await cache.put("/", response.clone());
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(SHELL);
    return (
      (await cache.match(request)) ||
      (await cache.match("/")) ||
      new Response(
        "<!doctype html><title>Lumen offline</title><body style='font-family:system-ui;padding:2rem'><h1>Lumen</h1><p>You are offline and the app shell is not cached yet. Connect once to install it.</p></body>",
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 },
      )
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (
      cached ||
      new Response("", { status: 503, statusText: "Offline" })
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
        await trimCache(cacheName, RUNTIME_LIMIT);
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    void networkPromise;
    return cached;
  }

  const network = await networkPromise;
  if (network) return network;
  return new Response("", { status: 503, statusText: "Offline" });
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const removeCount = keys.length - maxEntries;
  for (let i = 0; i < removeCount; i++) {
    await cache.delete(keys[i]);
  }
}
