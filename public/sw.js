// LSBookers — Service Worker
// Seuls les fichiers publics de l'application sont conservés hors ligne.

const CACHE_NAME = 'lsbookers-v2'
const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

async function rebuildPublicCache() {
  const names = await caches.keys()
  await Promise.all(
    names.filter((name) => name.startsWith('lsbookers-')).map((name) => caches.delete(name))
  )
  const cache = await caches.open(CACHE_NAME)
  await cache.addAll(STATIC_ASSETS)
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name.startsWith('lsbookers-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_CACHES') {
    event.waitUntil(rebuildPublicCache())
  }
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Ne jamais intercepter les API, uploads ou ressources d'un autre domaine.
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/uploads/')
  ) return

  // Une page doit toujours venir du réseau. Hors ligne, on affiche uniquement
  // la page générique et jamais une ancienne page connectée.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    )
    return
  }

  const isPublicAsset =
    STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/_next/static/')

  if (!isPublicAsset) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
        }
        return response
      })
    })
  )
})
