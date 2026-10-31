'use client'

// Menu de l'admin (choix A1 d'Antho, 31/10/2026) : sur le côté, noms écrits en clair,
// pastilles or pour ce qui attend une action. Sur téléphone, il se replie dans un bouton.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Home, Users, Receipt, Star, Mail, SlidersHorizontal, History, LogOut, ShieldCheck, Menu, X,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { API, Badge } from './ui'

type Badges = { members: number; sales: number; messages: number }

const NAV: { href: string; label: string; icon: LucideIcon; badge?: keyof Badges; also?: string[] }[] = [
  { href: '/admin/dashboard', label: 'Accueil', icon: Home },
  { href: '/admin/users', label: 'Membres', icon: Users, badge: 'members' },
  { href: '/admin/ventes', label: 'Ventes', icon: Receipt, badge: 'sales' },
  { href: '/admin/vitrine', label: 'Vitrine', icon: Star },
  { href: '/admin/messages', label: 'Messages', icon: Mail, badge: 'messages' },
  { href: '/admin/settings', label: 'Réglages', icon: SlidersHorizontal },
  { href: '/admin/historique', label: 'Historique', icon: History },
]

/** Événement envoyé par une page quand elle traite un élément (la pastille se met à jour) */
export const ADMIN_BADGES_EVENT = 'lsb:admin-badges'

export default function AdminSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [badges, setBadges] = useState<Badges>({ members: 0, sales: 0, messages: 0 })

  useEffect(() => {
    const load = () => {
      apiFetch(`${API}/api/admin/badges`, { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then(d => { if (d) setBadges(d) })
        .catch(() => {})
    }
    load()
    const timer = setInterval(load, 60_000)
    window.addEventListener(ADMIN_BADGES_EVENT, load)
    return () => { clearInterval(timer); window.removeEventListener(ADMIN_BADGES_EVENT, load) }
  }, [])

  // Le menu du téléphone se referme quand on change de page
  useEffect(() => { setOpen(false) }, [pathname])

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map(({ href, label, icon: Icon, badge }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        const count = badge ? badges[badge] : 0
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              active ? 'bg-accent/15 text-white' : 'text-muted hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <Icon className={`h-[18px] w-[18px] ${active ? 'text-accent-light' : ''}`} />
            <span className="flex-1">{label}</span>
            {count > 0 && <Badge value={count} />}
          </Link>
        )
      })}
    </nav>
  )

  const brand = (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent/15">
        <ShieldCheck className="h-4 w-4 text-accent-light" />
      </span>
      <span>
        <span className="block text-sm font-bold leading-none text-white">LS Bookers</span>
        <span className="mt-1 block text-[10px] font-semibold uppercase leading-none tracking-widest text-accent-light">Admin</span>
      </span>
    </div>
  )

  const logoutButton = (
    <div className="border-t border-line p-3">
      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-red-500/10 hover:text-red-300"
      >
        <LogOut className="h-[18px] w-[18px]" /> Déconnexion
      </button>
    </div>
  )

  const total = badges.members + badges.sales + badges.messages

  return (
    <>
      {/* Ordinateur : menu fixe à gauche */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-[#0e0c14] lg:flex">
        {brand}
        {nav}
        {logoutButton}
      </aside>

      {/* Téléphone et tablette : barre du haut + menu qui s'ouvre */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-[#0e0c14]/95 px-4 backdrop-blur lg:hidden">
        <span className="flex items-center gap-2 text-sm font-bold text-white">
          <ShieldCheck className="h-4 w-4 text-accent-light" /> Admin
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="relative rounded-lg border border-line p-2 text-white/80"
        >
          <Menu className="h-5 w-5" />
          {total > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gold" />}
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Fermer le menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/60" />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-line bg-[#0e0c14]">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer le menu" className="rounded-lg p-2 text-muted hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {logoutButton}
          </aside>
        </div>
      )}
    </>
  )
}
