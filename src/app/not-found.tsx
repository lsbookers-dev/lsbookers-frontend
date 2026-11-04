'use client'

// Page affichée pour toute adresse qui n'existe pas (connecté ou non)
import Link from 'next/link'
import PublicBrand from '@/components/PublicBrand'
import { useAuth } from '@/context/AuthContext'

export default function NotFound() {
  const { user } = useAuth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-16 text-center">
      <PublicBrand logoUrl="/logo-white.png" showTagline={false} />
      <div className="max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[.16em] text-accent-light">Erreur 404</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Page introuvable</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Cette page n&apos;existe pas ou n&apos;existe plus. Vérifiez l&apos;adresse, ou revenez à l&apos;accueil.
        </p>
      </div>
      <Link
        href={user ? '/home' : '/'}
        className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  )
}
