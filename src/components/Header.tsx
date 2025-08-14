'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useState, useMemo } from 'react'
import Image from 'next/image'
import {
  Bell,
  Menu,
  X,
  Search,
  MessageCircleMore,
  CalendarCheck2,
  Sparkles,
} from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Logo depuis Cloudinary (configurable)
  // Mets cette variable depuis l'admin => NEXT_PUBLIC_LOGO_URL
  const LOGO_URL =
    process.env.NEXT_PUBLIC_LOGO_URL ||
    // Fallback Cloudinary (remplace par ton vrai public_id si tu veux)
    'https://res.cloudinary.com/dzpie6sij/image/upload/v1/lsbookers/logo.png'

  // Fallback avatar (Cloudinary générique ou ton image par défaut)
  const AVATAR_URL =
    (user as any)?.avatar ||
    (user as any)?.avatarUrl ||
    (user as any)?.profile?.avatar ||
    'https://res.cloudinary.com/dzpie6sij/image/upload/v1/lsbookers/default-avatar.png'

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

  // Menu principal (desktop & mobile)
  const navItems = useMemo(
    () => [
      { label: 'Recherche', href: '/search', icon: <Search size={16} /> },
      { label: 'Messagerie', href: '/messages', icon: <MessageCircleMore size={16} /> },
      { label: 'Événements', href: '/events', icon: <CalendarCheck2 size={16} /> },
      { label: 'Abonnements', href: '/subscriptions', icon: <Sparkles size={16} /> },
    ],
    []
  )

  return (
    <header className="sticky top-0 z-50">
      {/* Barre translucide style “glass” */}
      <div className="backdrop-blur-md bg-black/35 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo + titre (clic -> home) */}
            <button
              onClick={() => goTo('/home')}
              className="group flex items-center gap-3"
              aria-label="Aller à l’accueil"
            >
              <div className="relative h-9 w-9 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-sm bg-white/5 group-hover:ring-white/25 transition">
                {/* Le logo vient de Cloudinary */}
                <Image
                  src={LOGO_URL}
                  alt="Logo LSBookers"
                  fill
                  className="object-cover"
                  sizes="36px"
                  priority
                />
              </div>
              <span className="hidden sm:block text-lg font-semibold tracking-wide">
                LSBookers
              </span>
            </button>

            {/* Nav Desktop */}
            <nav className="hidden md:flex items-center gap-6 text-sm">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => goTo(item.href)}
                  className="group inline-flex items-center gap-2 px-2 py-1 rounded-md text-white/90 hover:text-white transition"
                >
                  <span className="opacity-80 group-hover:opacity-100">{item.icon}</span>
                  <span className="relative">
                    {item.label}
                    <span className="absolute left-0 -bottom-0.5 h-[2px] w-0 bg-white/80 transition-all group-hover:w-full" />
                  </span>
                </button>
              ))}
            </nav>

            {/* Actions à droite */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button
                className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-white/10 transition"
                onClick={() => alert('Notifications à venir')}
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Avatar + menu utilisateur */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-white/20 hover:ring-white/40 transition"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Menu utilisateur"
                >
                  <Image
                    src={AVATAR_URL}
                    alt="Profil"
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        goToProfile()
                      }}
                      className="block w-full text-left px-4 py-2.5 text-sm hover:bg-white/10"
                      role="menuitem"
                    >
                      Voir le profil
                    </button>
                    <button
                      onClick={() => {
                        logout()
                        setMenuOpen(false)
                      }}
                      className="block w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-white/10"
                      role="menuitem"
                    >
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>

              {/* Burger (mobile) */}
              <button
                className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10 transition"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Ouvrir le menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="md:hidden border-b border-white/10 bg-neutral-950/95 backdrop-blur-md">
          <div className="px-4 py-3 grid gap-1">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  setMobileOpen(false)
                  goTo(item.href)
                }}
                className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/10 text-sm"
              >
                <span className="opacity-80">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
            <div className="h-px my-1 bg-white/10" />
            <button
              onClick={() => {
                setMobileOpen(false)
                goToProfile()
              }}
              className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/10 text-sm"
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
              <span>Mon profil</span>
            </button>
            <button
              onClick={() => {
                logout()
                setMobileOpen(false)
              }}
              className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/10 text-sm text-rose-400"
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}