'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import LsIcon from '@/components/ui/LsIcon'
import { SETTINGS_NAV } from './nav'

/**
 * Cadre de la page Réglages (choix S1) : menu des rubriques à gauche sur ordinateur et tablette.
 * Sur téléphone, /settings affiche la liste des rubriques, et chaque rubrique s'ouvre en plein écran
 * avec un bouton retour.
 */
export default function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isIndex = pathname === '/settings'
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <div className="lsb-page text-white">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="Rubriques des réglages" className={`${isIndex ? 'block' : 'hidden'} md:block`}>
          <h1 className="mb-4 px-2 text-2xl font-semibold md:text-lg">Réglages</h1>
          <ul className="grid gap-1 md:sticky md:top-24">
            {SETTINGS_NAV.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition md:py-2.5 ${active(item.href) ? 'bg-accent/15 text-white' : 'text-white/60 hover:bg-white/[0.04] hover:text-white'}`}
                >
                  <LsIcon name={item.icon} size={18} tone={active(item.href) ? 'accent' : 'muted'} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.label}</span>
                    <span className="block truncate text-xs text-white/35 md:hidden">{item.hint}</span>
                  </span>
                  <ChevronRight size={16} className="text-white/25 md:hidden" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sur /settings, la page elle-même ne fait qu'ouvrir « Mon compte » sur ordinateur */}
        {isIndex ? children : (
          <div className="min-w-0">
            <Link href="/settings" className="mb-4 inline-flex items-center gap-1 text-sm text-white/55 transition hover:text-white md:hidden">
              <ChevronLeft size={16} /> Réglages
            </Link>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
