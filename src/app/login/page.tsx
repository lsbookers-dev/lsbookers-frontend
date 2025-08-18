'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios, { isAxiosError } from 'axios'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link' // ✅ AJOUT

export default function LoginPage() {
  const router = useRouter()
  const { user, setUser } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loginBg = process.env.NEXT_PUBLIC_LOGIN_BG

  useEffect(() => {
    if (user) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }, [user, setUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
      if (!API) throw new Error('NEXT_PUBLIC_API_URL manquant')

      const url = `${API}/api/auth/login`

      const response = await axios.post(
        url,
        { email, password },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
          timeout: 15_000,
        }
      )

      const { token, user } = response.data || {}

      if (token) localStorage.setItem('token', token)
      if (user) localStorage.setItem('user', JSON.stringify(user))

      setUser(user || null)

      if (user?.isAdmin) {
        router.push('/admin/settings')
      } else {
        router.push('/home')
      }
    } catch (err: unknown) {
      console.error('❌ Erreur de connexion', err)

      let msg = "Échec de la connexion. Réessaie."

      if (isAxiosError(err)) {
        const status = err.response?.status
        if (status === 401) msg = 'Identifiants incorrects.'
        else if (status === 404) msg = 'Endpoint introuvable (vérifie NEXT_PUBLIC_API_URL).'
        else if (err.code === 'ECONNABORTED') msg = 'La requête a expiré.'
        else if (err.message?.includes('Network Error')) msg = 'Erreur réseau (CORS ou indisponible).'
      } else if (err instanceof Error && err.message.includes('NEXT_PUBLIC_API_URL')) {
        msg = 'Configuration manquante côté frontend.'
      }

      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-black text-white bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <form onSubmit={handleSubmit} className="bg-black/70 backdrop-blur-md p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Se connecter</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <label className="block mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-4 text-black rounded"
          required
        />

        <label className="block mb-2">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-6 text-black rounded"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2 rounded"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>

        <div className="flex justify-between mt-4 text-sm">
          {/* Laisse en <a> tant que tu n'as pas de route dédiée */}
          <a href="#" className="text-gray-300 hover:underline">Mot de passe oublié ?</a>
          <Link href="/" className="text-gray-300 hover:underline">Retour</Link> {/* ✅ FIX */}
        </div>
      </form>
    </div>
  )
}