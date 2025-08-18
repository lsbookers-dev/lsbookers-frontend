'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios, { isAxiosError } from 'axios'
import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const { user, setUser } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // ---------- Fond Cloudinary (modifiable depuis l'admin) ----------
  const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
  const ENV_FALLBACK =
    process.env.NEXT_PUBLIC_LOGIN_BG ||
    // ↙️ mets ici ton URL Cloudinary 4K par défaut (si pas d’API)
    'https://res.cloudinary.com/your-cloud/image/upload/vXXXXXXXX/login.png'

  const [bgUrl, setBgUrl] = useState<string>(ENV_FALLBACK)

  useEffect(() => {
    if (!API) return
    ;(async () => {
      try {
        // Endpoint de lecture publique conseillé: /api/settings/public/login_bg_url
        const r = await fetch(`${API}/api/settings/public/login_bg_url`, { cache: 'no-store' })
        if (!r.ok) return
        const data = (await r.json()) as { value?: string }
        if (data?.value) setBgUrl(data.value)
      } catch {
        /* on garde l’ENV */
      }
    })()
  }, [API])

  // ---------- Nettoyage session éventuelle si déjà connecté ----------
  useEffect(() => {
    if (user) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- Login ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
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
    <div className="relative w-full min-h-screen h-dvh text-white overflow-hidden">
      {/* Fond 4K */}
      <Image
        src={bgUrl}
        alt="Fond de connexion — structure lumière & son"
        fill
        priority
        sizes="100vw"
        className="object-cover z-0"
      />

      {/* Overlays pour lisibilité */}
      <div className="absolute inset-0 z-10 bg-black/30" />
      <div className="absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      {/* Carte de login centrée */}
      <div className="relative z-20 flex items-center justify-center min-h-screen h-dvh px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 shadow-2xl"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Se connecter</h2>

          {error && (
            <p className="text-sm mb-4 rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2">
              {error}
            </p>
          )}

          <label className="block mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 mb-4 text-white placeholder-white/60 rounded-lg bg-black/40 border border-white/15 focus:border-white/40 outline-none"
            placeholder="ton@email.com"
            required
          />

          <label className="block mb-2">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 mb-4 text-white placeholder-white/60 rounded-lg bg-black/40 border border-white/15 focus:border-white/40 outline-none"
            placeholder="••••••••"
            required
          />

          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="text-sm text-white/85 hover:text-white underline underline-offset-4"
            >
              Mot de passe oublié ?
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm text-white/85 hover:text-white underline underline-offset-4"
            >
              Retour
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-2.5 rounded-lg hover:bg-neutral-200 disabled:opacity-60"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}