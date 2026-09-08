// src/components/AdminHeader.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, Users, Mail, FileImage,
  CreditCard, BarChart2, Settings, LogOut, ShieldCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAuthToken } from '@/utils/auth'

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

function getAuthHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? getAuthToken() : null
  return t ? { Authorization: `Bearer ${t}` } : {}
}

const NAV_ITEMS = [
  { href: '/admin/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/admin/users',         label: 'Utilisateurs',  icon: Users },
  { href: '/admin/messages',      label: 'Messages',      icon: Mail },
  { href: '/admin/publications',  label: 'Publications',  icon: FileImage },
  { href: '/admin/subscriptions', label: 'Abonnements',   icon: CreditCard },
  { href: '/admin/stats',         label: 'Statistiques',  icon: BarChart2 },
  { href: '/admin/settings',      label: 'Paramètres',    icon: Settings },
]

function NavLink({ href, label, icon: Icon, badge }: {
  href: string; label: string; icon: typeof LayoutDashboard; badge?: number
}) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
          : 'text-white/50 hover:text-white hover:bg-white/6 border border-transparent'
      }`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="hidden xl:block">{label}</span>
      {badge != null && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}

export default function AdminHeader() {
  const { logout } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API}/api/contact/admin/unread-count`, {
          headers: getAuthHeaders(),
          cache: 'no-store',
        })
        if (res.ok) {
          const d = await res.json()
          setUnread(d.count ?? 0)
        }
      } catch { /* ignore */ }
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 60_000)
    const onRead = () => setUnread(u => Math.max(0, u - 1))
    window.addEventListener('contact-read', onRead)
    return () => {
      clearInterval(interval)
      window.removeEventListener('contact-read', onRead)
    }
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-neutral-950/90 backdrop-blur-md border-b border-white/8">
      <div className="px-4 sm:px-6">
        <div className="h-16 flex items-center gap-4">

          {/* ── Branding ── */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30">
              <ShieldCheck className="h-4 w-4 text-violet-400" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-white leading-none">LSBookers</p>
              <p className="text-[10px] text-violet-400 font-semibold tracking-widest uppercase leading-none mt-0.5">Admin</p>
            </div>
          </div>

          {/* ── Séparateur ── */}
          <div className="h-6 w-px bg-white/10 flex-shrink-0" />

          {/* ── Navigation ── */}
          <nav className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                badge={item.href === '/admin/messages' ? unread : undefined}
              />
            ))}
          </nav>

          {/* ── Déconnexion ── */}
          <button
            onClick={logout}
            title="Se déconnecter"
            className="flex items-center gap-2 flex-shrink-0 text-sm px-3 py-2 rounded-xl border border-white/10 text-white/50 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:block">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  )
}
