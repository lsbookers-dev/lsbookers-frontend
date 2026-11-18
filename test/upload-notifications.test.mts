// Envoi de fichiers et notifications côté navigateur (audit du 18/11/2026)
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

process.env.NEXT_PUBLIC_API_URL = 'https://api.lsbookers.com'

// ── Faux navigateur ─────────────────────────────────────────
const calls: { url: string; method: string; body: unknown }[] = []
let api: Record<string, () => Response> = {}
let storageAccepts = true
let storageBlocked = false
const session = new Map<string, string>()

Object.assign(globalThis, {
  window: { location: { href: 'https://lsbookers.com/home', hostname: 'lsbookers.com' }, dispatchEvent: () => true },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  sessionStorage: { getItem: (k: string) => session.get(k) ?? null, setItem: (k: string, v: string) => { session.set(k, v) } },
  fetch: async (url: string, init: RequestInit = {}) => {
    calls.push({ url, method: init.method || 'GET', body: init.body })
    const route = Object.keys(api).find(r => url.endsWith(r))
    return route ? api[route]() : new Response('{}', { status: 404 })
  },
  XMLHttpRequest: class {
    status = 0
    upload: { onprogress?: (e: { lengthComputable: boolean; loaded: number; total: number }) => void } = {}
    onload?: () => void
    onerror?: () => void
    url = ''
    open(_m: string, url: string) { this.url = url }
    setRequestHeader() {}
    send() {
      calls.push({ url: this.url, method: 'PUT', body: null })
      setTimeout(() => {
        if (storageBlocked) return this.onerror?.()
        this.upload.onprogress?.({ lengthComputable: true, loaded: 1, total: 1 })
        this.status = storageAccepts ? 200 : 500
        this.onload?.()
      })
    }
  },
})

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const presignOk = () => json(200, { uploadUrl: 'https://r2.example/put', key: 'lsbookers/media/u1-1-aaaaaaaa-photo.jpg', headers: { 'Content-Type': 'image/jpeg' } })
const photo = () => new File([new Uint8Array([0xff, 0xd8, 0xff])], 'photo.jpg', { type: 'image/jpeg' })
function reset() { calls.length = 0; session.clear(); storageAccepts = true; storageBlocked = false; api = {} }

const { uploadToStorage, fileRequest } = await import('../src/utils/directUpload.ts')

test('envoi direct : autorisation → dépôt sur le stockage → confirmation, avec la progression', async () => {
  reset()
  api = { '/api/upload/presign': presignOk, '/api/upload/confirm': () => json(200, { url: 'https://media.lsbookers.com/x.jpg' }) }
  const progress: number[] = []
  const res = await uploadToStorage(photo(), { folder: 'media', onProgress: p => progress.push(p) })
  assert.equal(res.status, 200)
  assert.deepEqual(calls.map(c => c.method + ' ' + c.url.replace(/^https:\/\/[^/]+/, '')), ['POST /api/upload/presign', 'PUT /put', 'POST /api/upload/confirm'])
  assert.deepEqual(progress, [100])
})

test('fichier refusé par le serveur (format, taille) : pas de nouvel essai à l’ancienne', async () => {
  reset()
  api = { '/api/upload/presign': () => json(413, { error: 'FILE_TOO_LARGE' }) }
  const res = await uploadToStorage(photo(), { folder: 'media' })
  assert.equal(res.status, 413)
  assert.equal(calls.length, 1)
})

test('stockage injoignable (règle CORS absente) : secours par le serveur, puis plus d’essai direct dans l’onglet', async () => {
  reset()
  storageBlocked = true
  api = { '/api/upload/presign': presignOk, '/api/upload': () => json(200, { url: 'https://media.lsbookers.com/y.jpg' }) }
  const res = await uploadToStorage(photo(), { folder: 'media' })
  assert.equal(res.status, 200)
  assert.equal(calls.at(-1)?.url, 'https://api.lsbookers.com/api/upload')
  assert.ok(calls.at(-1)?.body instanceof FormData)
  calls.length = 0
  await uploadToStorage(photo(), { folder: 'media' })
  assert.equal(calls.some(c => c.url.endsWith('/presign')), false)
})

test('message avec pièce jointe : seule la clé du fichier déposé est envoyée', async () => {
  reset()
  api = { '/api/upload/presign': presignOk }
  const init = await fileRequest(photo(), 'message', { conversationId: 4, content: 'Voici le contrat' }) as RequestInit
  assert.deepEqual(JSON.parse(String(init.body)), { conversationId: 4, content: 'Voici le contrat', fileKey: 'lsbookers/media/u1-1-aaaaaaaa-photo.jpg', fileName: 'photo.jpg' })
})

