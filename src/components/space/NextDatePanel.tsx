'use client'

/** « Prochaine date » : l'événement le plus proche, avec sa checklist si l'utilisateur en a ajouté une. */

import Link from 'next/link'
import EventChecklist from '@/components/agenda/EventChecklist'
import { agendaEventLink } from '@/utils/notificationLinks'
import { EmptyLine, PanelLink, SpacePanel, longDate, timeOf } from './ui'

export type NextEvent = { id: number; title: string; start: string; end?: string | null; lieu?: string | null }

function countdown(start: string) {
  const days = Math.round((new Date(start).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000)
  if (days <= 0) return 'Aujourd’hui'
  if (days === 1) return 'Demain'
  return `Dans ${days} jours`
}

export default function NextDatePanel({ event }: { event: NextEvent | null }) {
  return (
    <SpacePanel
      kicker="Prochaine date"
      title={event ? <span className="capitalize">{longDate(event.start)}</span> : 'Votre agenda est libre'}
      action={<PanelLink href={event ? agendaEventLink(event.id) : '/agenda'}>Ouvrir l’agenda</PanelLink>}
    >
      {event ? (
        <>
          <Link href={agendaEventLink(event.id)} className="grid gap-1 rounded-[14px] border border-line bg-[radial-gradient(circle_at_90%_0%,rgba(139,92,246,.35),transparent_60%),radial-gradient(circle_at_0%_100%,rgba(212,175,106,.18),transparent_60%)] bg-surface-2 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-light">{countdown(event.start)}</span>
            <h3 className="text-xl font-semibold tracking-tight text-white">{event.title}</h3>
            <p className="text-xs text-muted">
              {timeOf(event.start)}{event.end ? ` – ${timeOf(event.end)}` : ''}{event.lieu ? ` · ${event.lieu}` : ''}
            </p>
          </Link>
          <EventChecklist eventId={event.id} compact />
        </>
      ) : (
        <EmptyLine>Ajoutez vos événements et disponibilités dans l’agenda pour les voir ici.</EmptyLine>
      )}
    </SpacePanel>
  )
}
