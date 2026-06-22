'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

const API = (process.env.NEXT_PUBLIC_API_URL || 'https://lsbookers-backend-production.up.railway.app').replace(/\/$/, '')

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Lien invalide.')
      return
    }

    axios
      .get(`${API}/api/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success')
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.error || 'Lien invalide ou déjà utilisé.')
      })
  }, [token])

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_#0b0b10_0%,_#050508_55%)] text-white flex items-center justify-center p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-28 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl text-center">

        {status === 'loading' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <svg className="h-8 w-8 animate-spin text-emerald-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Vérification en cours…</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/20 ring-2 ring-emerald-500/50">
              <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Email confirmé !</h2>
            <p className="mt-2 text-sm text-white/60">
              Ton adresse email a été vérifiée. Tu peux maintenant te connecter.
            </p>
            <button
              onClick={() => router.replace('/login')}
              className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-500"
            >
              Se connecter →
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 ring-2 ring-red-500/50">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Lien invalide</h2>
            <p className="mt-2 text-sm text-white/60">{message}</p>
            <Link
              href="/login"
              className="mt-6 inline-block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
