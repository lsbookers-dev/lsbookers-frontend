'use client';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="relative w-full h-screen overflow-hidden text-white">
      {/* Image de fond */}
      <img
        src="/landing-background.jpg"
        alt="Fond LSBookers"
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />


      {/* Contenu principal */}
      <div className="relative z-20 flex flex-col justify-between h-full">
        <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Bienvenue sur LSBookers</h1>
          <p className="text-lg md:text-xl mb-8 max-w-xl">
            La Plateforme qui Connecte Artistes et Organisateurs en un Clic.
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
        <footer className="text-center py-4 bg-black bg-opacity-70">
          © {new Date().getFullYear()} LSBookers. Tous droits réservés.
        </footer>
      </div>
    </div>
  );
}