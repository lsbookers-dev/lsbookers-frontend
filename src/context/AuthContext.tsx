'use client'

import React, { createContext, useState, useEffect, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'

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

type RegisterData = {
  email: string
  password: string
  role: 'ARTIST' | 'ORGANIZER' | 'PROVIDER'
  name?: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  loading: boolean
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

/* ===================== Context ===================== */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/* ===================== Helpers ===================== */
// ✅ Typage strict pour la réponse brute du backend
type RawUser = {
  id: string | number
  email: string
  role: 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'
  name?: string
  avatar?: string | null
  avatarUrl?: string | null
  profile?: Profile
}

// ✅ Normalisation des données backend → User
const normalizeUser = (raw: RawUser): User => ({
  id: String(raw.id),
  email: raw.email,
  role: raw.role,
  name: raw.name,
  avatarUrl: raw.avatar || raw.avatarUrl || raw.profile?.bannerUrl || null,
  profile: raw.profile || undefined,
})

/* ===================== Provider ===================== */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  // 🔄 Vérifie si un utilisateur est stocké dans le localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      console.log('✅ AuthContext : utilisateur détecté dans le localStorage')
    } else {
      setToken(null)
      setUser(null)
      if (
        pathname !== '/login' &&
        pathname !== '/register' &&
        pathname !== '/' &&
        !pathname.startsWith('/admin')
      ) {
        router.replace('/login')
      }
    }
    setLoading(false)
  }, [pathname, router])

  /* ===================== Login ===================== */
  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      console.error('❌ Échec de la connexion')
      throw new Error('Login failed')
    }

    const data = await res.json()
    console.log('👤 Utilisateur connecté :', data.user)

    const normalized = normalizeUser(data.user)

    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(normalized))

    setToken(data.token)
    setUser(normalized)

    if (normalized.role === 'ADMIN') {
      router.replace('/admin/dashboard')
    } else {
      router.replace('/home')
    }
  }

  /* ===================== Register ===================== */
  const register = async (data: RegisterData) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      console.error('❌ Échec de l’inscription')
      throw new Error('Register failed')
    }

    const resData = await res.json()
    console.log('🆕 Nouvel utilisateur inscrit :', resData.user)

    const normalized = normalizeUser(resData.user)

    localStorage.setItem('token', resData.token)
    localStorage.setItem('user', JSON.stringify(normalized))

    setToken(resData.token)
    setUser(normalized)

    if (normalized.role === 'ADMIN') {
      router.replace('/admin/dashboard')
    } else {
      router.replace('/home')
    }
  }

  /* ===================== Logout ===================== */
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    router.replace('/login')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, setUser, login, register, logout }}>
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