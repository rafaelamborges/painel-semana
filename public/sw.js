// Service Worker mínimo pra PWA installable.
// Estratégia: network-first com fallback no cache. Mantém o app atualizando sempre
// (não é offline-first porque o Compasso depende de dados vivos do Supabase).
// Em caso de falha de rede num GET, serve o último HTML cacheado — assim o app
// ainda abre offline mostrando a UI, mesmo que os dados não carreguem.

const VERSION = 'compasso-v1'
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Nunca intercepta chamadas de API, auth, storage ou funções — essas precisam ser
  // sempre dinâmicas, e o próprio cliente supabase-js lida com retry.
  if (
    url.hostname.endsWith('supabase.co') ||
    url.hostname.endsWith('supabase.in') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/storage/') ||
    url.pathname.startsWith('/realtime/') ||
    url.pathname.startsWith('/functions/')
  ) {
    return
  }

  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.ok && (url.origin === self.location.origin)) {
          const copy = res.clone()
          caches.open(VERSION).then((cache) => cache.put(request, copy)).catch(() => {})
        }
        return res
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached
          // Pra navegação, serve o index.html cacheado como fallback
          if (request.mode === 'navigate') return caches.match('/')
          return new Response('', { status: 504, statusText: 'offline' })
        })
      )
  )
})
