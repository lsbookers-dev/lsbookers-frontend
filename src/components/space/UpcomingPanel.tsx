'use client'

/** « Bookings en cours » : les prochaines dates acceptées ou en attente. */

import Link from 'next/link'
import { agendaEventLink } from '@/utils/notificationLinks'
import { DateBadge, EmptyLine, PanelLink, SpacePanel, euro, timeOf, type Person } from './ui'

export type UpcomingBooking = {
  id: number
  eventId: number | null
  date: string
  status: 'PENDING' | 'ACCEPTED'
  fee: number | null
  title: string | null
  place: string | null
  counterpart: Person | null
}

export default function UpcomingPanel({ bookings, organizer }: { bookings: UpcomingBooking[]; organizer: boolean }) {
  return (
    <SpacePanel kicker="Agenda" title="Bookings en cours" action={<PanelLink href="/agenda">Tout voir</PanelLink>}>
      {bookings.length === 0 ? (
        <EmptyLine>{organizer ? 'Aucun booking à venir. Trouvez des artistes dans Découvrir ou publiez une offre.' : 'Aucun booking à venir pour le moment.'}</EmptyLine>
      ) : (
        <div className="grid min-w-0">
          {bookings.map(b => (
            <Link key={b.id} href={b.eventId ? agendaEventLink(b.eventId, 'bookings') : '/agenda'} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-line py-2.5 first:border-t-0 hover:bg-white/[0.02]">
              <DateBadge date={b.date} />
              <div className="min-w-0">
                <h3 className="truncate text-[13px] font-semibold text-white">{b.counterpart?.name || 'Booking'}</h3>
                <p className="truncate text-xs text-muted">
                  {new Date(b.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })} · {timeOf(b.date)}
                  {b.title ? ` · ${b.title}` : ''}{b.place ? ` · ${b.place}` : ''}
                </p>
              </div>
              <div className="grid justify-items-end gap-1">
                <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${b.status === 'ACCEPTED' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-gold/15 text-gold-light'}`}>
                  {b.status === 'ACCEPTED' ? 'Confirmé' : organizer ? 'En attente' : 'À confirmer'}
                </span>
                {b.fee != null && <span className="text-xs font-semibold tabular-nums text-gold-light">{euro(b.fee)}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </SpacePanel>
  )
}
