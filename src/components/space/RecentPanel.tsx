'use client'

/** « Activité récente » : les dernières notifications. */

import Link from 'next/link'
import LsIcon from '@/components/ui/LsIcon'
import { notificationType } from '@/lib/notificationTypes'
import { agendaEventLink, reviewOrBookingItemLink } from '@/utils/notificationLinks'
import { publicProfileHref } from '@/components/profile/utils'
import { EmptyLine, PanelLink, SpacePanel, relativeTime } from './ui'

export type SpaceNotification = {
  id: number
  type: string
  content: string
  read: boolean
  createdAt: string
  actor?: { id: number; name?: string | null; role?: string | null } | null
  conversationId?: number | null
  offerId?: number | null
  eventId?: number | null
}

function linkOf(n: SpaceNotification) {
  const special = reviewOrBookingItemLink(n.type, n.eventId)
  if (special) return special
  if (n.conversationId) return `/messages?c=${n.conversationId}`
  if (n.offerId || n.type === 'NEW_OFFER' || n.type === 'NEW_APPLICATION') return '/offers'
  if (n.eventId || n.type.startsWith('STAFF_')) return agendaEventLink(n.eventId)
  if (n.actor?.id) return publicProfileHref(n.actor.role, n.actor.id) || '/notifications'
  return '/notifications'
}

export default function RecentPanel({ notifications }: { notifications: SpaceNotification[] }) {
  const items = notifications.filter(n => n.type !== 'NEW_DEVICE_LOGIN').slice(0, 5)
  return (
    <SpacePanel kicker="Activité récente" title="Ce qui se passe autour de vous" action={<PanelLink href="/notifications">Tout voir</PanelLink>}>
      {items.length === 0 ? (
        <EmptyLine>Votre activité récente apparaîtra ici.</EmptyLine>
      ) : (
        <div className="grid min-w-0">
          {items.map(n => {
            const type = notificationType(n.type)
            return (
              <Link key={n.id} href={linkOf(n)} className="relative flex min-w-0 items-center gap-2.5 border-t border-line py-2.5 text-xs first:border-t-0 hover:bg-white/[0.02]">
                {!n.read && <span className="absolute -left-2 h-4 w-[3px] rounded-full bg-accent" aria-label="Non lu" />}
                <LsIcon name={type.icon} tone={type.tone} size={16} />
                <span className="min-w-0 flex-1 truncate text-white/85">{n.content || type.label}</span>
                <time className="shrink-0 text-[11px] text-white/35">{relativeTime(n.createdAt)}</time>
              </Link>
            )
          })}
        </div>
      )}
    </SpacePanel>
  )
}
