'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios, { isAxiosError } from 'axios'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const API =
    (process.env.NEXT_PUBLIC_API_URL ||
      'https://lsbookers-backend-production.up.railway.app').replace(/\/$/, '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setError(null)
    setLoading(true)

    try {
      const response = await axios.post(
        `${API}/api/auth/login`,
        { email, password },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
          timeout: 15000,
        }
      )

      const { token, user } = response.data

      if (token) localStorage.setItem('token', token)
      if (user) localStorage.setItem('user', JSON.stringify(user))

      setUser(user)

      const redirect = user?.isAdmin ? '/admin/dashboard' : '/home'
      router.replace(redirect)
    } catch (err) {
      let message = 'Échec de la connexion.'

      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          message = 'Identifiants incorrects.'
        } else if (err.message?.includes('Network')) {
          message = 'Erreur réseau.'
        }
      }

      setError(message)
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

        {/* Branding gauche */}
        <aside className="hidden lg:flex flex-col justify-between border-r border-white/10">
          <div className="p-10">

            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/15 group-hover:ring-white/25 transition flex items-center justify-center">
                <span className="font-black text-lg tracking-widest">LS</span>
              </div>

              <div className="leading-tight">
                <p className="text-xl font-extrabold tracking-tight">Bookers</p>
                <p className="text-xs text-white/60">Plateforme de booking</p>
              </div>
            </Link>

            <div className="mt-12 space-y-5">
              <h1 className="text-4xl font-extrabold tracking-tight">
                Content de te revoir.
              </h1>

              <p className="max-w-md text-white/70">
                Connecte-toi pour accéder à ton espace et gérer ton activité
                sur la plateforme LSBookers.
              </p>
            </div>
          </div>

          <div className="p-10">
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} LSBookers — Tous droits réservés.
            </p>
          </div>
        </aside>

        {/* Formulaire */}
        <main className="flex items-center justify-center p-6 lg:p-12">
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Se connecter</h2>

              <Link
                href="/"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                Retour
              </Link>
            </div>

            <p className="text-sm text-white/65">
              Nouveau sur la plateforme ?{' '}
              <Link
                href="/register"
                className="underline underline-offset-4 hover:text-white"
              >
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
                <label className="mb-2 block text-sm text-white/80">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nom@domaine.com"
                  className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/60"
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label className="mb-2 block text-sm text-white/80">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/60"
                />
              </div>

              {/* Forgot password */}
              <div className="flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-sm text-white/70 underline underline-offset-4 hover:text-white"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 transition"
              >
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>

              <p className="text-center text-xs text-white/60">
                Besoin d’aide ?{' '}
                <Link
                  href="/contact"
                  className="underline underline-offset-4 hover:text-white"
                >
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