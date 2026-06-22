'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import axios, { isAxiosError } from 'axios'

const API = (process.env.NEXT_PUBLIC_API_URL || 'https://lsbookers-backend-production.up.railway.app').replace(/\/$/, '')

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (!token) {
      setError('Lien invalide.')
      return
    }

    setLoading(true)
    try {
      await axios.post(`${API}/api/auth/reset-password`, { token, password })
      setDone(true)
    } catch (err) {
      if (isAxiosError(err)) {
        const msg = err.response?.data?.error || err.response?.data?.message
        if (err.response?.status === 400) {
          setError('Ce lien est invalide ou a expiré. Refais une demande de réinitialisation.')
        } else {
          setError(msg || 'Erreur lors de la réinitialisation.')
        }
      } else {
        setError('Erreur réseau.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_#0b0b10_0%,_#050508_55%)] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-28 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-[42rem] -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-[4rem] border border-white/5 bg-white/5 blur-2xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">
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
              <h1 className="text-4xl font-extrabold tracking-tight">Nouveau mot de passe</h1>
              <p className="max-w-md text-white/70">
                Choisis un nouveau mot de passe sécurisé pour ton compte LSBookers.
              </p>
            </div>
          </div>
          <div className="p-10">
            <p className="text-xs text-white/50">© {new Date().getFullYear()} LSBookers — Tous droits réservés.</p>
          </div>
        </aside>

        <main className="flex items-center justify-center p-6 lg:p-12">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Nouveau mot de passe</h2>
              <Link
                href="/login"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                Connexion
              </Link>
            </div>

            {done ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/20 ring-2 ring-emerald-500/50">
                  <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Mot de passe modifié !</h3>
                  <p className="mt-2 text-sm text-white/60">
                    Ton mot de passe a été mis à jour. Tu peux maintenant te connecter.
                  </p>
                </div>
                <button
                  onClick={() => router.replace('/login')}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-500"
                >
                  Se connecter →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {!token && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    Lien invalide. Refais une demande de réinitialisation.
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm text-white/80">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Au moins 8 caractères"
                    className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-emerald-500/60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/80">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-emerald-500/60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
                </button>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
