/* Apobase 2.0 — Service Worker: offline cache of critical pages + assets */
const CACHE = "apobase-v1";
const CRITICAL = [
  "/apobase/style.css",
  "/apobase/tokens.css",
  "/apobase/app.js",
  "/apobase/data.js",
  "/apobase/ai-fab.js",
  "/apobase/notfall.html",
  "/apobase/notfalldepot.html",
  "/apobase/fristen.html",
  "/apobase/rezepte.html",
  "/apobase/dosierung-rechner.html",
  "/apobase/index.html",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CRITICAL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // network-first for pages (fresh law content matters), cache fallback
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then((m) => m || caches.match("/apobase/index.html")))
    );
    return;
  }
  // cache-first for static assets
  e.respondWith(
    caches.match(req).then((m) => m || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }))
  );
});
