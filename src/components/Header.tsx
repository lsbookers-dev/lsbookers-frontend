'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import {
  Search,
  Bell,
  MessageCircle,
  ChevronDown,
} from 'lucide-react'

type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'

type Profile = {
  id?: number
  avatar?: string | null
  banner?: string | null
  location?: string | null
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
  // Contexte auth typé
  const { user, logout } = useAuth() as {
    user: AppUser | null
    logout: () => void
  }

  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  // Logo gérable via Cloudinary / admin
  const LOGO_URL =
    process.env.NEXT_PUBLIC_LOGO_URL ||
    'https://res.cloudinary.com/dzpie6sij/image/upload/v1755121809/Landing_fz7zqx.png'

  // Fallback avatar robuste
  const avatarSrc = useMemo(() => {
    return user?.profile?.avatar || user?.avatarUrl || '/default-avatar.png'
  }, [user])

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

  const isActive = (path: string) => pathname?.startsWith(path)

  return (
    <header className="sticky top-0 z-50">
      {/* Bandeau “glass” + dégradé */}
      <div className="w-full border-b border-white/10 bg-gradient-to-b from-neutral-950/90 to-neutral-900/60 backdrop-blur-xl supports-[backdrop-filter]:bg-neutral-950/70">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 md:px-6" style={{ height: '88px' }}>
          {/* Logo + nom */}
          <button
            onClick={() => goTo('/home')}
            className="group flex items-center gap-3"
            aria-label="Aller à l’accueil"
          >
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl ring-1 ring-white/10 group-hover:ring-white/20 transition">
              <Image
                src={LOGO_URL}
                alt="Logo LSBookers"
                fill
                sizes="48px"
                className="object-cover"
                priority
              />
            </div>
            <div className="hidden sm:flex flex-col leading-tight text-left">
              <span className="text-lg font-bold tracking-wide text-white/95 group-hover:text-white">
                LSBookers
              </span>
              <span className="text-[11px] uppercase tracking-widest text-white/50">
                Connect • Book • Perform
              </span>
            </div>
          </button>

          {/* Barre de recherche (desktop) */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
              <input
                onKeyDown={(e) => {
                  if (e.key === 'Enter') goTo('/search')
                }}
                placeholder="Rechercher un artiste, un organisateur, un style…"
                className="w-full rounded-full bg-white/5 pl-11 pr-4 py-3 text-sm text-white placeholder-white/50 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/20 transition"
              />
            </div>
          </div>

          {/* Nav principale */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
            <HeaderLink label="Recherche" href="/search" active={isActive('/search')} onClick={goTo} />
            <HeaderLink label="Messagerie" href="/messages" active={isActive('/messages')} onClick={goTo} />
            <HeaderLink label="Événements" href="/events" active={isActive('/events')} onClick={goTo} />
            <HeaderLink label="Abonnements" href="/subscriptions" active={isActive('/subscriptions')} onClick={goTo} />
          </nav>

          {/* Actions droites */}
          <div className="ml-auto flex items-center gap-4">
            {/* Messagerie quick */}
            <IconButton
              label="Messages"
              onClick={() => goTo('/messages')}
              icon={<MessageCircle className="h-[18px] w-[18px]" />}
            />

            {/* Notifications avec badge */}
            <div className="relative">
              <IconButton
                label="Notifications"
                onClick={() => alert('Notifications à venir')}
                icon={<Bell className="h-[18px] w-[18px]" />}
              />
              <span className="pointer-events-none absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-[10px] font-bold text-white ring-2 ring-neutral-900/80">
                3
              </span>
            </div>

            {/* User chip + avatar + menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="group flex items-center gap-3 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10 hover:ring-white/20 transition"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Ouvrir le menu utilisateur"
              >
                <div className="text-right hidden md:block leading-tight">
                  <div className="text-[13px] font-semibold text-white/90 group-hover:text-white">
                    {user?.name ?? 'Invité'}
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-white/50">
                    {user ? roleLabel(user.role) : 'non connecté'}
                  </div>
                </div>
                <div className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-white/10 group-hover:ring-white/20 transition">
                  <Image
                    src={avatarSrc}
                    alt="Photo de profil"
                    fill
                    sizes="44px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <ChevronDown className="hidden md:block h-4 w-4 text-white/60 group-hover:text-white/80 transition" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur shadow-2xl"
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="text-sm font-semibold text-white/90">{user?.name ?? 'Invité'}</div>
                    <div className="text-[11px] text-white/50">{user?.email ?? '—'}</div>
                  </div>
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
                      setMenuOpen(false)
                      goTo('/settings/profile')
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                  >
                    Paramètres
                  </button>
                  <div className="h-px bg-white/10 my-1" />
                  {user ? (
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
                  ) : (
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        goTo('/login')
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                    >
                      Se connecter
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nav secondaire mobile (sous le header) */}
      <div className="lg:hidden border-b border-white/10 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <button onClick={() => goTo('/search')} className={mobileLink(isActive('/search'))}>Recherche</button>
          <button onClick={() => goTo('/messages')} className={mobileLink(isActive('/messages'))}>Messagerie</button>
          <button onClick={() => goTo('/events')} className={mobileLink(isActive('/events'))}>Événements</button>
          <button onClick={() => goTo('/subscriptions')} className={mobileLink(isActive('/subscriptions'))}>Abonnements</button>
        </div>
      </div>
    </header>
  )
}

/* ======= sous-composants ======= */
function HeaderLink({
  label,
  href,
  active,
  onClick,
}: {
  label: string
  href: string
  active?: boolean
  onClick: (path: string) => void
}) {
  return (
    <button
      onClick={() => onClick(href)}
      className={`relative text-white/80 hover:text-white transition-colors ${
        active ? 'text-white' : ''
      }`}
    >
      {label}
      <span
        className={`absolute -bottom-2 left-0 h-[2px] w-full rounded bg-white/80 transition-transform ${
          active ? 'scale-100' : 'scale-0 group-hover:scale-100'
        }`}
      />
    </button>
  )
}

function IconButton({
  label,
  onClick,
  icon,
}: {
  label: string
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 hover:ring-white/20 hover:bg-white/10 transition"
      aria-label={label}
      title={label}
    >
      <span className="text-white/80">{icon}</span>
    </button>
  )
}

function roleLabel(role?: Role) {
  switch (role) {
    case 'ARTIST':
      return 'Artiste'
    case 'ORGANIZER':
      return 'Organisateur'
    case 'PROVIDER':
      return 'Prestataire'
    case 'ADMIN':
      return 'Admin'
    default:
      return 'Utilisateur'
  }
}

function mobileLink(active: boolean) {
  return `px-2 py-1 text-sm ${active ? 'text-white' : 'text-white/80 hover:text-white'}`
}