'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import axios, { isAxiosError } from 'axios'
import { useAuth } from '@/context/AuthContext'

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Bonjour 🌤'
  if (h >= 12 && h < 18) return 'Bon après-midi ☀️'
  if (h >= 18 && h < 22) return 'Bonsoir 🌆'
  return 'Bonne nuit 🌙'
}

/* ─────────────────────────────────────────────────────────
   PANNEAU GAUCHE — minimaliste
───────────────────────────────────────────────────────── */
function BrandingPanel() {
  return (
    <aside className="hidden lg:flex flex-col justify-between border-r border-white/8">

      <div className="p-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/15 group-hover:ring-white/30 transition flex items-center justify-center">
            <span className="font-black text-base tracking-widest">LS</span>
          </div>
          <div className="leading-tight">
            <p className="text-lg font-extrabold tracking-tight">LSBookers</p>
            <p className="text-[10px] text-white/50 tracking-widest uppercase">Réseau événementiel</p>
          </div>
        </Link>

        <div className="mt-16">
          <h1 className="text-5xl font-black tracking-tight leading-[1.1]">
            Content de<br />
            te revoir.
          </h1>
          <p className="mt-6 text-lg text-white/50 leading-relaxed max-w-xs">
            Des opportunités t&apos;attendent<br />de l&apos;autre côté.
          </p>
        </div>
      </div>

      <div className="p-10">
        <p className="text-xs text-white/30">© {new Date().getFullYear()} LSBookers — Tous droits réservés.</p>
      </div>
    </aside>
  )
}

/* ─────────────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuth()

  const [email, setEmail]                       = useState('')
  const [password, setPassword]                 = useState('')
  const [error, setError]                       = useState<string | null>(null)
  const [loading, setLoading]                   = useState(false)
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [resendLoading, setResendLoading]       = useState(false)
  const [resendSent, setResendSent]             = useState(false)
  const [greeting, setGreeting]                 = useState('')

  const DEFAULT_BG = 'https://res.cloudinary.com/dzpie6sij/image/upload/v1755121809/Landing_fz7zqx.png'
  const [bgUrl, setBgUrl] = useState(process.env.NEXT_PUBLIC_LANDING_BG || DEFAULT_BG)

  const API = (process.env.NEXT_PUBLIC_API_URL ||
    'https://lsbookers-backend-production.up.railway.app').replace(/\/$/, '')

  useEffect(() => { setGreeting(getGreeting()) }, [])

  useEffect(() => {
    fetch(`${API}/api/admin/settings`)
      .then(r => r.json())
      .then(data => { if (data?.loginBgUrl) setBgUrl(data.loginBgUrl) })
      .catch(() => {})
  }, [API])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setEmailNotVerified(false)
    setLoading(true)
    try {
      const response = await axios.post(
        `${API}/api/auth/login`,
        { email, password },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true, timeout: 15000 }
      )
      const { user, token } = response.data
      if (token) localStorage.setItem('token', token)
      if (user)  localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      router.replace((user?.isAdmin || user?.role === 'ADMIN') ? '/admin/dashboard' : '/home')
    } catch (err) {
      let message = 'Échec de la connexion.'
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          message = 'Identifiants incorrects.'
        } else if (err.response?.status === 403 && err.response?.data?.error === 'EMAIL_NOT_VERIFIED') {
          setEmailNotVerified(true)
          setLoading(false)
          return
        } else if (err.response?.status === 429) {
          message = 'Trop de tentatives. Réessayez dans 5 minutes.'
        } else if (err.message?.includes('Network')) {
          message = 'Erreur réseau.'
        }
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    try {
      await axios.post(`${API}/api/auth/resend-verification`, { email })
      setResendSent(true)
    } catch {
      setResendSent(true)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">

      {/* Photo de fond */}
      <Image
        src={bgUrl}
        alt="LSBookers"
        fill
        priority
        sizes="100vw"
        className="z-0 object-cover"
      />
      <div className="absolute inset-0 z-10 bg-black/60" />
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute -top-32 -left-28 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-pink-500/15 blur-3xl" />
      </div>

      {/* Grille 2 colonnes */}
      <div className="relative z-20 mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">

        <BrandingPanel />

        {/* Formulaire */}
        <main className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">

            {/* En-tête mobile */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/15 flex items-center justify-center">
                <span className="font-black text-sm tracking-widest">LS</span>
              </div>
              <span className="font-extrabold text-base">LSBookers</span>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-7 shadow-2xl"
            >
              {/* Titre */}
              <div className="mb-5">
                <p className="text-xs text-purple-400 font-semibold tracking-widest uppercase mb-1">{greeting}</p>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black">Se connecter</h2>
                  <Link
                    href="/"
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition"
                  >
                    ← Retour
                  </Link>
                </div>
                <p className="text-sm text-white/50 mt-1">
                  Pas encore de compte ?{' '}
                  <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition">
                    Créer un compte
                  </Link>
                </p>
              </div>

              {/* Erreurs */}
              {error && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {emailNotVerified && (
                <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  <p className="font-semibold">Email non confirmé</p>
                  <p className="mt-1 text-amber-200/70 text-xs">Vérifie ta boîte mail et clique sur le lien de confirmation.</p>
                  {resendSent ? (
                    <p className="mt-2 text-purple-400 text-xs">Email renvoyé !</p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="mt-2 text-xs text-amber-300 underline underline-offset-4 hover:text-white disabled:opacity-60"
                    >
                      {resendLoading ? 'Envoi…' : 'Renvoyer l\'email de confirmation'}
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-4">

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/75">Email</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-base">✉️</span>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="nom@domaine.com"
                      className="w-full rounded-xl bg-white/5 pl-10 pr-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/60 transition"
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-white/75">Mot de passe</label>
                    <Link href="/forgot-password" className="text-xs text-white/45 hover:text-purple-400 transition">
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-base">🔒</span>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-white/5 pl-10 pr-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/60 transition"
                    />
                  </div>
                </div>

                {/* Bouton */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-500 disabled:opacity-60 transition shadow-lg shadow-purple-900/40 mt-2"
                >
                  {loading ? 'Connexion…' : 'Se connecter →'}
                </button>

                <p className="text-center text-xs text-white/35">
                  Besoin d&apos;aide ?{' '}
                  <Link href="/contact" className="underline underline-offset-4 hover:text-white transition">
                    Contacte-nous
                  </Link>
                </p>

              </div>
            </form>

          </div>
        </main>
      </div>
    </div>
  )
}
