'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays, Compass, Home, LayoutDashboard, Mail,
  Settings, Sparkles, TicketCheck,
} from 'lucide-react'

const primary = [
  { href: '/home', label: 'Accueil', icon: Home },
  { href: '/discover', label: 'Découvrir', icon: Compass, match: ['/discover', '/search'] },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/offers', label: 'Opportunités', icon: TicketCheck },
  { href: '/messages', label: 'Messages', icon: Mail },
]

const secondary = [
  { href: '/space', label: 'Mon espace', icon: LayoutDashboard },
  { href: '/studio-profile', label: 'Studio profil', icon: Sparkles },
  { href: '/settings/profile', label: 'Réglages', icon: Settings },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const active = (href: string, matches?: string[]) =>
    (matches || [href]).some(path => pathname === path || pathname.startsWith(`${path}/`))

  const group = (items: typeof primary) => items.map(({ href, label, icon: Icon, match }) => (
    <Link key={href} href={href} className={`lsb-side-link ${active(href, match) ? 'is-active' : ''}`}>
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </Link>
  ))

  return (
    <aside className="lsb-sidebar" aria-label="Navigation principale">
      <nav>{group(primary)}</nav>
      <nav>{group(secondary)}</nav>
    </aside>
  )
}
