'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [bgUrl, setBgUrl] = useState<string>('')

  const API =
    (process.env.NEXT_PUBLIC_API_URL || 'https://lsbookers-backend-production.up.railway.app')
      .replace(/\/$/, '')

  const ENV_FALLBACK =
    process.env.NEXT_PUBLIC_FORGOT_BG ||
    'https://images.unsplash.com/photo-1522202222030-20f3247c9e0c?q=80&w=1600&auto=format'

  useEffect(() => {
    setBgUrl(ENV_FALLBACK)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage('Si un compte existe, un email sera envoyé.')
      } else {
        setError(data.message || 'Erreur lors de la requête.')
      }
    } catch (err) {
      console.error(err)
      setError('Erreur réseau, réessaie plus tard.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full min-h-screen text-white overflow-hidden">
      {/* Fond */}
      <Image
        src={bgUrl}
        alt="Fond réinitialisation — LSBookers"
        fill
        priority
        sizes="100vw"
        className="object-cover z-0"
      />

      {/* Overlays */}
      <div className="absolute inset-0 z-10 bg-black/40 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      {/* Formulaire */}
      <div className="relative z-20 flex items-center justify-center min-h-screen px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-2xl"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Mot de passe oublié</h2>

          {message ? (
            <p className="text-sm text-emerald-400 text-center mb-4">{message}</p>
          ) : (
            <>
              {error && (
                <p className="text-sm text-red-400 text-center mb-4">{error}</p>
              )}

              <label className="block mb-2 text-sm text-white/80">
                Adresse e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2 mb-4 text-white placeholder-white/60 rounded-lg bg-black/40 border border-white/15 focus:border-emerald-500/60 outline-none"
                placeholder="ton@email.com"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold py-2.5 rounded-lg disabled:opacity-60 transition-all"
              >
                {loading ? 'Envoi...' : 'Réinitialiser le mot de passe'}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="mt-6 w-full text-center text-white/80 hover:text-white underline underline-offset-4"
          >
            Retour à la connexion
          </button>
        </form>
      </div>
    </div>
  )
}