// ── Notifications ───────────────────────────────────────────
const { notificationTarget } = await import('../src/utils/notificationLinks.ts')
const { buildFeed } = await import('../src/lib/notificationFeed.ts')

test('notifications : chaque type mène au bon endroit', () => {
  assert.deepEqual(notificationTarget({ type: 'NEW_LIKE', publicationId: 7 }), { publicationId: 7 })
  assert.deepEqual(notificationTarget({ type: 'BOOKING_REQUEST', bookingRequestId: 3, conversationId: 9 }), { bookingRequestId: 3 })
  assert.deepEqual(notificationTarget({ type: 'BOOKING_ACCEPTED', conversationId: 9 }), { href: '/messages?c=9' })
  assert.deepEqual(notificationTarget({ type: 'NEW_APPLICATION', offerId: 5 }), { href: '/offers?offer=5' })
  assert.deepEqual(notificationTarget({ type: 'PAYOUT_RELEASED', eventId: 2 }), { href: '/agenda?event=2&tab=bookings' })
  assert.deepEqual(notificationTarget({ type: 'PAYOUT_RELEASED' }), { href: '/settings/subscription' })
  assert.deepEqual(notificationTarget({ type: 'NEW_FOLLOW', actor: { id: 12, role: 'organizer' } }), { href: '/organizer/12' })
  assert.deepEqual(notificationTarget({ type: 'ADMIN_REPORT' }), { href: '/admin/signalements' })
  assert.equal(notificationTarget({ type: 'NEW_LIKE' }), null) // publication supprimée : rien à ouvrir
})

test('notifications : les J’aime d’une même publication sont regroupés par jour', () => {
  const now = new Date('2027-01-10T15:00:00')
  const n = (id: number, type: string, at: string, extra = {}) => ({ id, type, content: `n${id}`, createdAt: at, read: false, actor: { name: `Membre ${id}` }, ...extra })
  const feed = buildFeed([
    n(1, 'NEW_LIKE', '2027-01-10T14:00:00', { publicationId: 7 }),
    n(2, 'NEW_LIKE', '2027-01-10T13:00:00', { publicationId: 7 }),
    n(3, 'NEW_LIKE', '2027-01-10T12:00:00', { publicationId: 7 }),
    n(4, 'NEW_MESSAGE', '2027-01-09T12:00:00'),
  ] as never, now)
  assert.deepEqual(feed.map(s => s.label), ['Aujourd’hui', 'Hier'])
  assert.equal(feed[0].items.length, 1)
  assert.equal(feed[0].items[0].text, 'Membre 1 et 2 autres ont aimé votre publication.')
  assert.deepEqual(feed[0].items[0].ids, [1, 2, 3])
})

// Chaque notification créée par le serveur doit mener quelque part (ou être volontairement sans lien)
test('notifications : aucun type envoyé par le serveur n’est oublié par le site', (t) => {
  const backend = path.resolve(import.meta.dirname, '../../backend')
  if (!fs.existsSync(backend)) return t.skip('dossier backend absent')
  const types = new Set<string>()
  const walk = (dir: string) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      if (f.name === 'node_modules' || f.name === 'test' || f.name === 'scripts') continue
      const p = path.join(dir, f.name)
      if (f.isDirectory()) walk(p)
      else if (f.name.endsWith('.js')) for (const m of fs.readFileSync(p, 'utf8').matchAll(/type:\s*'([A-Z][A-Z_]+)'/g)) types.add(m[1])
    }
  }
  for (const d of ['routes', 'services', 'lib']) walk(path.join(backend, d))
  // Types de messages (pas des notifications) et notifications d'information sans lien, voulues ainsi
  const notNotifications = new Set(['TEXT', 'PROFILE_SHARE', 'OFFER_SHARE', 'OFFER_APPLICATION'])
  const infoOnly = new Set(['MODERATION_NOTICE', 'REPORT_RESOLVED', 'ADMIN_BACKUP_FAILED'])
  // Ces deux-là mènent au profil de la personne qui a agi
  const viaActor = new Set(['NEW_FOLLOW', 'REVIEW_REPLY'])
  const ids = { eventId: 1, conversationId: 1, offerId: 1, publicationId: 1, bookingRequestId: 1 }
  const notifTypes = [...types].filter(t => !notNotifications.has(t) && !infoOnly.has(t) && /^[A-Z]+_[A-Z_]+$/.test(t))
  assert.ok(notifTypes.length > 30, 'liste des types lue dans le code du serveur')
  const missing = notifTypes.filter(t => notificationTarget({ type: t, ...ids, ...(viaActor.has(t) ? { actor: { id: 1, role: 'ARTIST' } } : {}) }) === null)
  assert.deepEqual(missing, [], `Types de notification sans destination : ${missing.join(', ')}`)
})
