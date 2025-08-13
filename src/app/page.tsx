'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="relative w-full min-h-screen overflow-hidden text-white">
      {/* Image de fond Cloudinary */}
      <Image
        src="https://res.cloudinary.com/dzpie6sij/image/upload/v1755121809/Landing_fz7zqx.png"
        alt="Fond LSBookers avec vue sur le pont de Brooklyn"
        fill
        sizes="100vw"
        className="z-0 object-cover"
        priority
      />

      {/* Overlay plus léger pour garder les détails de l'image */}
      <div className="absolute inset-0 z-10 bg-black/30 md:bg-black/25 lg:bg-black/20" />

      {/* Contenu principal */}
      <div className="relative z-20 flex min-h-screen flex-col justify-between">
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <h1 className="mb-6 text-4xl font-bold md:text-6xl drop-shadow-lg">
            Bienvenue sur LSBookers
          </h1>
          <p className="mb-8 max-w-xl text-lg md:text-xl drop-shadow">
            La plateforme qui connecte le monde de l'évenementiel en un clic.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/register')}
              className="rounded bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200"
            >
              Créer un compte
            </button>
            <button
              onClick={() => router.push('/login')}
              className="rounded border border-white px-6 py-3 font-semibold text-white transition hover:bg-white hover:text-black"
            >
              Se connecter
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-black/60 py-4 text-center">
          © {new Date().getFullYear()} LSBookers. Tous droits réservés.
        </footer>
      </div>
    </div>
  )
}