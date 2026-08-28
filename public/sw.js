// LS Bookers — Service Worker
// Stratégie : Network-first pour les pages, cache-first pour les assets statiques

const CACHE_NAME = 'lsbookers-v1'
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// ── Installation : mise en cache des assets de base ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ── Activation : nettoyage des anciens caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch : stratégie selon le type de requête ──
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // API calls → toujours réseau, jamais de cache
  if (url.pathname.startsWith('/api/') || url.hostname.includes('railway.app')) return

  // Assets statiques (images, fonts, icônes) → cache-first
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/avatars/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff2|woff|ico)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return res
        })
      })
    )
    return
  }

  // Pages Next.js → network-first, fallback cache, puis offline
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.status === 200) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return res
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached
          if (event.request.mode === 'navigate') return caches.match('/offline.html')
        })
      )
  )
})
