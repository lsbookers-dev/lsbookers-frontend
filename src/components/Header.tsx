'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import Image from 'next/image'

type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'

type Profile = {
  id?: number
  avatar?: string | null
  banner?: string | null
}

type AppUser = {
  id: number | string
  role: Role
  name?: string
  email?: string
  avatarUrl?: string | null
  profile?: Profile | null
}

export default function Header() {
  // On aide TypeScript si le contexte n'est pas typé
  const { user, logout } = useAuth() as {
    user: AppUser | null
    logout: () => void
  }

  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  const goTo = (path: string) => router.push(path)

  const goToProfile = () => {
    if (!user) return
    switch (user.role) {
      case 'ARTIST':
        goTo('/profile/artist')
        break
      case 'ORGANIZER':
        goTo('/profile/organizer')
        break
      case 'PROVIDER':
        goTo('/profile/provider')
        break
      case 'ADMIN':
        goTo('/admin/dashboard')
        break
      default:
        goTo('/profile')
    }
  }

  // Logo pris depuis Cloudinary (modifiable via .env ou admin)
  const LOGO_URL =
    process.env.NEXT_PUBLIC_LOGO_URL ||
    'https://res.cloudinary.com/dzpie6sij/image/upload/v1755121809/Landing_fz7zqx.png'

  // Source avatar robuste (profile.avatar > avatarUrl > fallback)
  const avatarSrc =
    user?.profile?.avatar ||
    user?.avatarUrl ||
    '/default-avatar.png'

  return (
    <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/70 text-white border-b border-white/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo cliquable */}
        <button
          onClick={() => goTo('/home')}
          className="group flex items-center gap-2"
          aria-label="Aller à l’accueil"
        >
          <div className="relative h-8 w-8 overflow-hidden rounded-lg ring-1 ring-white/10 group-hover:ring-white/20 transition">
            <Image
              src={LOGO_URL}
              alt="Logo LSBookers"
              fill
              sizes="32px"
              className="object-cover"
              priority
            />
          </div>
          <span className="hidden sm:inline text-sm font-semibold tracking-wide text-white/90 group-hover:text-white">
            LSBookers
          </span>
        </button>

        {/* Nav */}
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <button onClick={() => goTo('/search')} className="text-white/80 hover:text-white transition-colors">Recherche</button>
          <button onClick={() => goTo('/messages')} className="text-white/80 hover:text-white transition-colors">Messagerie</button>
          <button onClick={() => goTo('/events')} className="text-white/80 hover:text-white transition-colors">Événements</button>
          <button onClick={() => goTo('/subscriptions')} className="text-white/80 hover:text-white transition-colors">Abonnements</button>
        </nav>

        {/* Actions droites */}
        <div className="flex items-center gap-5">
          {/* Notifications */}
          <button
            onClick={() => alert('Notifications à venir')}
            className="relative text-white/80 hover:text-white transition"
            aria-label="Notifications"
            title="Notifications"
          >
            <span aria-hidden>🔔</span>
            <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-[10px] font-bold text-white ring-2 ring-neutral-950/80">
              3
            </span>
          </button>

          {/* Avatar + menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="ring-2 ring-white/10 hover:ring-white/20 transition rounded-full"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Ouvrir le menu utilisateur"
            >
              <Image
                src={avatarSrc}
                alt="Photo de profil"
                width={36}
                height={36}
                className="rounded-full"
                unoptimized
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur shadow-lg"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    goToProfile()
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                >
                  Voir le profil
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    logout()
                    setMenuOpen(false)
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10"
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav mobile */}
      <div className="md:hidden border-t border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-2 text-sm">
          <button onClick={() => goTo('/search')} className="text-white/80 hover:text-white">Recherche</button>
          <button onClick={() => goTo('/messages')} className="text-white/80 hover:text-white">Messagerie</button>
          <button onClick={() => goTo('/events')} className="text-white/80 hover:text-white">Événements</button>
          <button onClick={() => goTo('/subscriptions')} className="text-white/80 hover:text-white">Abonnements</button>
        </div>
      </div>
    </header>
  )
}