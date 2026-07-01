// src/components/AdminHeader.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

function getAuthHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return t ? { Authorization: `Bearer ${t}` } : {}
}

const NavLink = ({ href, label, badge }: { href: string; label: string; badge?: number }) => {
  const pathname = usePathname()
  const active = pathname === href
  return (
    <Link
      href={href}
      className={`relative block px-4 py-2 rounded border ${
        active ? 'border-white/30 bg-white/10' : 'border-white/10 hover:bg-white/10'
      }`}
    >
      {label}
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
    const interval = setInterval(fetchUnread, 60_000) // rafraîchit toutes les minutes

    // Mise à jour immédiate quand un message est lu depuis la page messages
    const onRead = () => setUnread(u => Math.max(0, u - 1))
    window.addEventListener('contact-read', onRead)

    return () => {
      clearInterval(interval)
      window.removeEventListener('contact-read', onRead)
    }
  }, [])

  return (
    <header className="border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold mb-3">LSBookers — Admin</h1>
          <nav className="flex gap-2 text-sm flex-wrap">
            <NavLink href="/admin/dashboard" label="Dashboard" />
            <NavLink href="/admin/users" label="Utilisateurs" />
            <NavLink href="/admin/messages" label="Messages" badge={unread} />
            <NavLink href="/admin/subscriptions" label="Abonnements" />
            <NavLink href="/admin/stats" label="Statistiques" />
            <NavLink href="/admin/settings" label="Paramètres" />
          </nav>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded border border-white/10 hover:bg-red-600/20 hover:border-red-600/40 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </header>
  )
}
