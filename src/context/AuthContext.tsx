'use client'

import React, { createContext, useState, useEffect, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAuthToken, apiFetch, isCookieSessionMode, storeSession, COOKIE_SESSION_MARKER, setActingProfileId, ADMIN_SESSION_EXPIRED_EVENT } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { getOrCreateDeviceToken, persistDeviceToken } from '@/utils/deviceToken'
import { isStandaloneDisplay } from '@/lib/install'
import { disconnectSocket } from '@/lib/socket'

/* ===================== Types ===================== */

type Profile = {
  id: number
  specialties?: string[]
  location?: string
  radiusKm?: number
  country?: string
  latitude?: number
  longitude?: number
  typeEtablissement?: string
  bannerUrl?: string
  bio?: string
}

type User = {
  id: string
  email: string
  role: 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'
  name?: string
  profile?: Profile
  avatarUrl?: string | null
  canManageProfiles?: boolean
  /** Fenêtre de bienvenue déjà vue (elle ne s'ouvre qu'une fois, à la 1re connexion) */
  welcomeSeenAt?: string | null
}

/** Profil géré en cours (« Vous agissez en tant que ») : le site s'affiche comme ce profil */
export type Acting = {
  profileId: number
  requireApproval: boolean
  manager: { id: number; name: string; avatar: string | null; profileId: number | null }
}

type AuthContextType = {
  user: User | null
  acting: Acting | null
  token: string | null
  loading: boolean
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  login: (email: string, password: string) => Promise<AdminCodeStep | void>
  verifyAdminCode: (challenge: string, code: string) => Promise<void>
  endAdminSession: (reason: 'idle' | 'expired') => Promise<void>
  logout: () => void
}

/** Compte admin : après le mot de passe, un code à 6 chiffres est envoyé par e-mail */
export type AdminCodeStep = { twoFactorRequired: true; challenge: string; emailHint: string }

export type LoginError = Error & {
  status?: number
  code?: string
}

/* ===================== Context ===================== */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/* ===================== Helpers ===================== */
type RawUser = {
  id: string | number
  email: string
  role: 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'
  name?: string
  pseudo?: string
  firstName?: string
  avatar?: string | null
  avatarUrl?: string | null
  profile?: Profile & { avatar?: string | null }
  canManageProfiles?: boolean
  hasAgency?: boolean
  welcomeSeenAt?: string | null
}

const normalizeUser = (raw: RawUser): User => ({
  id: String(raw.id),
  email: raw.email,
  role: raw.role,
  name: raw.pseudo || raw.name || raw.firstName || undefined,
  avatarUrl: raw.avatar || raw.avatarUrl || raw.profile?.avatar || null,
  profile: raw.profile || undefined,
  // Formule Agence (payée ou offerte par l'admin) : gérer plusieurs profils
  canManageProfiles: !!(raw.hasAgency ?? raw.canManageProfiles),
  welcomeSeenAt: raw.welcomeSeenAt ?? null,
})

/* ===================== Routes publiques ===================== */
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/device-verified',
  '/contact',
  '/confirm-email-change',
  '/securiser-mon-compte', // lien « Ce n'était pas moi » de l'e-mail d'alerte de connexion
  '/gestion/invitation', // lien reçu par e-mail pour valider un profil géré
]

// Rubriques réservées aux membres. Une adresse hors de ces rubriques n'existe pas :
// elle doit afficher la page « introuvable », pas renvoyer vers la connexion.
// Toute nouvelle rubrique réservée aux membres doit être ajoutée ici.
const MEMBER_SECTIONS = new Set([
  'admin', 'agenda', 'artist', 'discover', 'gestion', 'home', 'messages', 'notifications', 'offers',
  'organizer', 'profile', 'provider', 'search', 'settings', 'space', 'studio-profile', 'subscriptions',
])

export const isPublicPath = (pathname: string) => {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (pathname.startsWith('/legal/')) return true
  if (pathname.startsWith('/b/')) return true // lien de booking partagé (visible sans compte)
  return !MEMBER_SECTIONS.has(pathname.split('/')[1] || '')
}

function clearLocalSession() {
  setActingProfileId(null)
  try { localStorage.removeItem('user') } catch { }
  try { localStorage.removeItem('token') } catch { }
}

async function clearApplicationCaches() {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration()
  const worker = navigator.serviceWorker.controller || registration?.active
  worker?.postMessage({ type: 'CLEAR_CACHES' })
}

