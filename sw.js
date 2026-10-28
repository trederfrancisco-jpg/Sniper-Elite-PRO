const CACHE_NAME = 'sniper-elite-v2'; // Alterado para v2 para forçar a atualização dos ícones antigos
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalação do Service Worker e gravação do novo cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // Força o novo Service Worker a assumir o controle imediatamente
});

// Limpeza automática do cache 'v1' antigo que está bloqueando a atualização
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Limpando cache antigo e obsoleto:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // Assume o controle das abas abertas na hora
});

// Mecanismo de busca inteligente (Network First para Manifest/HTML, Cache para o resto)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Se for o manifesto ou a página principal, tenta sempre a rede primeiro para pegar modificações recentes
  if (url.pathname === '/manifest.json' || url.pathname === '/index.html' || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Atualiza o cache dinamicamente com a versão mais nova da rede
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request)) // Se estiver sem internet, usa o cache salvo
    );
  } else {
    // Para imagens e estilos locais, mantém a busca rápida no cache primeiro
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});

