// sw.js
const CACHE_NAME = 'gamevault-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Periodic Background Sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'gamevault-sync') {
    console.log('Executando sincronização periódica...');
    event.waitUntil(
      // Envia uma mensagem para a página principal para executar a sincronização
      self.clients.matchAll().then(clients => {
        if (clients && clients.length) {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_GAMES'
            });
          });
        }
      })
    );
  }
});

// Ouvir mensagens da página principal
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'TRIGGER_SYNC') {
    // Disparar uma sincronização imediata
    self.registration.periodicSync.getTags().then(tags => {
      if (tags.includes('gamevault-sync')) {
        // Se a sincronização periódica estiver registrada, executa a sincronização
        self.clients.matchAll().then(clients => {
          if (clients && clients.length) {
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_GAMES'
              });
            });
          }
        });
      }
    });
  }
});
