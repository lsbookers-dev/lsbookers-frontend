'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { apiFetch } from '@/utils/auth'
import LsIcon from '@/components/ui/LsIcon'
import type { Offer } from './types'

/** Colonne de droite : dernières offres publiées. */
const OFFER_TYPE_STYLE: Record<string, { label: string; accent: string }> = {
  ARTIST:   { label: 'ARTISTE RECHERCHÉ', accent: 'text-accent-light' },
  PROVIDER: { label: 'PRESTATAIRE RECHERCHÉ', accent: 'text-accent-light' },
  ALL:      { label: 'PROFIL RECHERCHÉ', accent: 'text-accent-light' },
}

export default function OffersSidebar({ apiBase, onSelectOffer }: {
  apiBase: string
  onSelectOffer: (offer: Offer) => void
}) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    apiFetch(`${apiBase}/api/offers?limit=6`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setOffers(Array.isArray(d) ? d.slice(0, 6) : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [apiBase])

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
        <LsIcon name="offer" size={15} />
        <span className="text-xs font-bold uppercase tracking-widest text-white/80">Dernières offres</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 text-white/20 animate-spin" /></div>
      ) : offers.length === 0 ? (
        <p className="text-center text-xs text-white/25 py-6">Aucune offre</p>
      ) : (
        <div className="p-3 flex flex-col gap-2">
          {offers.map(o => {
            const typeStyle = OFFER_TYPE_STYLE[o.type] ?? OFFER_TYPE_STYLE.ALL
            const start = new Date(o.date)
            const end = o.endDate ? new Date(o.endDate) : null
            const dateLabel = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '')
            const startTime = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            const endTime = end?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            const avatarUrl = o.organizer.avatar
              ? (o.organizer.avatar.startsWith('http') ? o.organizer.avatar : `${apiBase}${o.organizer.avatar}`)
              : null

            return (
              <button
                key={o.id}
                onClick={() => onSelectOffer(o)}
                className="group relative h-[92px] w-full overflow-hidden rounded-xl border border-white/8 bg-[linear-gradient(115deg,var(--lsb-panel)_0%,var(--lsb-panel-soft)_72%,var(--lsb-accent-soft)_100%)] px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30"
              >
                <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-accent to-accent-light" />
                <span className={`block truncate text-[9px] font-semibold tracking-[0.11em] ${typeStyle.accent}`}>
                  {typeStyle.label}
                </span>
                <strong className="mt-1 block truncate text-[15px] font-semibold leading-tight text-white transition-colors group-hover:text-accent-light">
                  {o.specialty || o.title}
                </strong>
                <span className="mt-2 grid min-w-0 grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2">
                  <span className="relative h-6 w-6 overflow-hidden rounded-lg bg-gradient-to-br from-accent-strong to-accent">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="" fill sizes="24px" className="object-cover" unoptimized />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-[8px] font-semibold text-white">
                        {o.organizer.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[10px] font-medium leading-none text-white/90">{o.organizer.name}</span>
                    <span className="mt-1 block truncate text-[9px] leading-none text-white/45">
                      {o.location} · {dateLabel} · {startTime}{endTime ? `–${endTime}` : ''}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[8px] uppercase tracking-[0.08em] text-white/35">Tarif</span>
                    <strong className="mt-0.5 block whitespace-nowrap text-[10px] font-semibold leading-none text-gold">
                      {o.fee != null ? `${o.fee} €` : 'À définir'}
                    </strong>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="px-4 py-3 border-t border-white/8">
        <Link href="/offers" className="text-xs text-accent-light hover:text-white transition-colors">
          Voir toutes les offres →
        </Link>
      </div>
    </div>
  )
}
