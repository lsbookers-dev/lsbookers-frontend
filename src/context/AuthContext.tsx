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
}

type User = {
  id: string
  email: string
  role: 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'
  name?: string
  profile?: Profile
  avatarUrl?: string
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
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      console.error('❌ Échec de la connexion')
      throw new Error('Login failed')
    }

    const data = await res.json()
    console.log('👤 Utilisateur connecté :', data.user)

    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))

    setToken(data.token)
    setUser(data.user)

    if (data.user.role === 'ADMIN') {
      router.replace('/admin/dashboard')
    } else {
      router.replace('/home')
    }
  }

  const register = async (data: RegisterData) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      console.error('❌ Échec de l’inscription')
      throw new Error('Register failed')
    }

    const resData = await res.json()
    console.log('🆕 Nouvel utilisateur inscrit :', resData.user)

    localStorage.setItem('token', resData.token)
    localStorage.setItem('user', JSON.stringify(resData.user))

    setToken(resData.token)
    setUser(resData.user)

    if (resData.user.role === 'ADMIN') {
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