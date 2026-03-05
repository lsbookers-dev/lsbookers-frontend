'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_#0b0b10_0%,_#050508_55%)] text-white">
      {/* Glow décoratifs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-28 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-[42rem] -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-[4rem] border border-white/5 bg-white/5 blur-2xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">
        {/* Panneau branding */}
        <aside className="hidden lg:flex flex-col justify-between border-r border-white/10">
          <div className="p-10">
            <Link href="/" className="inline-flex items-center gap-3 group" aria-label="Retour à l’accueil">
              <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/15 group-hover:ring-white/25 transition flex items-center justify-center">
                <span className="font-black text-lg tracking-widest">LS</span>
              </div>
              <div className="leading-tight">
                <p className="text-xl font-extrabold tracking-tight">Bookers</p>
                <p className="text-xs text-white/60">Plateforme de booking</p>
              </div>
            </Link>

            <div className="mt-12 space-y-5">
              <h1 className="text-4xl font-extrabold tracking-tight">Mot de passe oublié</h1>
              <p className="max-w-md text-white/70">
                Saisis ton email. Nous t’enverrons un lien de réinitialisation.
              </p>
            </div>
          </div>

          <div className="p-10">
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} LSBookers — Tous droits réservés.
            </p>
          </div>
        </aside>

        {/* Carte */}
        <main className="flex items-center justify-center p-6 lg:p-12">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <span className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:linear-gradient(black,transparent_30%,transparent_70%,black)]">
              <span className="absolute inset-0 -z-10 rounded-2xl ring-1 ring-white/10" />
            </span>

            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Réinitialiser</h2>
              <Link
                href="/login"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                Retour
              </Link>
            </div>

            <p className="text-sm text-white/70">
              Fonctionnalité en cours d’intégration. (MVP visuel)
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm text-white/80">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nom@domaine.com"
                    className="w-full rounded-xl bg-white/5 px-4 py-2.5 pr-10 text-white placeholder-white/40 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-emerald-500/60"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                    @
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-500"
                onClick={() => {}}
              >
                Envoyer le lien
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}