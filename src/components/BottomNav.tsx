'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Home, Compass, CalendarDays, MessageCircle, LayoutDashboard, Menu, Bell,
  TicketCheck, Sparkles, Crown, Settings, LogOut, X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getAuthToken, apiFetch } from '@/utils/auth'
import { getSocket } from '@/lib/socket'

type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'

type AuthUser = {
  id: number | string
  role: Role
  avatar?: string | null
  avatarUrl?: string | null
}

export default function BottomNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth() as { user: AuthUser | null; logout: () => void }
  const [moreOpen, setMoreOpen] = useState(false)

  const [unreadMsg, setUnreadMsg]     = useState(0)
  const [unreadNotif, setUnreadNotif] = useState(0)

  const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

  useEffect(() => {
    if (!user?.id) return
    const fetchCounts = async () => {
      const token = getAuthToken()
      if (!token) return
      try {
        const [msgRes, notifRes] = await Promise.all([
          apiFetch(`${API}/api/messages/unread-count`,       { }),
          apiFetch(`${API}/api/notifications/unread-count`,  { }),
        ])
        if (msgRes.ok)   { const d = await msgRes.json();   setUnreadMsg(d.count   || 0) }
        if (notifRes.ok) { const d = await notifRes.json(); setUnreadNotif(d.count || 0) }
      } catch { /* silencieux */ }
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 30_000)
    // Mise à jour immédiate : message lu dans cet onglet, ou événement temps réel du serveur
    window.addEventListener('lsb:unread-changed', fetchCounts)
    const token = getAuthToken()
    const socket = token ? getSocket(token) : null
    socket?.on('new_message', fetchCounts)
    socket?.on('conversation_updated', fetchCounts)
    socket?.on('unread_changed', fetchCounts)
    return () => {
      clearInterval(interval)
      window.removeEventListener('lsb:unread-changed', fetchCounts)
      socket?.off('new_message', fetchCounts)
      socket?.off('conversation_updated', fetchCounts)
      socket?.off('unread_changed', fetchCounts)
    }
  }, [user?.id, API])

  // Le panneau « Plus » se referme à chaque changement de page
  useEffect(() => { setMoreOpen(false) }, [pathname])

  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moreOpen])

  if (!user) return null

  const moreItems = [
    { href: '/space',            icon: LayoutDashboard, label: 'Mon espace',    badge: 0 },
    { href: '/notifications',    icon: Bell,            label: 'Notifications', badge: unreadNotif },
    { href: '/offers',           icon: TicketCheck,     label: 'Opportunités',  badge: 0 },
    { href: '/studio-profile',   icon: Sparkles,        label: 'Studio profil', badge: 0 },
    { href: '/subscriptions',    icon: Crown,           label: 'Abonnements',   badge: 0 },
    { href: '/settings/profile', icon: Settings,        label: 'Réglages',      badge: 0 },
  ]
  const morePaths = [...moreItems.map(i => i.href), '/profile', '/settings', '/contact']
  const moreActive = morePaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  const items = [
    { href: '/home',          icon: Home,          label: 'Accueil',       badge: 0 },
    { href: '/discover',      icon: Compass,       label: 'Découvrir',     badge: 0 },
    { href: '/agenda',        icon: CalendarDays,  label: 'Agenda',        badge: 0 },
    { href: '/messages',      icon: MessageCircle, label: 'Messages',      badge: unreadMsg },
  ]

  return (
    <>
    {moreOpen && (
      <div className="fixed inset-0 z-[49] md:hidden" role="dialog" aria-modal="true" aria-label="Plus de pages">
        <button
          type="button"
          aria-label="Fermer"
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMoreOpen(false)}
        />
        <div
          className="absolute inset-x-0 rounded-t-3xl border-t border-white/10 bg-neutral-900 px-4 pt-3 pb-4"
          style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Plus</span>
            <button type="button" onClick={() => setMoreOpen(false)} aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white/60">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {moreItems.map(({ href, icon: Icon, label, badge }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className={`relative flex flex-col items-center justify-center gap-1.5 rounded-2xl px-1 py-3.5 text-[11px] font-medium transition ${
                    isActive ? 'bg-purple-500/20 text-white' : 'bg-white/[0.05] text-white/75'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-purple-300' : 'text-purple-300/80'}`} strokeWidth={1.75} />
                  {label}
                  {badge > 0 && (
                    <span className="absolute top-2 right-3 min-w-[16px] h-4 px-1 bg-purple-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => { setMoreOpen(false); logout() }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-medium text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-white/35">
            <Link href="/contact" onClick={() => setMoreOpen(false)}>Contact</Link>
            <Link href="/legal/mentions-legales" onClick={() => setMoreOpen(false)}>Mentions légales</Link>
            <Link href="/legal/confidentialite" onClick={() => setMoreOpen(false)}>Confidentialité</Link>
          </div>
        </div>
      </div>
    )}
    <nav
      className="lsb-bottom-nav fixed bottom-0 inset-x-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Fond glassmorphisme avec bordure top subtile */}
      <div className="border-t border-white/10 bg-neutral-950/90 backdrop-blur-2xl">
        <div className="flex h-16 items-stretch">
          {items.map(({ href, icon: Icon, label, badge }) => {
            // Active si pathname exact ou sous-page
            const isActive =
              pathname === href ||
              (href !== '/home' && pathname.startsWith(href + '/'))

            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-200 ${
                  isActive
                    ? 'text-purple-400'
                    : 'text-white/35 hover:text-white/60'
                }`}
              >
                {/* Indicateur actif (barre en haut) */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-400 rounded-full" />
                )}

                {/* Icône + badge */}
                <div className="relative">
                  <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                    <Icon
                      className="w-[22px] h-[22px]"
                      strokeWidth={isActive ? 2.5 : 1.75}
                    />
                  </div>
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 bg-purple-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none shadow-lg">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span className={`text-[9px] font-medium leading-none tracking-wide ${isActive ? 'text-purple-400' : ''}`}>
                  {label}
                </span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(o => !o)}
            aria-expanded={moreOpen}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-200 ${
              moreOpen || moreActive ? 'text-purple-400' : 'text-white/35 hover:text-white/60'
            }`}
          >
            {(moreOpen || moreActive) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-400 rounded-full" />
            )}
            <div className="relative">
              {moreOpen
                ? <X className="w-[22px] h-[22px]" strokeWidth={2.5} />
                : <Menu className="w-[22px] h-[22px]" strokeWidth={moreActive ? 2.5 : 1.75} />}
              {unreadNotif > 0 && !moreOpen && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 bg-purple-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none shadow-lg">
                  {unreadNotif > 99 ? '99+' : unreadNotif}
                </span>
              )}
            </div>
            <span className="text-[9px] font-medium leading-none tracking-wide">Plus</span>
          </button>
        </div>
      </div>
    </nav>
    </>
  )
}
