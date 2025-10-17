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

  // ---------- Fond Cloudinary (inchangé) ----------
  const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
  const ENV_FALLBACK =
    process.env.NEXT_PUBLIC_LOGIN_BG ||
    'https://res.cloudinary.com/your-cloud/image/upload/vXXXXXXXX/login_bg.png'

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
        /* on garde l’ENV */
      }
    })()
  }, [API])

  // ---------- Nettoyage session si déjà connecté (inchangé) ----------
  useEffect(() => {
    if (user) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- Login (inchangé) ----------
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
    <div className="relative w-full min-h-screen h-dvh text-white overflow-hidden bg-black">
      {/* Fond 4K (inchangé) */}
      <Image
        src={bgUrl}
        alt="Fond de connexion — structure lumière & son"
        fill
        priority
        sizes="100vw"
        className="object-cover z-0"
      />

      {/* Overlays + glows pour lisibilité et style cohérent Register */}
      <div className="absolute inset-0 z-10 bg-black/55" />
      <div className="absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -left-24 z-10 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 z-10 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />

      {/* Carte de login centrée */}
      <div className="relative z-20 flex items-center justify-center min-h-screen h-dvh px-5">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl"
        >
          {/* Header titre + bouton retour (router.push gardé) */}
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
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="underline underline-offset-4 hover:text-white"
            >
              Créer un compte
            </button>
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm text-white/80">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="nom@domaine.com"
                className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-emerald-500/60"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="mb-2 block text-sm text-white/80">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-emerald-500/60"
              />
            </div>

            {/* Actions secondaires */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="text-sm text-white/75 hover:text-white underline underline-offset-4"
              >
                Mot de passe oublié ?
              </button>
              <span className="text-xs text-white/50">Connexion sécurisée</span>
            </div>

            {/* CTA principal (couleurs alignées Register) */}
            <button
              type="submit"
              disabled={loading}
              className="group mt-2 w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
            >
              <span className="inline-flex items-center justify-center gap-2">
                {loading && (
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {loading ? 'Connexion…' : 'Se connecter'}
              </span>
            </button>

            {/* Lien secondaire */}
            <p className="text-center text-xs text-white/60">
              Besoin d’aide ?{' '}
              <button
                type="button"
                onClick={() => router.push('/contact')}
                className="underline underline-offset-4 hover:text-white"
              >
                Contacte-nous
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}