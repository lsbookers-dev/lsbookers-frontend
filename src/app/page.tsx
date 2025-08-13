'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

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

      {/* Overlays plus clairs */}
      <div className="absolute inset-0 z-10 bg-black/10" /> {/* avant : /20 */}
      <div className="absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" /> {/* avant : /50 */}
      <div className="absolute inset-x-0 bottom-0 z-10 h-56 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" /> {/* avant : /60 */}

      {/* Contenu principal */}
      <div className="relative z-20 flex flex-col justify-between min-h-screen h-dvh">
        <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
          <div className="max-w-3xl w-full">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              Bienvenue sur LSBookers
            </h1>
            <p className="text-lg md:text-xl mb-8 mx-auto max-w-2xl text-white/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              La Plateforme qui Connecte Le Monde de L'évenementiel en un Clic.
            </p>

            {/* CTA */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => router.push('/register')}
                className="px-6 py-3 rounded font-semibold bg-white text-black hover:bg-neutral-200 active:scale-[0.99] transition shadow-lg"
              >
                Créer un compte
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-3 rounded font-semibold border border-white/80 text-white hover:bg-white hover:text-black active:scale-[0.99] transition backdrop-blur-sm shadow-lg"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-4 bg-black/60 backdrop-blur-sm">
          © {new Date().getFullYear()} LSBookers. Tous droits réservés.
        </footer>
      </div>
    </div>
  )
}