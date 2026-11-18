// Session et appels à l'API côté navigateur (audit du 18/11/2026) :
// cookie seul quand l'API est sur le même site, jeton en secours sinon, profil géré, fin de gestion.
import test from 'node:test'
import assert from 'node:assert/strict'

process.env.NEXT_PUBLIC_API_URL = 'https://api.lsbookers.com/api'

type Call = { url: string; init: RequestInit & { headers: Headers } }
const calls: Call[] = []
let responses: Response[] = []
const events: string[] = []

function browser(hostname: string, stored: Record<string, string> = {}) {
  const values = new Map(Object.entries(stored))
  const storage = {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => { values.set(k, v) },
    removeItem: (k: string) => { values.delete(k) },
  }
  Object.assign(globalThis, {
    window: { location: { href: `https://${hostname}/home`, hostname }, dispatchEvent: (e: Event) => { events.push(e.type); return true } },
    localStorage: storage,
    fetch: async (url: string, init: RequestInit & { headers: Headers }) => {
      calls.push({ url, init })
      return responses.shift() ?? new Response('{}', { status: 200 })
    },
  })
  calls.length = 0
  events.length = 0
  responses = []
  return values
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const auth = await import('../src/utils/auth.ts')
const { apiUrl, API_BASE } = await import('../src/utils/api.ts')

test('adresse de l’API : « /api » final retiré, pas de « /api/api »', () => {
  assert.equal(API_BASE, 'https://api.lsbookers.com')
  assert.equal(apiUrl('/auth/me'), 'https://api.lsbookers.com/api/auth/me')
})

test('lsbookers.com + api.lsbookers.com : cookie seul, jamais de jeton lisible ni d’en-tête Authorization', async () => {
  const stored = browser('lsbookers.com', { token: 'aaa.bbb.ccc' })
  assert.equal(auth.isCookieSessionMode(), true)
  auth.storeSession('xxx.yyy.zzz')
  assert.equal(stored.get('token'), auth.COOKIE_SESSION_MARKER)
  await auth.apiFetch(apiUrl('auth/me'))
  assert.equal(calls[0].init.headers.has('Authorization'), false)
  assert.equal(calls[0].init.credentials, 'include')
})

test('site sur une autre adresse (aperçu) : le jeton est envoyé en en-tête', async () => {
  browser('lsbookers-preview.vercel.app', { token: 'aaa.bbb.ccc' })
  assert.equal(auth.isCookieSessionMode(), false)
  await auth.apiFetch(apiUrl('auth/me'))
  assert.equal(calls[0].init.headers.get('Authorization'), 'Bearer aaa.bbb.ccc')
})

test('une adresse extérieure ne reçoit ni cookie ni jeton ni profil géré', async () => {
  browser('lsbookers-preview.vercel.app', { token: 'aaa.bbb.ccc', lsb_act_as: '20' })
  await auth.apiFetch('https://geo.api.gouv.fr/communes?nom=Lyon')
  assert.equal(calls[0].init?.credentials, undefined)
  assert.equal(new Headers(calls[0].init?.headers).has('Authorization'), false)
  assert.equal(new Headers(calls[0].init?.headers).has('X-Act-As-Profile'), false)
})

test('agent : le profil géré choisi part dans l’en-tête X-Act-As-Profile', async () => {
  browser('lsbookers.com', { lsb_act_as: '20' })
  assert.equal(auth.getActingProfileId(), 20)
  await auth.apiFetch(apiUrl('publications'), { method: 'POST' })
  assert.equal(calls[0].init.headers.get('X-Act-As-Profile'), '20')
})

test('agent : gestion terminée entre-temps → retour à son propre profil et requête refaite', async () => {
  const stored = browser('lsbookers.com', { lsb_act_as: '20' })
  responses = [json(403, { error: 'MANAGEMENT_ENDED' }), json(200, { ok: true })]
  const res = await auth.apiFetch(apiUrl('publications'))
  assert.equal(res.status, 200)
  assert.equal(calls.length, 2)
  assert.equal(calls[1].init.headers.has('X-Act-As-Profile'), false)
  assert.equal(stored.has('lsb_act_as'), false)
  assert.ok(events.includes(auth.ACTING_CHANGED_EVENT))
})

test('limite du compte gratuit ou session admin expirée : la fenêtre adaptée est prévenue', async () => {
  browser('lsbookers.com')
  responses = [json(403, { error: 'PRO_LIMIT' })]
  await auth.apiFetch(apiUrl('offers'), { method: 'POST' })
  responses = [json(401, { error: 'ADMIN_SESSION_EXPIRED' })]
  await auth.apiFetch(apiUrl('admin/users'))
  await new Promise(r => setTimeout(r, 10))
  assert.ok(events.includes(auth.PRO_REQUIRED_EVENT))
  assert.ok(events.includes(auth.ADMIN_SESSION_EXPIRED_EVENT))
})
