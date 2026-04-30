// ============================================================
//  sw.js — Zentry PWA Service Worker (VERSÃO TURBO)
// ============================================================

// MUDEI O NOME AQUI PARA FORÇAR O CELULAR A APAGAR O ANTIGO
const CACHE_NAME = 'zentry-v-10-segundos'; 

const ARQUIVOS_CACHE = [
  './',
  './index.html',
  './home.html',
  './login.html',
  './manifest.json',
  './logo-192.png',
  './logo-512.png',
  './zentry-core.js',
  './splash.jpg'
];

// ── INSTALAR ──
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ARQUIVOS_CACHE);
    })
  );
});

// ── ATIVAR (Mata o cache velho de vez) ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ── FETCH ──
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        return response || caches.match('./index.html');
      });
    })
  );
});
