'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="relative w-full h-screen overflow-hidden text-white">
      {/* ✅ Image optimisée avec léger éclaircissement */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://res.cloudinary.com/dzpie6sij/image/upload/v1755121809/Landing_fz7zqx.png"
          alt="Fond LSBookers"
          fill
          className="object-cover brightness-105"
          priority
        />
        {/* Overlay assombri léger */}
        <div className="absolute inset-0 bg-black bg-opacity-25"></div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-20 flex flex-col justify-between h-full">
        <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            Bienvenue sur LSBookers
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-xl drop-shadow-lg">
            La Plateforme qui Connecte Le Monde de L'évenementiel.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/register')}
              className="px-6 py-3 bg-white text-black font-semibold rounded hover:bg-gray-200 transition"
            >
              Créer un compte
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 border border-white text-white font-semibold rounded hover:bg-white hover:text-black transition"
            >
              Se connecter
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-4 bg-black bg-opacity-60">
          © {new Date().getFullYear()} LSBookers. Tous droits réservés.
        </footer>
      </div>
    </div>
  )
}