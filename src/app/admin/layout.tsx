'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { BarChart3, Users, CreditCard, Settings, LayoutDashboard } from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/subscriptions', label: 'Abonnements', icon: CreditCard },
  { href: '/admin/stats', label: 'Statistiques', icon: BarChart3 },
  { href: '/admin/settings', label: 'Paramètres', icon: Settings },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!user) {
      router.replace('/login')
    } else if (user.role !== 'ADMIN') {
      router.replace('/home')
    }
  }, [user, router])

  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="min-h-screen bg-black text-white grid md:grid-cols-[240px,1fr]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col border-r border-white/10 bg-neutral-950/60">
        <div className="p-5 border-b border-white/10">
          <h1 className="text-lg font-bold tracking-wide">LSBookers — Admin</h1>
          <p className="text-xs text-white/50 mt-1">Bienvenue, {user?.name || 'admin'}</p>
        </div>
        <nav className="p-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition
                  ${active ? 'bg-white/10 border-white/20' : 'border-transparent hover:bg-white/5 hover:border-white/10'}`}
              >
                <Icon size={16} />
                <span className="text-sm">{label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="p-6">{children}</main>
    </div>
  )
}