'use client'
import { useEffect, useMemo, useState } from 'react'
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

type Notification = {
  id: number
  type: string
  content: string
  read: boolean
  createdAt: string
  actor?: {
    id: number
    name: string
    avatar?: string | null
  } | null
  conversationId?: number | null
  offerId?: number | null
}

export default function Header() {
  const router = useRouter()
  const { user, logout } = useAuth() as { user: AuthUser | null; logout: () => void }
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
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

  // Fermer le menu au changement de route
  useEffect(() => {
    const onPop = () => setMenuOpen(false)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Charger les notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id || !API_BASE) return
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications)
        }
      } catch (err) {
        console.error('Erreur chargement notifications:', err)
      }
    }
    fetchNotifications()
  }, [API_BASE, user?.id])

  // Charger le nombre de conversations non lues
  useEffect(() => {
    const fetchUnread = async () => {
      if (!user?.id || !API_BASE) return
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/api/conversations/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setUnreadMessages(data.count || 0)
        }
      } catch (err) {
        console.error('Erreur chargement unread messages:', err)
      }
    }
    fetchUnread()
  }, [API_BASE, user?.id])

  // Filtrer : la cloche n'affiche pas les notifs "NEW_MESSAGE"
  const bellNotifications = notifications.filter((n) => n.type !== 'NEW_MESSAGE')

  return (
    <header className="sticky top-0 z-50 w-full bg-neutral-950/80 backdrop-blur-md border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-16 md:h-18 flex items-center justify-between gap-4">
          {/* Left : Logo */}
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

          {/* Center : NAV */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <button onClick={() => goTo('/search')} className="text-white/80 hover:text-white transition">
              Recherche
            </button>
            <button onClick={() => goTo('/offers')} className="text-white/80 hover:text-white transition">
              Offres
            </button>
            <button
              onClick={() => goTo('/subscriptions')}
              className="text-white/80 hover:text-white transition"
            >
              Abonnements
            </button>
          </nav>

          {/* Right : quick actions */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Messagerie */}
            <button
              onClick={() => goTo('/messages')}
              className="relative rounded-full p-2 hover:bg-white/10 transition"
              title="Messagerie"
            >
              <Mail className="h-5 w-5 text-white/90" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 rounded-full bg-pink-600 text-[10px] font-semibold text-white grid place-items-center shadow">
                  {unreadMessages}
                </span>
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative rounded-full p-2 hover:bg-white/10 transition"
                title="Notifications"
              >
                <Bell className="h-5 w-5 text-white/90" />
                {bellNotifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 rounded-full bg-pink-600 text-[10px] font-semibold text-white grid place-items-center shadow">
                    {bellNotifications.filter((n) => !n.read).length}
                  </span>
                )}
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur shadow-xl z-50 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                    <h2 className="text-sm font-semibold text-white">Notifications</h2>
                  </div>
                  <div className="p-2">
                    {bellNotifications.length === 0 ? (
                      <p className="text-sm text-neutral-400 p-2">Aucune notification.</p>
                    ) : (
                      bellNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-2 rounded-lg mb-2 cursor-pointer hover:bg-white/5 ${
                            notif.read ? 'opacity-60' : 'opacity-100'
                          }`}
                          onClick={() => {
                            if (notif.type === 'NEW_FOLLOWER' && notif.actor) {
                              goTo(`/profile/${notif.actor.id}`)
                            } else if (
                              (notif.type === 'LIKE_PUBLICATION' || notif.type === 'COMMENT_PUBLICATION') &&
                              notif.offerId
                            ) {
                              goTo(`/publications/${notif.offerId}`)
                            } else if (notif.type === 'NEW_OFFER' && notif.offerId) {
                              goTo(`/offers/${notif.offerId}`)
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {notif.actor?.avatar && (
                              <Image
                                src={notif.actor.avatar}
                                alt={notif.actor.name}
                                width={28}
                                height={28}
                                className="rounded-full object-cover"
                              />
                            )}
                            <div>
                              <p className="text-sm">
                                {notif.actor?.name || 'Un utilisateur'} {notif.content}
                              </p>
                              <p className="text-xs text-neutral-400">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar + menu */}
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