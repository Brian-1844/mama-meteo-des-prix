// Manu Ora – cache hors ligne. Réseau d'abord (toujours la dernière version), cache si pas de connexion.
const CACHE = 'manu-ora-v46';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './fonts/fredoka-latin-500-normal.woff2', './fonts/fredoka-latin-ext-500-normal.woff2', './fonts/fredoka-latin-600-normal.woff2', './fonts/fredoka-latin-ext-600-normal.woff2', './fonts/nunito-latin-400-normal.woff2', './fonts/nunito-latin-ext-400-normal.woff2', './fonts/nunito-latin-700-normal.woff2', './fonts/nunito-latin-ext-700-normal.woff2', './fonts/nunito-latin-400-italic.woff2', './fonts/nunito-latin-ext-400-italic.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