/* ===================== Provider ===================== */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [acting, setActing] = useState<Acting | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false
    const storedToken = getAuthToken()
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 8000)

    // Les pages publiques ne doivent jamais attendre le backend pour s'afficher.
    if (isPublicPath(window.location.pathname)) setLoading(false)

    const cookieMode = isCookieSessionMode()

    const validateSession = async () => {
      try {
        // Passage au mode « cookie uniquement » : une ancienne session (jeton en localStorage)
        // est convertie une fois en cookie httpOnly, puis le jeton est effacé du navigateur.
        if (cookieMode && storedToken && storedToken !== COOKIE_SESSION_MARKER) {
          await fetch(apiUrl('auth/session'), {
            method: 'POST',
            headers: { Authorization: `Bearer ${storedToken}` },
            credentials: 'include',
            signal: controller.signal,
          }).catch(() => {})
          storeSession(null)
        }

        const res = await apiFetch(apiUrl('auth/me'), {
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!res.ok) {
          if ([401, 403, 404].includes(res.status)) { clearLocalSession(); disconnectSocket() }
          if (!cancelled) {
            setToken(null)
            setUser(null)
          }
          return
        }

        const data = await res.json()
        const normalized = normalizeUser(data.user)
        if (!cancelled) setActing(data.acting || null)

        // Mode cookie : la session est portée par le cookie httpOnly, on ne garde qu'un marqueur.
        if (cookieMode) {
          storeSession(null)
          try { localStorage.setItem('user', JSON.stringify(normalized)) } catch { }
          if (!cancelled) {
            setToken(COOKIE_SESSION_MARKER)
            setUser(normalized)
          }
          return
        }

        // Mode transition : les écrans utilisent le jeton. Une session retrouvée
        // uniquement par cookie est fermée proprement pour éviter un état partiel.
        if (!storedToken) {
          await apiFetch(apiUrl('auth/logout'), {
            method: 'POST',
            credentials: 'include',
          }).catch(() => {})
          clearLocalSession()
          if (!cancelled) {
            setToken(null)
            setUser(null)
          }
          return
        }

        try { localStorage.setItem('user', JSON.stringify(normalized)) } catch { }
        if (!cancelled) {
          setToken(storedToken)
          setUser(normalized)
        }
      } catch {
        if (!cancelled) {
          setToken(null)
          setUser(null)
        }
      } finally {
        window.clearTimeout(timeout)
        if (!cancelled) setLoading(false)
      }
    }

    validateSession()
    return () => {
      cancelled = true
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (!loading && !user && !isPublicPath(pathname)) {
      router.replace('/login')
    }
    // Déjà connecté : l'appli installée (et la page d'accueil) mènent directement au fil
    if (!loading && user && (pathname === '/' || pathname === '/login')) {
      router.replace(user.role === 'ADMIN' ? '/admin/dashboard' : '/home')
    }
  }, [loading, pathname, router, user])

  /* ===================== Login ===================== */
  const login = async (email: string, password: string) => {
    // Envoyer le device token stocké pour identifier les appareils déjà connus
    const storedDeviceToken = getOrCreateDeviceToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (storedDeviceToken) headers['X-Device-Token'] = storedDeviceToken

    const res = await apiFetch(apiUrl('auth/login'), {
      method: 'POST',
      headers,
      // Application installée (écran d'accueil) : appareil nommé à part, pas de fausse alerte de connexion
      body: JSON.stringify({ email, password, standalone: isStandaloneDisplay() }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const error = new Error(data?.error || 'Login failed') as LoginError
      error.status = res.status
      error.code = data?.error
      throw error
    }

    const data = await res.json()
    if (data?.twoFactorRequired) return data as AdminCodeStep
    finishLogin(data)
  }

  /* ===================== Code de sécurité admin ===================== */
  const verifyAdminCode = async (challenge: string, code: string) => {
    const res = await apiFetch(apiUrl('auth/admin-code'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge, code }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const error = new Error(data?.error || 'Code refusé') as LoginError & { attemptsLeft?: number }
      error.status = res.status
      error.code = data?.error
      error.attemptsLeft = data?.attemptsLeft
      throw error
    }
    finishLogin(data)
  }

  const finishLogin = (data: { user: RawUser; token?: string; deviceToken?: string }) => {
    const normalized = normalizeUser(data.user)
    setActingProfileId(null)
    setActing(null)

    // Cookie httpOnly posé par le backend. Le jeton n'est gardé dans le navigateur qu'en
    // mode transition (API sur un autre site) ; en mode cookie, seul un marqueur est stocké.
    localStorage.setItem('user', JSON.stringify(normalized))
    storeSession(data.token)
    // Persister le device token pour les prochaines connexions
    if (data.deviceToken) persistDeviceToken(data.deviceToken)

    setToken(getAuthToken())
    setUser(normalized)

    if (normalized.role === 'ADMIN') {
      router.replace('/admin/dashboard')
    } else {
      router.replace('/home')
    }
  }

  /* ===================== Fin de session admin ===================== */
  // 1 h sans activité (minuteur de l'admin) ou session fermée par le serveur
  const endAdminSession = async (reason: 'idle' | 'expired') => {
    try { await apiFetch(apiUrl('auth/logout'), { method: 'POST' }) } catch { }
    disconnectSocket()
    clearLocalSession()
    // Rechargement complet (et non router.replace) : sinon la redirection « pas connecté » vers
    // /login passe avant et le message de fin de session est perdu
    window.location.replace(`/login?admin=${reason}`)
  }

  useEffect(() => {
    const onExpired = () => { if (user?.role === 'ADMIN') endAdminSession('expired') }
    window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, onExpired)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role])

  /* ===================== Logout ===================== */
  const logout = async () => {
    // Efface le cookie httpOnly côté serveur
    try {
      await apiFetch(apiUrl('auth/logout'), { method: 'POST' })
    } catch { }
    disconnectSocket()
    clearLocalSession()
    await clearApplicationCaches().catch(() => {})
    setToken(null)
    setUser(null)
    setActing(null)
    router.replace('/login')
  }

  return (
    <AuthContext.Provider value={{ user, acting, token, loading, setUser, login, verifyAdminCode, endAdminSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/* ===================== Hook ===================== */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
