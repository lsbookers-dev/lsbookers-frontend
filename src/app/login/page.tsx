'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { user, setUser } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Nettoyage d’une éventuelle session locale si on arrive déjà connecté
  useEffect(() => {
    if (user) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
      if (!API) throw new Error('NEXT_PUBLIC_API_URL manquant')

      // 👉 IMPORTANT : /api/auth/login (et pas /auth/login)
      const url = `${API}/api/auth/login`

      const response = await axios.post(
        url,
        { email, password },
        {
          headers: { 'Content-Type': 'application/json' },
          // Laisse à true si ton backend pose un cookie HttpOnly,
          // sinon ça ne gêne pas.
          withCredentials: true,
          timeout: 15_000,
        }
      )

      const { token, user } = response.data || {}

      // Si ton backend renvoie un JWT dans le body
      if (token) localStorage.setItem('token', token)
      if (user) localStorage.setItem('user', JSON.stringify(user))

      setUser(user || null)

      if (user?.isAdmin) {
        router.push('/admin/settings')
      } else {
        router.push('/home')
      }
    } catch (err: any) {
      console.error('❌ Erreur de connexion', err)
      // Messages d’erreur plus explicites
      const msg =
        err?.response?.status === 401
          ? 'Identifiants incorrects.'
          : err?.response?.status === 404
          ? 'Endpoint introuvable (vérifie NEXT_PUBLIC_API_URL).'
          : err?.message?.includes('NEXT_PUBLIC_API_URL')
          ? 'Configuration manquante côté frontend.'
          : "Échec de la connexion. Réessaie."

      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded shadow-md w-full max-w-md">
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
      </form>
    </div>
  )
}