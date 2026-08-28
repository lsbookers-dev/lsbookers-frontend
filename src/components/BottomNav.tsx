'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Search, MessageCircle, Bell, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getAuthToken } from '@/utils/auth'

type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'

type AuthUser = {
  id: number | string
  role: Role
  avatar?: string | null
  avatarUrl?: string | null
}

function profilePath(role: Role): string {
  if (role === 'ARTIST')    return '/profile/artist'
  if (role === 'ORGANIZER') return '/profile/organizer'
  if (role === 'PROVIDER')  return '/profile/provider'
  return '/admin/dashboard'
}

export default function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth() as { user: AuthUser | null }

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
          fetch(`${API}/api/messages/unread-count`,       { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/notifications/unread-count`,  { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (msgRes.ok)   { const d = await msgRes.json();   setUnreadMsg(d.count   || 0) }
        if (notifRes.ok) { const d = await notifRes.json(); setUnreadNotif(d.count || 0) }
      } catch { /* silencieux */ }
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 30_000)
    return () => clearInterval(interval)
  }, [user?.id, API])

  if (!user) return null

  const profileHref = profilePath(user.role)

  const items = [
    { href: '/home',          icon: Home,          label: 'Accueil',       badge: 0 },
    { href: '/search',        icon: Search,        label: 'Recherche',     badge: 0 },
    { href: '/messages',      icon: MessageCircle, label: 'Messages',      badge: unreadMsg },
    { href: '/notifications', icon: Bell,          label: 'Notifs',        badge: unreadNotif },
    { href: profileHref,      icon: User,          label: 'Profil',        badge: 0 },
  ]

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden"
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
        </div>
      </div>
    </nav>
  )
}
