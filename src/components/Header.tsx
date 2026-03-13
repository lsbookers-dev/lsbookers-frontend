'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import {
  Bell,
  ChevronDown,
  LogOut,
  Mail,
  Settings,
  UserRound,
} from 'lucide-react'

type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'

type AuthUser = {
  id: number | string
  name?: string
  role: Role
  avatar?: string | null
  profile?: { id?: number | string } | null
}

export default function Header() {
  const router = useRouter()
  const { user, logout } = useAuth() as {
    user: AuthUser | null
    logout: () => void
  }

  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

  const LOGO =
    process.env.NEXT_PUBLIC_LOGO_URL ||
    'https://res.cloudinary.com/dzpie6sij/image/upload/v1755121809/Landing_fz7zqx.png'

  const avatarUrl = useMemo(() => {
    return (
      user?.avatar ||
      (typeof window !== 'undefined' ? localStorage.getItem('avatar') : null) ||
      '/default-avatar.png'
    )
  }, [user?.avatar])

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

  useEffect(() => {
    const onPop = () => setMenuOpen(false)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id || !API_BASE) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch(`${API_BASE}/api/messages/unread-count?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      })

      if (!res.ok) return

      const data = await res.json()
      setUnreadCount(Number(data?.count || 0))
    } catch (err) {
      console.error('Erreur chargement unread count:', err)
    }
  }, [API_BASE, user?.id])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 5000)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount()
      }
    }

    const onFocus = () => {
      fetchUnreadCount()
    }

    const onPageShow = () => {
      fetchUnreadCount()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)
    window.addEventListener('pageshow', onPageShow)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [fetchUnreadCount])

  return (
    <header className="sticky top-0 z-50 w-full bg-neutral-950/80 backdrop-blur-md border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-16 md:h-18 flex items-center justify-between gap-4">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => goTo('/home')}
            title="Retour à l'accueil"
          >
            <div className="relative h-10 w-10 md:h-12 md:w-12 rounded-2xl overflow-hidden ring-1 ring-white/15 group-hover:ring-white/30 transition">
              <Image
                src={LOGO}
                alt="LSBookers"
                fill
                sizes="48px"
                className="object-cover"
                priority
              />
            </div>

            <div className="leading-tight">
              <div className="text-white font-semibold text-lg md:text-xl">LSBookers</div>
              <div className="text-[10px] md:text-xs text-white/60 tracking-wide">
                CONNECT • BOOK • ENJOY
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <button
              onClick={() => goTo('/search')}
              className="text-white/80 hover:text-white transition"
            >
              Recherche
            </button>

            <button
              onClick={() => goTo('/offers')}
              className="text-white/80 hover:text-white transition"
            >
              Offres
            </button>

            <button
              onClick={() => goTo('/subscriptions')}
              className="text-white/80 hover:text-white transition"
            >
              Abonnements
            </button>
          </nav>

          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => goTo('/messages')}
              className="relative rounded-full p-2 hover:bg-white/10 transition"
              title="Messagerie"
            >
              <Mail className="h-5 w-5 text-white/90" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 rounded-full bg-pink-600 text-[10px] font-semibold text-white grid place-items-center shadow">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => goTo('/notifications')}
              className="rounded-full p-2 hover:bg-white/10 transition"
              title="Autres notifications"
            >
              <Bell className="h-5 w-5 text-white/90" />
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 pl-1 pr-2 py-1 hover:bg-white/10 transition"
                title="Compte"
              >
                <span className="relative h-9 w-9 rounded-full overflow-hidden ring-1 ring-white/20 shadow">
                  <Image
                    src={avatarUrl}
                    alt={user?.name || 'Profil'}
                    fill
                    sizes="36px"
                    className="object-cover"
                    unoptimized
                  />
                </span>

                <div className="hidden sm:flex flex-col items-start leading-tight mr-1">
                  <span className="text-xs text-white/70">
                    {user?.role === 'ARTIST'
                      ? 'ARTISTE'
                      : user?.role === 'ORGANIZER'
                      ? 'ORGANISATEUR'
                      : user?.role === 'PROVIDER'
                      ? 'PRESTATAIRE'
                      : user?.role === 'ADMIN'
                      ? 'ADMIN'
                      : 'COMPTE'}
                  </span>

                  <span className="text-sm font-medium text-white">
                    {user?.name || 'Mon compte'}
                  </span>
                </div>

                <ChevronDown className="h-4 w-4 text-white/70" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur shadow-xl overflow-hidden z-50">
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      goToProfile()
                    }}
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-white/5 flex items-center gap-2"
                  >
                    <UserRound className="h-4 w-4 text-white/80" />
                    Voir le profil
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      goTo('/settings/profile')
                    }}
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-white/5 flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4 text-white/80" />
                    Paramètres
                  </button>

                  <div className="my-1 h-px bg-white/10" />

                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      logout()
                    }}
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-white/5 flex items-center gap-2 text-rose-400"
                  >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}