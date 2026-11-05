const CACHE_NAME = 'abastecimento-tripoloni-v1';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Estratégia "network-first": sempre tenta buscar a versão mais nova
// online primeiro (importante porque o app é atualizado com frequência);
// só usa o que tem guardado no celular se estiver sem internet.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;   // Apps Script/CDN vão direto pra rede, sem passar pelo cache
  if (e.request.url.includes('build.json')) return;
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        if (resp.ok) { const copy = resp.clone(); caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy)); }
        return resp;
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
  );
});
