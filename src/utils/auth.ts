/**
 * utils/auth.ts — Point UNIQUE de lecture de la session côté navigateur.
 *
 * Deux modes, choisis automatiquement selon l'adresse de l'API :
 * - « cookie uniquement » : l'API est sur le même site que la page (api.lsbookers.com pour
 *   lsbookers.com, ou localhost en local). Le jeton de connexion reste dans un cookie
 *   httpOnly illisible par le JavaScript ; localStorage ne contient qu'un marqueur « connecté ».
 * - « transition » : l'API est sur un autre site (railway.app). Safari bloquerait le cookie,
 *   donc le jeton est encore gardé dans localStorage et envoyé en en-tête Authorization.
 */
import { API_BASE } from '@/utils/api'

/** Valeur stockée à la place du jeton en mode cookie (non secrète) */
export const COOKIE_SESSION_MARKER = 'cookie-session'

function registrableDomain(hostname: string) {
  if (hostname === 'localhost' || /^[\d.]+$/.test(hostname)) return hostname
  return hostname.split('.').slice(-2).join('.')
}

const API_ORIGIN = (() => {
  try { return new URL(API_BASE).origin } catch { return '' }
})()

/** Vrai si l'API est sur le même site que la page → le cookie httpOnly suffit */
export function isCookieSessionMode(): boolean {
  if (typeof window === 'undefined' || !API_ORIGIN) return false
  try {
    return registrableDomain(new URL(API_ORIGIN).hostname) === registrableDomain(window.location.hostname)
  } catch {
    return false
  }
}

/** Jeton (mode transition), marqueur (mode cookie) ou null si déconnecté */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('token')
    } catch {
      return null
    }
  }
  return null
}

/** Enregistre la session après connexion : jamais le jeton en mode cookie */
export function storeSession(token: string | null | undefined) {
  try {
    if (isCookieSessionMode()) localStorage.setItem('token', COOKIE_SESSION_MARKER)
    else if (token) localStorage.setItem('token', token)
  } catch { }
}

/** Vrai si la valeur est un vrai jeton JWT (et non le marqueur du mode cookie) */
function isJwt(value: string | null): value is string {
  return !!value && value.split('.').length === 3
}

/**
 * « Vous agissez en tant que » : profil géré choisi dans le sélecteur (agent, plusieurs salles).
 * Envoyé au serveur dans l'en-tête X-Act-As-Profile ; absent = son propre profil.
 */
const ACT_AS_KEY = 'lsb_act_as'
const ACT_AS_HEADER = 'X-Act-As-Profile'
export const ACTING_CHANGED_EVENT = 'lsb:acting-changed'

export function getActingProfileId(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const id = Number(localStorage.getItem(ACT_AS_KEY))
    return Number.isInteger(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

export function setActingProfileId(profileId: number | null) {
  try {
    if (profileId) localStorage.setItem(ACT_AS_KEY, String(profileId))
    else localStorage.removeItem(ACT_AS_KEY)
  } catch { }
  window.dispatchEvent(new CustomEvent(ACTING_CHANGED_EVENT))
}

/** Identifiant de l'utilisateur connecté (lu depuis le profil mis en cache) */
export function getUserId(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    const id = Number(user?.id)
    return Number.isFinite(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

/**
 * fetch vers l'API avec la session : cookie toujours inclus, et en mode transition
 * l'en-tête Authorization. Toute autre adresse (API externe) part sans rien de tout ça.
 */
export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  let isApi = false
  try {
    isApi = !!API_ORIGIN && new URL(input, window.location.href).origin === API_ORIGIN
  } catch { }
  if (!isApi) return fetch(input, init)

  const headers = new Headers(init.headers)
  const token = getAuthToken()
  if (!isCookieSessionMode() && isJwt(token) && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const actingId = getActingProfileId()
  if (actingId && !headers.has(ACT_AS_HEADER)) headers.set(ACT_AS_HEADER, String(actingId))
  return fetch(input, { ...init, headers, credentials: 'include' }).then(async res => {
    // Gestion retirée entre-temps (l'artiste a repris la main) : on revient à son propre profil
    if (res.status === 403 && actingId) {
      const body = await res.clone().json().catch(() => null)
      if (body?.error === 'MANAGEMENT_ENDED') {
        setActingProfileId(null)
        headers.delete(ACT_AS_HEADER)
        return fetch(input, { ...init, headers, credentials: 'include' })
      }
    }
    return res
  }).then(res => {
    // Limite du compte gratuit atteinte : la fenêtre « Passer en Pro » s'ouvre, où que soit l'action
    if (res.status === 403) {
      res.clone().json().then((body) => {
        if (body?.error === 'PRO_LIMIT' || body?.error === 'PRO_REQUIRED') {
          window.dispatchEvent(new CustomEvent(PRO_REQUIRED_EVENT, { detail: body }))
        }
      }).catch(() => { })
    }
    return res
  })
}

/** Événement envoyé quand une action demande la version Pro (écouté par <UpgradePrompt />) */
export const PRO_REQUIRED_EVENT = 'lsb:pro-required'
