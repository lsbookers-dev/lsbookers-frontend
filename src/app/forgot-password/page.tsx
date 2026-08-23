'use client'

import { useState } from 'react'
import Link from 'next/link'
import axios from 'axios'

const API = (process.env.NEXT_PUBLIC_API_URL || 'https://lsbookers-backend-production.up.railway.app').replace(/\/$/, '')

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email })
      setSent(true)
    } catch {
      setError('Une erreur est survenue. Réessaie dans quelques instants.')
    } finally {
      setLoading(false)
    }
  }

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

        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-7 shadow-2xl">

          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-3xl">
                📬
              </div>
              <h2 className="text-xl font-black mb-2">Email envoyé !</h2>
              <p className="text-sm text-white/55 leading-relaxed">
                Si un compte est associé à{' '}
                <span className="text-white/80 font-medium">{email}</span>,
                tu recevras un lien de réinitialisation sous peu.
              </p>
              <p className="text-xs text-white/30 mt-3">Pense à vérifier tes spams.</p>
              <Link
                href="/login"
                className="mt-6 inline-block text-sm text-purple-400 hover:text-purple-300 transition"
              >
                ← Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-2xl font-black mb-1">Mot de passe oublié</h2>
                <p className="text-sm text-white/50">
                  Saisis ton email et on t&apos;envoie un lien pour réinitialiser ton mot de passe.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-500 disabled:opacity-60 transition shadow-lg shadow-purple-900/40"
                >
                  {loading ? 'Envoi en cours…' : 'Envoyer le lien →'}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-white/40">
                Tu te souviens ?{' '}
                <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition">
                  Se connecter
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
