'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  Bell, Home, LogOut, Mail, Search,
  Settings, UserRound, Briefcase, ChevronDown,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'

type AuthUser = {
  id: number | string
  name?: string
  email?: string
  role: Role
  avatar?: string | null
  avatarUrl?: string | null
  profile?: { id?: number | string } | null
}

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */


function profilePath(role: Role): string {
  if (role === 'ARTIST')    return '/profile/artist'
  if (role === 'ORGANIZER') return '/profile/organizer'
  if (role === 'PROVIDER')  return '/profile/provider'
  return '/admin/dashboard'
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT PRINCIPAL
───────────────────────────────────────────────────────── */
export default function Header() {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth() as { user: AuthUser | null; logout: () => void }

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
  const LOGO_FALLBACK = '/logo-black.png'
  const [logoSrc, setLogoSrc] = useState(LOGO_FALLBACK)

  useEffect(() => {
    if (!API_BASE) return
    const cached = sessionStorage.getItem('site_logo')
    if (cached) { setLogoSrc(cached); return }
    fetch(`${API_BASE}/api/admin/settings`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const url = d?.headerLogoUrl || LOGO_FALLBACK
        sessionStorage.setItem('site_logo', url)
        setLogoSrc(url)
      })
      .catch(() => {})
  }, [API_BASE])

  const [menuOpen, setMenuOpen]           = useState(false)
  const [unreadMsg, setUnreadMsg]         = useState(0)
  const [unreadNotif, setUnreadNotif]     = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // Lire aussi directement le localStorage pour les utilisateurs déjà connectés
  // (le fix de normalizeUser s'applique seulement après une reconnexion)
  const [localAvatar, setLocalAvatar] = useState<string | null>(null)
  const [localName, setLocalName]     = useState<string | null>(null)
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('user') || 'null')
      if (raw) {
        setLocalAvatar(raw.avatarUrl || raw.avatar || raw.profile?.avatar || null)
        setLocalName(raw.pseudo || raw.name || raw.firstName || null)
      }
    } catch { /* silencieux */ }
  }, [user])

  const avatarSrc = user?.avatarUrl || user?.avatar || localAvatar || null
  const displayName = user?.name || localName || 'Mon compte'

  /* ── Fermer le menu au clic extérieur ──────────────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ── Fermer le menu au changement de page ──────────── */
  useEffect(() => { setMenuOpen(false) }, [pathname])

  /* ── Compteurs non lus ─────────────────────────────── */
  const fetchCounts = useCallback(async () => {
    if (!user?.id || !API_BASE) return
    const token = localStorage.getItem('token')
    if (!token) return
    const headers = { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-store' }

    try {
      const [msgRes, notifRes] = await Promise.all([
        fetch(`${API_BASE}/api/messages/unread-count?t=${Date.now()}`, { headers }),
        fetch(`${API_BASE}/api/notifications/unread-count?t=${Date.now()}`, { headers }),
      ])
      if (msgRes.ok)   setUnreadMsg(Number((await msgRes.json()).count ?? 0))
      if (notifRes.ok) setUnreadNotif(Number((await notifRes.json()).count ?? 0))
    } catch { /* silencieux */ }
  }, [API_BASE, user?.id])

  useEffect(() => {
    fetchCounts()
    const id = setInterval(fetchCounts, 5000)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchCounts() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', fetchCounts)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', fetchCounts)
    }
  }, [fetchCounts])

  /* ── Liens de navigation desktop ───────────────────── */
  const navLinks = [
    { label: 'Accueil',      href: '/home',          active: pathname === '/home' },
    { label: 'Recherche',    href: '/search',         active: pathname.startsWith('/search') },
    { label: 'Offres',       href: '/offers',         active: pathname.startsWith('/offers') },
    { label: 'Abonnements',  href: '/subscriptions',  active: pathname.startsWith('/subscriptions') },
  ]

  /* ── Liens nav mobile (bas d'écran) ────────────────── */
  const bottomNav = [
    { label: 'Accueil',   href: '/home',      icon: Home,      active: pathname === '/home',             badge: 0 },
    { label: 'Recherche', href: '/search',    icon: Search,    active: pathname.startsWith('/search'),   badge: 0 },
    { label: 'Offres',    href: '/offers',    icon: Briefcase, active: pathname.startsWith('/offers'),   badge: 0 },
    { label: 'Messages',  href: '/messages',  icon: Mail,      active: pathname.startsWith('/messages'), badge: unreadMsg },
    { label: 'Notifs',    href: '/notifications', icon: Bell,  active: pathname.startsWith('/notifications'), badge: unreadNotif },
  ]

  return (
    <>
      {/* ══════════════════════════════════════════════════
          HEADER DESKTOP / MOBILE TOP BAR
      ══════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 w-full bg-neutral-950/85 backdrop-blur-md border-b border-white/8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">

            {/* ── Logo ───────────────────────────────────── */}
            <Link href="/home" className="flex items-center flex-shrink-0 group">
              <div className="relative h-12 w-12 group-hover:opacity-80 transition">
                <Image src={logoSrc} alt="LSBookers" fill sizes="48px" className="object-contain" priority unoptimized />
              </div>
            </Link>

            {/* ── Nav desktop ────────────────────────────── */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    link.active
                      ? 'bg-white/8 text-white'
                      : 'text-white/55 hover:text-white hover:bg-white/5'
                  }`}>
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* ── Actions droite ─────────────────────────── */}
            <div className="flex items-center gap-1 md:gap-2">

              {/* Messages — masqué sur mobile (dans bottom nav) */}
              <Link href="/messages"
                className="hidden md:flex relative rounded-full p-2.5 hover:bg-white/8 transition"
                title="Messagerie">
                <Mail className="h-5 w-5 text-white/80" />
                {unreadMsg > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] px-1 rounded-full bg-pink-600 text-[9px] font-bold text-white grid place-items-center">
                    {unreadMsg > 99 ? '99+' : unreadMsg}
                  </span>
                )}
              </Link>

              {/* Notifications — masqué sur mobile */}
              <Link href="/notifications"
                className="hidden md:flex relative rounded-full p-2.5 hover:bg-white/8 transition"
                title="Notifications">
                <Bell className="h-5 w-5 text-white/80" />
                {unreadNotif > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] px-1 rounded-full bg-purple-600 text-[9px] font-bold text-white grid place-items-center">
                    {unreadNotif > 99 ? '99+' : unreadNotif}
                  </span>
                )}
              </Link>

              {/* ── Menu compte ──────────────────────────── */}
              {user && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(v => !v)}
                    className="flex items-center gap-2 rounded-full border border-white/12 bg-white/5 pl-1 pr-2.5 py-1 hover:bg-white/10 transition"
                  >
                    {/* Avatar */}
                    <span className="relative h-8 w-8 rounded-full overflow-hidden ring-1 ring-white/20 bg-zinc-800 flex-shrink-0">
                      {avatarSrc ? (
                        <Image src={avatarSrc} alt={displayName} fill sizes="32px" className="object-cover" unoptimized />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-white/50 text-sm font-bold">
                          {displayName[0]?.toUpperCase()}
                        </span>
                      )}
                    </span>
                    {/* Nom — affiché uniquement sur desktop */}
                    <span className="hidden md:block text-sm font-medium text-white max-w-[120px] truncate">
                      {displayName}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-white/50 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* ── Dropdown ─────────────────────────── */}
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/10 bg-neutral-900/98 backdrop-blur shadow-2xl overflow-hidden z-50">

                      {/* Mini profil en tête */}
                      <div className="px-4 py-3 border-b border-white/8 flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden ring-1 ring-white/15 bg-zinc-800 flex-shrink-0">
                          {avatarSrc ? (
                            <Image src={avatarSrc} alt={displayName} fill sizes="40px" className="object-cover" unoptimized />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-white/50 font-bold">
                              {displayName[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="py-1">
                        <button
                          onClick={() => router.push(profilePath(user.role))}
                          className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                        >
                          <UserRound className="h-4 w-4 text-white/50" /> Mon profil
                        </button>
                        <button
                          onClick={() => router.push('/settings/profile')}
                          className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                        >
                          <Settings className="h-4 w-4 text-white/50" /> Paramètres
                        </button>
                      </div>

                      <div className="border-t border-white/8 py-1">
                        <button
                          onClick={() => { setMenuOpen(false); logout() }}
                          className="w-full px-4 py-2.5 text-left text-sm text-rose-400 hover:bg-rose-500/8 flex items-center gap-3 transition-colors"
                        >
                          <LogOut className="h-4 w-4" /> Se déconnecter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          BARRE DE NAVIGATION MOBILE (bas d'écran)
      ══════════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/95 backdrop-blur-md border-t border-white/8 safe-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomNav.map(item => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                  item.active ? 'text-white' : 'text-white/35 hover:text-white/60'
                }`}>
                <div className="relative">
                  <Icon className={`h-5 w-5 transition-transform ${item.active ? 'scale-110' : ''}`} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[1rem] px-0.5 rounded-full bg-pink-600 text-[9px] font-bold text-white grid place-items-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.active && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
