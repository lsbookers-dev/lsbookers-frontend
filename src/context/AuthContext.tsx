'use client'

import React, { createContext, useState, useEffect, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// ✅ Types

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
  avatar?: string | null
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

// ✅ Contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ✅ Normalisation des données user renvoyées par l’API
const normalizeUser = (raw: any): User => ({
  id: String(raw.id),
  email: raw.email,
  role: raw.role,
  name: raw.name,
  avatarUrl: raw.avatar || raw.avatarUrl || raw.profile?.avatar || null,
  profile: raw.profile || undefined,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const API_URL = process.env.NEXT_PUBLIC_API_URL

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
    const user = normalizeUser(data.user)
    console.log('👤 Utilisateur connecté :', user)

    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(user))

    setToken(data.token)
    setUser(user)

    if (user.role === 'ADMIN') {
      router.replace('/admin/dashboard')
    } else {
      router.replace('/home')
    }
  }

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
    const user = normalizeUser(resData.user)
    console.log('🆕 Nouvel utilisateur inscrit :', user)

    localStorage.setItem('token', resData.token)
    localStorage.setItem('user', JSON.stringify(user))

    setToken(resData.token)
    setUser(user)

    if (user.role === 'ADMIN') {
      router.replace('/admin/dashboard')
    } else {
      router.replace('/home')
    }
  }

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

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}