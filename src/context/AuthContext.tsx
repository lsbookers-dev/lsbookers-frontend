'use client'

import React, { createContext, useState, useEffect, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAuthToken } from '@/utils/auth'

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
}

type AuthContextType = {
  user: User | null
  token: string | null
  loading: boolean
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
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
}

const normalizeUser = (raw: RawUser): User => ({
  id: String(raw.id),
  email: raw.email,
  role: raw.role,
  name: raw.pseudo || raw.name || raw.firstName || undefined,
  avatarUrl: raw.avatar || raw.avatarUrl || raw.profile?.avatar || null,
  profile: raw.profile || undefined,
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
]

const isPublicPath = (pathname: string) => {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (pathname.startsWith('/legal/')) return true
  return false
}

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'https://lsbookers-backend-production.up.railway.app'
).replace(/\/+$/, '').replace(/\/api$/, '')

function clearLocalSession() {
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

    const validateSession = async () => {
      try {
        const headers: HeadersInit = {}
        if (storedToken) headers.Authorization = `Bearer ${storedToken}`

        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers,
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!res.ok) {
          if ([401, 403, 404].includes(res.status)) clearLocalSession()
          if (!cancelled) {
            setToken(null)
            setUser(null)
          }
          return
        }

        const data = await res.json()
        const normalized = normalizeUser(data.user)

        // Les écrans actuels utilisent le Bearer token. Une session retrouvée
        // uniquement par cookie est fermée proprement pour éviter un état partiel.
        if (!storedToken) {
          await fetch(`${API_URL}/api/auth/logout`, {
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
  }, [loading, pathname, router, user])

  /* ===================== Login ===================== */
  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      console.error('❌ Échec de la connexion')
      throw new Error('Login failed')
    }

    const data = await res.json()
    console.log('👤 Utilisateur connecté :', data.user)

    const normalized = normalizeUser(data.user)

    // Cookie httpOnly posé par le backend + token en localStorage (fallback Safari)
    localStorage.setItem('user', JSON.stringify(normalized))
    localStorage.setItem('token', data.token)

    setToken(data.token)
    setUser(normalized)

    if (normalized.role === 'ADMIN') {
      router.replace('/admin/dashboard')
    } else {
      router.replace('/home')
    }
  }

  /* ===================== Logout ===================== */
  const logout = async () => {
    // Efface le cookie httpOnly côté serveur
    try {
      const headers: HeadersInit = {}
      if (token) headers.Authorization = `Bearer ${token}`
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers,
        credentials: 'include',
      })
    } catch { }
    clearLocalSession()
    await clearApplicationCaches().catch(() => {})
    setToken(null)
    setUser(null)
    router.replace('/login')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, setUser, login, logout }}>
      {!loading && children}
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
