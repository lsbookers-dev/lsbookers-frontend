'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Rôles autorisés
type UserRole = 'ARTIST' | 'ORGANIZER' | 'PROVIDER'

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('ARTIST')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
      if (!API) throw new Error('NEXT_PUBLIC_API_URL manquant')

      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, role }),
      })

      if (!res.ok) {
        let msg = "Échec de l'inscription. Réessaie."
        if (res.status === 409) msg = 'Un compte existe déjà avec cet email.'
        else if (res.status === 400) msg = 'Données invalides (email ou mot de passe).'
        else if (res.status === 404) msg = 'Endpoint introuvable (vérifie NEXT_PUBLIC_API_URL).'

        try {
          const data = await res.json()
          if (data?.message) msg = data.message
          if (data?.error) msg = data.error
        } catch {}

        throw new Error(msg)
      }

      router.push('/login')
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec de l'inscription. Réessaie."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_rgba(24,24,28,1)_0%,_rgba(5,5,8,1)_55%)] text-white">
      {/* décor léger */}
      <div className="pointer-events-none fixed inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6">
        <div className="mx-auto grid w-full gap-10 lg:grid-cols-2">
          {/* Panneau brand */}
          <aside className="hidden lg:flex flex-col justify-between">
            <div className="space-y-6">
              <a href="/" className="inline-flex items-center gap-3 group">
                <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/15 group-hover:ring-white/25 transition flex items-center justify-center">
                  <span className="font-black tracking-wider">LS</span>
                </div>
                <div className="leading-tight">
                  <p className="text-xl font-extrabold">Bookers</p>
                  <p className="text-xs text-white/60">Plateforme de booking</p>
                </div>
              </a>

              <h1 className="text-4xl font-extrabold tracking-tight">
                Crée ton compte et rejoins la scène.
              </h1>
              <p className="max-w-md text-white/70">
                Choisis ton rôle, publie, réserve et entre en contact avec la communauté. Interface
                moderne, rapide, pensée pour l’événementiel.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
                  Messagerie
                </span>
                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
                  Planning
                </span>
                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
                  Géoloc
                </span>
              </div>
            </div>

            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} LSBookers — Tous droits réservés.
            </p>
          </aside>

          {/* Carte formulaire */}
          <main className="flex items-center justify-center">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl"
            >
              <h2 className="text-2xl font-bold">Créer un compte</h2>
              <p className="mt-1 text-sm text-white/70">
                Tu as déjà un compte ?{' '}
                <a href="/login" className="underline underline-offset-4 hover:text-white">
                  Se connecter
                </a>
              </p>

              {error && (
                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-white/80">Nom / Pseudo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-emerald-500/60"
                    placeholder="Ex. DJ Nova"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/80">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-emerald-500/60"
                    placeholder="nom@domaine.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/80">Mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-emerald-500/60"
                    placeholder="Au moins 8 caractères"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/80">Type de compte</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full appearance-none rounded-xl bg-white/5 px-4 py-2.5 pr-8 text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-emerald-500/60"
                  >
                    <option value="ARTIST" className="bg-neutral-900">
                      Artistes
                    </option>
                    <option value="ORGANIZER" className="bg-neutral-900">
                      Organisateurs/Etablissements
                    </option>
                    <option value="PROVIDER" className="bg-neutral-900">
                      Prestataires
                    </option>
                  </select>
                </div>

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
                    {loading ? 'Création…' : "S'inscrire"}
                  </span>
                </button>

                <p className="text-center text-sm text-white/70">
                  En t’inscrivant, tu acceptes nos{' '}
                  <a href="#" className="underline underline-offset-4 hover:text-white">
                    CGU
                  </a>
                  .
                </p>

                <p className="mt-1 text-center text-sm text-white/70">
                  Déjà un compte ?{' '}
                  <a href="/login" className="underline underline-offset-4 hover:text-white">
                    Se connecter
                  </a>
                </p>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  )
}