'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [bgUrl, setBgUrl] = useState<string>('')

  const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
  const ENV_FALLBACK =
    process.env.NEXT_PUBLIC_FORGOT_BG ||
    'https://res.cloudinary.com/demo/image/upload/v1710000000/lsbookers_forgot_bg.jpg'

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
    <div className="relative w-full min-h-screen h-dvh text-white overflow-hidden">
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
      <div className="absolute inset-0 z-10 bg-black/40" />
      <div className="absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Formulaire */}
      <div className="relative z-20 flex items-center justify-center min-h-screen h-dvh px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 shadow-2xl"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Mot de passe oublié</h2>

          {message ? (
            <p className="text-sm text-green-400 text-center mb-4">
              {message}
            </p>
          ) : (
            <>
              {error && (
                <p className="text-sm text-red-400 text-center mb-4">
                  {error}
                </p>
              )}

              <label className="block mb-2">Adresse e-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2 mb-4 text-white placeholder-white/60 rounded-lg bg-black/40 border border-white/15 focus:border-white/40 outline-none"
                placeholder="ton@email.com"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-semibold py-2.5 rounded-lg hover:bg-neutral-200 disabled:opacity-60 transition-all"
              >
                {loading ? 'Envoi...' : 'Réinitialiser le mot de passe'}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => (window.location.href = '/login')}
            className="mt-6 w-full text-center text-white/85 hover:text-white underline underline-offset-4"
          >
            Retour à la connexion
          </button>
        </form>
      </div>
    </div>
  )
}