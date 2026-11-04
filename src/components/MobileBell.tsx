'use client'

/**
 * Cloche ronde en haut à droite, sur téléphone seulement (choix M3 d'Antho, 04/11/2026).
 * Avant, il fallait passer par « Plus ». Pas sur les pages qui ont leur propre en-tête en haut
 * (Notifications elle-même, Messages et son bouton « nouvelle conversation »).
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LsIcon from '@/components/ui/LsIcon'
import { useUnreadCounts } from '@/hooks/useUnreadCounts'

export default function MobileBell() {
  const pathname = usePathname()
  const { notifications } = useUnreadCounts()

  if (pathname === '/notifications' || pathname.startsWith('/messages')) return null

  return (
    <Link
      href="/notifications"
      aria-label={notifications > 0 ? `Notifications, ${notifications} nouvelle${notifications > 1 ? 's' : ''}` : 'Notifications'}
      className="fixed right-3 z-40 grid h-10 w-10 place-items-center rounded-full border border-line bg-surface/90 text-white/85 shadow-lg shadow-black/40 backdrop-blur-md transition active:scale-95 md:hidden"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
    >
      <LsIcon name="bell" tone="inherit" size={19} />
      {notifications > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background">
          {notifications > 99 ? '99+' : notifications}
        </span>
      )}
    </Link>
  )
}
