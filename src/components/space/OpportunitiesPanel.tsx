'use client'

/** Artiste / prestataire : offres qui correspondent au profil. Organisateur : ses recrutements. */

import Link from 'next/link'
import { EmptyLine, PanelLink, SpacePanel, euro } from './ui'

export type SpaceOffer = {
  id: number
  title: string
  type: 'ARTIST' | 'PROVIDER' | 'ALL'
  specialty?: string | null
  date: string
  location: string
  fee?: number | null
  organizerId: number
  applicantCount?: number
  organizer?: { name: string }
}

export default function OpportunitiesPanel({ organizer, offers }: { organizer: boolean; offers: SpaceOffer[] }) {
  const applications = offers.reduce((sum, o) => sum + (o.applicantCount || 0), 0)
  const title = organizer
    ? `${applications} candidature${applications > 1 ? 's' : ''} sur vos offres`
    : `${offers.length} offre${offers.length > 1 ? 's' : ''} correspond${offers.length > 1 ? 'ent' : ''} à votre profil`

  return (
    <SpacePanel
      kicker={organizer ? 'Vos recrutements' : 'Opportunités pour vous'}
      title={title}
      action={<PanelLink href="/offers">{organizer ? 'Gérer les offres' : 'Explorer'}</PanelLink>}
    >
      {offers.length === 0 ? (
        <EmptyLine>{organizer ? 'Aucune offre en ligne. Publiez-en une pour recevoir des candidatures.' : 'Aucune offre ne correspond pour l’instant. Complétez vos spécialités pour en voir plus.'}</EmptyLine>
      ) : (
        <div className="grid gap-2">
          {offers.slice(0, 3).map(offer => (
            <Link key={offer.id} href={`/offers?offer=${offer.id}`} className="grid gap-1 rounded-[13px] border border-line bg-surface-2 p-3 transition hover:border-accent/40">
              <h3 className="truncate text-[13px] font-semibold text-white">{offer.title}</h3>
              <div className="flex items-center justify-between gap-2 text-xs">
                <p className="truncate text-muted">
                  {organizer
                    ? `${new Date(offer.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · ${offer.applicantCount || 0} candidature${(offer.applicantCount || 0) > 1 ? 's' : ''}`
                    : `${offer.organizer?.name ? `${offer.organizer.name} · ` : ''}${offer.location} · ${new Date(offer.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                </p>
                <span className="shrink-0 font-semibold tabular-nums text-gold-light">{offer.fee != null ? euro(offer.fee) : 'À définir'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </SpacePanel>
  )
}
