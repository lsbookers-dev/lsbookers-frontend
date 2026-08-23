'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import axios, { isAxiosError } from 'axios'
import { Eye, EyeOff } from 'lucide-react'

const API = (process.env.NEXT_PUBLIC_API_URL || 'https://lsbookers-backend-production.up.railway.app').replace(/\/$/, '')

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [loading, setLoading]           = useState(false)
  const [success, setSuccess]           = useState(false)
  const [error, setError]               = useState<string | null>(null)

  useEffect(() => {
    if (!token) setError('Lien invalide ou expiré. Refais une demande de réinitialisation.')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      await axios.post(`${API}/api/auth/reset-password`, { token, password })
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      if (isAxiosError(err)) {
        const msg = err.response?.data?.error
        if (msg?.includes('différent')) {
          setError('Le nouveau mot de passe doit être différent de l\'ancien.')
        } else if (msg?.includes('invalide') || msg?.includes('expire')) {
          setError('Lien invalide ou expiré. Refais une demande de réinitialisation.')
        } else {
          setError('Une erreur est survenue. Réessaie dans quelques instants.')
        }
      } else {
        setError('Une erreur est survenue. Réessaie dans quelques instants.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-7 shadow-2xl">

      {success ? (
        /* ── Succès ── */
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-3xl">
            ✅
          </div>
          <h2 className="text-xl font-black mb-2">Mot de passe mis à jour !</h2>
          <p className="text-sm text-white/55 leading-relaxed">
            Tu vas être redirigé vers la page de connexion dans quelques secondes…
          </p>
          <Link
            href="/login"
            className="mt-5 inline-block text-sm text-purple-400 hover:text-purple-300 transition"
          >
            Se connecter maintenant →
          </Link>
        </div>
      ) : (
        /* ── Formulaire ── */
        <>
          <div className="mb-5">
            <h2 className="text-2xl font-black mb-1">Nouveau mot de passe</h2>
            <p className="text-sm text-white/50">
              Choisis un nouveau mot de passe sécurisé, différent de l&apos;ancien.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
              {(error.includes('invalide') || error.includes('expiré')) && (
                <div className="mt-2">
                  <Link href="/forgot-password" className="text-purple-400 underline underline-offset-4 hover:text-purple-300 transition text-xs">
                    Refaire une demande
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nouveau mot de passe */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/75">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-base">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="8 caractères minimum"
                  disabled={!token}
                  className="w-full rounded-xl bg-white/5 pl-10 pr-10 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/60 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmation */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/75">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-base">🔒</span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={!token}
                  className="w-full rounded-xl bg-white/5 pl-10 pr-10 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/60 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Indicateur concordance */}
              {confirm && (
                <p className={`mt-1 text-xs ${password === confirm ? 'text-emerald-400' : 'text-red-400'}`}>
                  {password === confirm ? '✓ Les mots de passe correspondent' : '✗ Les mots de passe ne correspondent pas'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-500 disabled:opacity-60 transition shadow-lg shadow-purple-900/40"
            >
              {loading ? 'Mise à jour…' : 'Réinitialiser mon mot de passe →'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-white/40">
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition">
              ← Retour à la connexion
            </Link>
          </p>
        </>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#0a0a0f] text-white px-4">

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-28 h-96 w-96 rounded-full bg-purple-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        <div className="flex items-center gap-3 mb-8">
          <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/15 flex items-center justify-center">
            <span className="font-black text-sm tracking-widest">LS</span>
          </div>
          <span className="font-extrabold text-base">LSBookers</span>
        </div>

        <Suspense fallback={
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-7 text-center text-white/40 text-sm">
            Chargement…
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
