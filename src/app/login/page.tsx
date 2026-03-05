'use client'

import { useEffect, useRef, useState } from 'react'
import axios, { isAxiosError } from 'axios'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const { user, setUser } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const API =
    (process.env.NEXT_PUBLIC_API_URL || 'https://lsbookers-backend-production.up.railway.app')
      .replace(/\/$/, '')

  // ---- Récup du fond (conservé, même si on ne l'affiche plus en image ici) ----
  const ENV_FALLBACK =
    process.env.NEXT_PUBLIC_LOGIN_BG ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1600&auto=format'
  const [, setBgUrl] = useState<string>(ENV_FALLBACK)

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

  // ---- Déconnexion automatique uniquement au 1er rendu ----
  const didRunLogoutRef = useRef(false)
  const initialUserRef = useRef(user)
  useEffect(() => {
    if (didRunLogoutRef.current) return
    didRunLogoutRef.current = true
    if (initialUserRef.current) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUser])

  // ---- Login ----
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

      const { token, user: userPayload } = response.data || {}

      if (token) localStorage.setItem('token', token)
      if (userPayload) localStorage.setItem('user', JSON.stringify(userPayload))

      setUser(userPayload || null)

      const to = userPayload?.isAdmin ? '/admin/settings' : '/home'
      router.replace(to)
    } catch (err) {
      console.error('❌ Erreur de connexion', err)
      let msg = 'Échec de la connexion. Réessaie.'
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_#0b0b10_0%,_#050508_55%)] text-white">
      {/* Glow décoratifs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-28 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-[42rem] -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-[4rem] border border-white/5 bg-white/5 blur-2xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">
        {/* Panneau branding */}
        <aside className="hidden lg:flex flex-col justify-between border-r border-white/10">
          <div className="p-10">
            <Link href="/" className="inline-flex items-center gap-3 group" aria-label="Retour à l’accueil">
              <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/15 group-hover:ring-white/25 transition flex items-center justify-center">
                <span className="font-black text-lg tracking-widest">LS</span>
              </div>
              <div className="leading-tight">
                <p className="text-xl font-extrabold tracking-tight">Bookers</p>
                <p className="text-xs text-white/60">Plateforme de booking</p>
              </div>
            </Link>

            <div className="mt-12 space-y-5">
              <h1 className="text-4xl font-extrabold tracking-tight">Content de te revoir.</h1>
              <p className="max-w-md text-white/70">
                Connecte-toi pour accéder à ton espace, gérer ton profil et échanger avec la communauté.
              </p>

              {/* ✅ Suppression des 3 tags ici (comme demandé) */}
            </div>
          </div>

          <div className="p-10">
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} LSBookers — Tous droits réservés.
            </p>
          </div>
        </aside>

        {/* Carte formulaire */}
        <main className="flex items-center justify-center p-6 lg:p-12">
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
          >
            {/* Liseré discret */}
            <span className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:linear-gradient(black,transparent_30%,transparent_70%,black)]">
              <span className="absolute inset-0 -z-10 rounded-2xl ring-1 ring-white/10" />
            </span>

            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Se connecter</h2>
              <Link
                href="/"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                Retour
              </Link>
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
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-2 block text-sm text-white/80">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="nom@domaine.com"
                    className="w-full rounded-xl bg-white/5 px-4 py-2.5 pr-10 text-white placeholder-white/40 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-emerald-500/60"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                    @
                  </span>
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label htmlFor="password" className="mb-2 block text-sm text-white/80">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-white/5 px-4 py-2.5 pr-10 text-white placeholder-white/40 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-emerald-500/60"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                    •••
                  </span>
                </div>
              </div>

              {/* Mot de passe oublié */}
              <div className="flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-sm text-white/75 hover:text-white underline underline-offset-4 transition"
                  prefetch={false}
                >
                  Mot de passe oublié ?
                </Link>
                <span className="text-xs text-white/50">Connexion sécurisée</span>
              </div>

              {/* CTA */}
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

              <p className="text-center text-xs text-white/60">
                Besoin d’aide ?{' '}
                <Link href="/contact" className="underline underline-offset-4 hover:text-white">
                  Contacte-nous
                </Link>
              </p>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}