'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays, Compass, Home, LayoutDashboard, Mail,
  Settings, Sparkles, TicketCheck,
} from 'lucide-react'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'

const primary = [
  { href: '/home', label: 'Accueil', icon: Home },
  { href: '/discover', label: 'Découvrir', icon: Compass, match: ['/discover', '/search'] },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/offers', label: 'Opportunités', icon: TicketCheck },
  { href: '/messages', label: 'Messages', icon: Mail },
]

const secondary = [
  { href: '/space', label: 'Mon espace', icon: LayoutDashboard },
  { href: '/studio-profile', label: 'Studio profil', icon: Sparkles, match: ['/studio-profile', '/profile/artist', '/profile/organizer', '/profile/provider'] },
  { href: '/settings', label: 'Réglages', icon: Settings },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const unreadMessages = useUnreadMessages()
  const active = (href: string, matches?: string[]) =>
    (matches || [href]).some(path => pathname === path || pathname.startsWith(`${path}/`))

  // Pastille des messages non lus (l'enveloppe de l'en-tête a été retirée, choix B6)
  const badgeFor = (href: string) => (href === '/messages' ? unreadMessages : 0)

  const group = (items: typeof primary) => items.map(({ href, label, icon: Icon, match }) => {
    const badge = badgeFor(href)
    return (
      <Link key={href} href={href} className={`lsb-side-link ${active(href, match) ? 'is-active' : ''}`}>
        <span className="lsb-side-icon">
          <Icon aria-hidden="true" />
          {badge > 0 && <span className="lsb-side-badge" aria-label={`${badge} message${badge > 1 ? 's' : ''} non lu${badge > 1 ? 's' : ''}`}>{badge > 99 ? '99+' : badge}</span>}
        </span>
        <span>{label}</span>
      </Link>
    )
  })

  return (
    <aside className="lsb-sidebar" aria-label="Navigation principale">
      <nav>{group(primary)}</nav>
      <div className="flex flex-col gap-3">
        <nav>{group(secondary)}</nav>
        <div className="lsb-sidebar-legal">
          <Link href="/contact">Contact</Link>
          <Link href="/legal/mentions-legales">Mentions légales</Link>
          <Link href="/legal/confidentialite">Confidentialité</Link>
          <span>© {new Date().getFullYear()} LSBookers</span>
        </div>
      </div>
    </aside>
  )
}
