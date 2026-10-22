'use client'

/** « Mon activité » : les chiffres clés du mois + ce qui attend une action. */

import Link from 'next/link'
import LsIcon, { type LsIconName } from '@/components/ui/LsIcon'
import { SpacePanel } from './ui'

export type Kpis = {
  done: number
  doneThisMonth: number
  upcoming: number
  upcomingPending: number
  applications: number
  applicationsPending?: number
  openOffers?: number
  views: number
  viewsTrend: number | null
  newFollowers: number
  // Statistiques détaillées (version Pro)
  searchHits?: number
  detailedStats?: boolean
}

type Tile = { icon: LsIconName; label: string; value: number; hint: React.ReactNode }

export default function ActivityPanel({ organizer, kpis, monthLabel, alerts }: {
  organizer: boolean
  kpis: Kpis
  monthLabel: string
  alerts: { icon: LsIconName; text: React.ReactNode; href: string }[]
}) {
  const plus = (n: number) => (n > 0 ? <><b className="font-semibold text-emerald-400">+{n}</b> ce mois-ci</> : 'aucun ce mois-ci')
  const trend = !kpis.detailedStats
    ? <>30 derniers jours · <Link href="/subscriptions" className="text-gold hover:text-gold-light">détail avec Pro</Link></>
    : kpis.viewsTrend == null
    ? 'ce mois-ci'
    : <><b className={`font-semibold ${kpis.viewsTrend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{kpis.viewsTrend >= 0 ? '+' : ''}{kpis.viewsTrend} %</b> vs mois dernier</>

  const tiles: Tile[] = organizer
    ? [
        { icon: 'venue', label: 'Événements organisés', value: kpis.done, hint: plus(kpis.doneThisMonth) },
        { icon: 'calendar', label: 'Bookings en cours', value: kpis.upcoming, hint: kpis.upcomingPending ? `dont ${kpis.upcomingPending} sans réponse` : 'tous confirmés' },
        { icon: 'offer', label: 'Candidatures reçues', value: kpis.applications, hint: `sur ${kpis.openOffers ?? 0} offre${(kpis.openOffers ?? 0) > 1 ? 's' : ''} ouverte${(kpis.openOffers ?? 0) > 1 ? 's' : ''}` },
        { icon: 'user', label: 'Vues du profil', value: kpis.views, hint: trend },
        { icon: 'follow', label: 'Nouveaux abonnés', value: kpis.newFollowers, hint: 'ce mois-ci' },
      ]
    : [
        { icon: 'booking', label: 'Bookings réalisés via LS Bookers', value: kpis.done, hint: plus(kpis.doneThisMonth) },
        { icon: 'calendar', label: 'Bookings en cours', value: kpis.upcoming, hint: kpis.upcomingPending ? `dont ${kpis.upcomingPending} à confirmer` : 'tous confirmés' },
        { icon: 'offer', label: 'Offres auxquelles j’ai postulé', value: kpis.applications, hint: kpis.applicationsPending ? `${kpis.applicationsPending} en attente de réponse` : 'aucune en attente' },
        { icon: 'user', label: 'Vues du profil', value: kpis.views, hint: trend },
        { icon: 'follow', label: 'Nouveaux abonnés', value: kpis.newFollowers, hint: 'ce mois-ci' },
      ]

  if (kpis.detailedStats) {
    tiles.push({ icon: 'search', label: 'Apparitions dans la recherche', value: kpis.searchHits ?? 0, hint: 'ce mois-ci' })
  }

  return (
    <SpacePanel kicker="Tableau de bord" title="Mon activité" action={<span className="rounded-lg border border-line px-2.5 py-1 text-xs capitalize text-muted">{monthLabel}</span>}>
      <div className={`grid grid-cols-2 gap-2.5 ${tiles.length > 5 ? 'lg:grid-cols-6' : 'lg:grid-cols-5'}`}>
        {tiles.map((tile, index) => (
          <div key={tile.label} className={`grid min-w-0 gap-1 rounded-[14px] border border-line bg-surface-2 p-3.5 ${index === 0 && tiles.length % 2 === 1 ? 'col-span-2 lg:col-span-1' : ''}`}>
            <span className="flex items-center gap-1.5 text-[11px] text-muted"><LsIcon name={tile.icon} size={15} />{tile.label}</span>
            <strong className="text-[26px] font-semibold leading-tight tabular-nums text-white">{tile.value}</strong>
            <small className="text-[11px] text-white/40">{tile.hint}</small>
          </div>
        ))}
      </div>
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((alert, i) => (
            <Link key={i} href={alert.href} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs text-muted transition hover:border-accent/40 hover:text-white">
              <LsIcon name={alert.icon} size={14} /><span>{alert.text}</span>
            </Link>
          ))}
        </div>
      )}
    </SpacePanel>
  )
}
