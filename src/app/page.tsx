'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
  const router = useRouter()

  const BG =
    process.env.NEXT_PUBLIC_LANDING_BG ||
    'https://res.cloudinary.com/dzpie6sij/image/upload/v1755121809/Landing_fz7zqx.png'

  return (
    <div className="relative w-full min-h-screen h-dvh overflow-hidden text-white">
      {/* Image de fond */}
      <Image
        src={BG}
        alt="Vue de nuit sur le pont de Brooklyn depuis un bureau — LSBookers"
        fill
        priority
        sizes="100vw"
        className="z-0 object-cover"
      />

      {/* Overlays + ambiance */}
      <div className="absolute inset-0 z-10 bg-black/45" />
      <div className="absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-56 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      {/* Glow décoratifs */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute -top-32 -left-28 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-[42rem] -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-[4rem] border border-white/5 bg-white/5 blur-2xl" />
      </div>

      {/* Contenu */}
      <div className="relative z-20 flex min-h-screen h-dvh flex-col">
        {/* Header léger */}
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
          <Link href="/" className="inline-flex items-center gap-3 group" aria-label="LSBookers">
            <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/15 group-hover:ring-white/25 transition flex items-center justify-center">
              <span className="font-black text-base tracking-widest">LS</span>
            </div>
            <div className="leading-tight">
              <p className="text-lg font-extrabold tracking-tight">Bookers</p>
              <p className="text-xs text-white/60">Plateforme de booking</p>
            </div>
          </Link>

          {/* Uniquement ces 2 CTA */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/login')}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              Se connecter
            </button>
            <button
              onClick={() => router.push('/register')}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition"
            >
              Créer un compte
            </button>
          </div>
        </header>

        {/* Hero */}
        <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-6 pb-10">
          <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Texte */}
            <div className="flex flex-col justify-center">
              <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75 backdrop-blur">
                ✦ Réseau & Booking événementiel
              </p>

              <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-6xl">
                LSBookers
                <span className="block text-white/80">La nouvelle scène de l’événementiel.</span>
              </h1>

              <p className="mt-5 max-w-xl text-base text-white/75 md:text-lg">
                LS Bookers, Réseau Social et Plateforme destinée à l&apos;événementiel et
                l&apos;organisation de vos évènements privés.
              </p>

              {/* CTA central */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => router.push('/register')}
                  className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-500 active:scale-[0.99] transition"
                >
                  Créer un compte
                </button>

                <button
                  onClick={() => router.push('/login')}
                  className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white/85 hover:bg-white/10 hover:text-white active:scale-[0.99] transition backdrop-blur"
                >
                  Se connecter
                </button>
              </div>
            </div>

            {/* Bloc features en mode "icônes d’app" */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
                {/* Liseré discret */}
                <span className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:linear-gradient(black,transparent_30%,transparent_70%,black)]">
                  <span className="absolute inset-0 -z-10 rounded-2xl ring-1 ring-white/10" />
                </span>

                <h2 className="text-2xl font-bold tracking-tight">Fonctionnalités</h2>
                <p className="mt-2 text-sm text-white/70">
                  Une expérience moderne pensée pour l’événementiel.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <FeatureIcon label="Planning" icon="📅" />
                  <FeatureIcon label="Messageries" icon="💬" />
                  <FeatureIcon label="Booking" icon="🎟️" />
                  <FeatureIcon label="Offres d’emplois" icon="🧩" />
                  <FeatureIcon label="Promotion" icon="🚀" />
                </div>

                <p className="mt-6 text-center text-xs text-white/55">
                  © {new Date().getFullYear()} LSBookers — Tous droits réservés.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer minimal */}
        <footer className="mx-auto w-full max-w-7xl px-6 pb-6">
          <div className="flex flex-col gap-2 border-t border-white/10 pt-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} LSBookers — Tous droits réservés.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/legal/terms" className="hover:text-white transition">
                Conditions
              </Link>
              <Link href="/legal/privacy" className="hover:text-white transition">
                Confidentialité
              </Link>
              <Link href="/legal/mentions" className="hover:text-white transition">
                Mentions légales
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

function FeatureIcon({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="group flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center backdrop-blur transition hover:bg-white/10">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 group-hover:ring-white/20 transition">
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-2 text-xs font-semibold text-white/80 leading-tight">{label}</p>
    </div>
  )
}