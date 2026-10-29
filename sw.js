const CACHE_NAME = 'sniper-elite-v6';
const urlsToCache = ['./', './index.html', './painel.html', './manifest.json', './firebase-config.js'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Só arquivos do próprio site (não mexe nas chamadas do Firebase).
// Rede primeiro: sempre pega a versão nova; cache só se estiver offline.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
