'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Rôles autorisés
type UserRole = 'ARTIST' | 'ORGANIZER' | 'PROVIDER'

export default function RegisterPage() {
  const router = useRouter()

  // === Etat inchangé ===
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('ARTIST')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // === Logique inchangée ===
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

      // Succès -> redirection
      router.push('/login')
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec de l'inscription. Réessaie."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_#0b0b10_0%,_#050508_55%)] text-white">
      {/* Glow décoratifs (no NYC asset needed) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-28 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-[42rem] -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-[4rem] border border-white/5 bg-white/5 blur-2xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">
        {/* Panneau branding (garde la cohérence LSBookers) */}
        <aside className="hidden lg:flex flex-col justify-between border-r border-white/10/">
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
                Rejoins la scène, en un clic.
              </h1>
              <p className="max-w-md text-white/70">
                Crée ton compte, choisis ton rôle et commence à publier, réserver et
                collaborer. Un environnement professionnel, moderne et pensé pour l’événementiel.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
                  Messagerie
                </span>
                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
                  Planning
                </span>
                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
                  Géolocalisation
                </span>
              </div>
            </div>
          </div>

          <div className="p-10">
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} LSBookers — Tous droits réservés.
            </p>
          </div>
        </aside>

        {/* Carte formulaire (glass + micro-interactions) */}
        <main className="flex items-center justify-center p-6 lg:p-12">
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
          >
            {/* Liseré animé discret */}
            <span className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:linear-gradient(black,transparent_30%,transparent_70%,black)]">
              <span className="absolute inset-0 -z-10 rounded-2xl ring-1 ring-white/10" />
            </span>

            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Créer un compte</h2>
              <Link
                href="/"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                Retour
              </Link>
            </div>
            <p className="text-sm text-white/65">
              Tu as déjà un compte ?{' '}
              <Link href="/login" className="underline underline-offset-4 hover:text-white">
                Se connecter
              </Link>
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="mt-6 space-y-4">
              {/* Nom */}
              <div>
                <label className="mb-2 block text-sm text-white/80">Nom / Pseudo</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Ex. DJ Nova"
                    className="w-full rounded-xl bg-white/5 px-4 py-2.5 pr-10 text-white placeholder-white/40 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-emerald-500/60"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                    ✦
                  </span>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm text-white/80">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
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
                <label className="mb-2 block text-sm text-white/80">Mot de passe</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Au moins 8 caractères"
                    className="w-full rounded-xl bg-white/5 px-4 py-2.5 pr-10 text-white placeholder-white/40 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-emerald-500/60"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                    •••
                  </span>
                </div>
              </div>

              {/* Type de compte */}
              <div>
                <label className="mb-2 block text-sm text-white/80">Type de compte</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full appearance-none rounded-xl bg-white/5 px-4 py-2.5 pr-10 text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-emerald-500/60"
                  >
                    <option value="ARTIST" className="bg-neutral-900">
                      Artistes
                    </option>
                    <option value="ORGANIZER" className="bg-neutral-900">
                      Organisateurs / Établissements
                    </option>
                    <option value="PROVIDER" className="bg-neutral-900">
                      Prestataires
                    </option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                    ▾
                  </span>
                </div>
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
                  {loading ? 'Création…' : "S'inscrire"}
                </span>
              </button>

              {/* Liens légers */}
              <p className="text-center text-xs text-white/60">
                En t’inscrivant, tu acceptes nos{' '}
                <Link href="#" className="underline underline-offset-4 hover:text-white">
                  conditions d’utilisation
                </Link>
                .
              </p>

              <p className="text-center text-sm text-white/70">
                Déjà un compte ?{' '}
                <Link href="/login" className="underline underline-offset-4 hover:text-white">
                  Se connecter
                </Link>
              </p>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}