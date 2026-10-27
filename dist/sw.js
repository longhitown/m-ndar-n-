/* màndarínō · service worker. Cache dell'intera app: dopo il primo caricamento funziona senza rete.
   Modello: tools/build.mjs lo copia in dist/ con APP_VERSION = impronta di index.html (ogni modifica = avviso «Aggiorna»).
   Lo stesso testo lo genera swSource() in src/pwa/pwa.js per il pacchetto ZIP scaricabile dall'app: tienili uguali. */
const APP_VERSION = 'a5c2b5894b7e';   // la scrive tools/build.mjs: l'impronta di index.html
const CACHE = 'mandarino-' + APP_VERSION + '-' + (self.registration ? self.registration.scope : '');
/* i brani del jukebox (audio/music/) e i «nomi e termini» del Lettore (data/wiki/) hanno una cache propria che resta tra un aggiornamento e l'altro */
const MUSIC = 'mandarino-music';
const CORE = ['./', './index.html', './manifest.json', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => null))))); });
/* la nuova versione aspetta: la pagina mostra «Nuova versione disponibile · Aggiorna» e manda SKIP_WAITING */
self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('mandarino-') && k !== CACHE && k !== MUSIC).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (/\/(audio\/music|data\/wiki)\//.test(new URL(r.url).pathname)) {
    e.respondWith(caches.open(MUSIC).then(c => c.match(r).then(m => m || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }))));
    return;
  }
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return res; }).catch(() => caches.match('./index.html').then(m => m || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); return res; })));
});
