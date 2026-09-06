const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

function loadServiceWorker({ fetchImpl } = {}) {
  const listeners = {}
  const deleted = []
  const puts = []
  const added = []
  const offline = { name: 'offline-response' }
  const cache = {
    addAll: async assets => { added.push(...assets) },
    put: async (request) => { puts.push(request.url || request) },
  }
  const caches = {
    keys: async () => ['lsbookers-v1', 'lsbookers-v2', 'unrelated-cache'],
    delete: async name => { deleted.push(name); return true },
    open: async () => cache,
    match: async request => request === '/offline.html' ? offline : undefined,
  }
  const self = {
    location: { origin: 'https://app.test' },
    clients: { claim: () => {} },
    skipWaiting: () => {},
    addEventListener: (type, handler) => { listeners[type] = handler },
  }
  const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'sw.js'), 'utf8')
  vm.runInNewContext(source, {
    self,
    caches,
    fetch: fetchImpl || (async () => ({ ok: true, type: 'basic', clone() { return this } })),
    URL,
    Promise,
  })
  return { listeners, deleted, puts, added, offline }
}

function fetchEvent(url, mode = 'cors') {
  let responsePromise
  return {
    request: { method: 'GET', url, mode },
    respondWith(value) { responsePromise = Promise.resolve(value) },
    get responsePromise() { return responsePromise },
  }
}

test('le service worker ignore toute ressource externe et toute API', () => {
  const { listeners } = loadServiceWorker()
  const external = fetchEvent('https://blob.example/private.jpg')
  const api = fetchEvent('https://app.test/api/profile/me')
  listeners.fetch(external)
  listeners.fetch(api)
  assert.equal(external.responsePromise, undefined)
  assert.equal(api.responsePromise, undefined)
})

test('une navigation hors ligne retourne uniquement la page générique sans la mettre en cache', async () => {
  const { listeners, offline, puts } = loadServiceWorker({
    fetchImpl: async () => { throw new Error('offline') },
  })
  const event = fetchEvent('https://app.test/messages', 'navigate')
  listeners.fetch(event)
  assert.equal(await event.responsePromise, offline)
  assert.deepEqual(puts, [])
})

test('seuls les fichiers statiques publics explicitement autorisés sont mis en cache', async () => {
  const { listeners, puts } = loadServiceWorker()
  const publicAsset = fetchEvent('https://app.test/_next/static/chunk.js')
  const userImage = fetchEvent('https://app.test/avatars/user-secret.jpg')
  listeners.fetch(publicAsset)
  listeners.fetch(userImage)
  await publicAsset.responsePromise
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(puts, ['https://app.test/_next/static/chunk.js'])
  assert.equal(userImage.responsePromise, undefined)
})

test('CLEAR_CACHES supprime les anciens caches LSBookers et recrée le cache public', async () => {
  const { listeners, deleted, added } = loadServiceWorker()
  let work
  listeners.message({
    data: { type: 'CLEAR_CACHES' },
    waitUntil(promise) { work = promise },
  })
  await work
  assert.deepEqual(deleted, ['lsbookers-v1', 'lsbookers-v2'])
  assert.deepEqual(added, [
    '/offline.html',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
  ])
})
