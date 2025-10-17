'use client'

import { useState, useEffect } from 'react'
import axios, { isAxiosError } from 'axios'
import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const { user, setUser } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
  const ENV_FALLBACK =
    process.env.NEXT_PUBLIC_LOGIN_BG ||
    // ✅ Mets une image valide pour éviter les 404 en prod
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1600&auto=format'

  const [bgUrl, setBgUrl] = useState<string>(ENV_FALLBACK)

  useEffect(() => {
    if (!API) return
    ;(async () => {
      try {
        const r = await fetch(`${API}/api/settings/public/login_bg_url`, { cache: 'no-store' })
        if (!r.ok) return
        const data = (await r.json()) as { value?: string }
        if (data?.value) setBgUrl(data.value)
      } catch {
        /* on garde l’ENV si l’endpoint renvoie 404 */
      }
    })()
  }, [API])

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
      if (!API) throw new Error('NEXT_PUBLIC_API_URL manquant')

      const url = `${API}/api/auth/login`
      const response = await axios.post(
        url,
        { email, password },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true, timeout: 15000 }
      )

      const { token, user } = response.data || {}
      if (token) localStorage.setItem('token', token)
      if (user) localStorage.setItem('user', JSON.stringify(user))

      setUser(user || null)
      router.push(user?.isAdmin ? '/admin/settings' : '/home')
    } catch (err) {
      console.error('❌ Erreur de connexion', err)
      let msg = "Échec de la connexion. Réessaie."
      if (isAxiosError(err)) {
        const status = err.response?.status
        if (status === 401) msg = 'Identifiants incorrects.'
        else if (status === 404) msg = 'Endpoint introuvable (NEXT_PUBLIC_API_URL).'
        else if (err.code === 'ECONNABORTED') msg = 'Requête expirée.'
        else if (err.message?.includes('Network Error')) msg = 'Erreur réseau.'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full min-h-screen text-white overflow-hidden bg-black">
      {/* Fond */}
      <Image
        src={bgUrl}
        alt="Fond de connexion"
        fill
        priority
        sizes="100vw"
        className="object-cover z-0"
      />

      {/* Overlays (ne bloquent pas les clics) */}
      <div className="absolute inset-0 z-10 bg-black/55 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      {/* 🔎 Lien de secours pour test direct (peut être retiré après) */}
      <a
        href="/forgot-password"
        onClick={(e) => { e.preventDefault(); window.location.assign('/forgot-password') }}
        className="fixed top-3 right-3 z-50 text-xs text-white/70 underline underline-offset-4 hover:text-white"
      >
        Test /forgot-password
      </a>

      {/* Carte */}
      <div className="relative z-20 flex items-center justify-center min-h-screen px-5">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl"
        >
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Se connecter</h2>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              Retour
            </button>
          </div>

          <p className="text-sm text-white/70">
            Nouveau sur la plateforme ?{' '}
            <Link href="/register" className="underline underline-offset-4 hover:text-white">
              Créer un compte
            </Link>
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/80">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="nom@domaine.com"
                className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/60"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/80">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/60"
              />
            </div>

            {/* ✅ Lien forcé côté serveur vers forgot-password */}
            {/* eslint-disable @next/next/no-html-link-for-pages */}
            <div className="flex items-center justify-between">
              <a
                href="/forgot-password"
                onClick={(e) => { e.preventDefault(); window.location.assign('/forgot-password') }}
                className="relative z-30 text-sm text-white/75 hover:text-white underline underline-offset-4 transition"
              >
                Mot de passe oublié ?
              </a>
              <span className="text-xs text-white/50">Connexion sécurisée</span>
            </div>
            {/* eslint-enable @next/next/no-html-link-for-pages */}

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 transition"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>

            <p className="text-center text-xs text-white/60">
              Besoin d’aide ?{' '}
              <Link href="/contact" className="underline underline-offset-4 hover:text-white">
                Contacte-nous
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}