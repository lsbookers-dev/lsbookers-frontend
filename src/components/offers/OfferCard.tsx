'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CircleCheck, FileText, Layers, Send, Share2 } from 'lucide-react'
import { publicProfileHref } from '@/components/profile/utils'

/* ─── Types ─────────────────────────────────────────────── */
export type Offer = {
  id: number
  title: string
  description: string
  type: 'ARTIST' | 'PROVIDER' | 'ALL'
  specialty?: string | null
  date: string
  location: string
  country: string
  fee?: number | null
  endDate?: string | null
  createdAt: string
  organizerId: number
  applicantCount?: number
  organizer: {
    id: number
    userId: number
    avatar: string | null
    name: string
    role?: string | null
  }
}

/* ─── Config couleurs par type d'offre ──────────────────── */
export const OFFER_TYPE_CONFIG = {
  ARTIST:   { label: 'Artiste',      gradient: 'from-violet-600 to-violet-500',     border: 'border-violet-400/30', badge: 'bg-violet-500/15 text-violet-200 border-violet-400/30', apply: 'from-violet-600 to-violet-500' },
  PROVIDER: { label: 'Prestataire',  gradient: 'from-[#8a6a2e] to-[#b8914a]',       border: 'border-gold/30',       badge: 'bg-gold/15 text-gold-light border-gold/30',               apply: 'from-[#8a6a2e] to-[#b8914a]' },
  ALL:      { label: 'Tous profils', gradient: 'from-violet-600 to-[#b8914a]',      border: 'border-gold/25',       badge: 'bg-violet-500/10 text-gold-light border-gold/25',         apply: 'from-violet-600 to-[#b8914a]' },
} as const

/* ─── Carte d'offre ─────────────────────────────────────── */
export default function OfferCard({
  offer,
  isLoggedIn,
  isOwner,
  applying,
  onApply,
  onShare,
  onQuote,
  onClose,
}: {
  offer: Offer
  isLoggedIn: boolean
  isOwner: boolean
  applying: boolean
  onApply: (offer: Offer) => void
  onShare: (offer: Offer) => void
  /** « Envoyer un devis » (PDF ou proposition en ligne), compte comme une candidature */
  onQuote?: (offer: Offer) => void
  /** Auteur de l'offre : clôturer une fois le booking trouvé */
  onClose?: (offer: Offer) => void
}) {
  const cfg = OFFER_TYPE_CONFIG[offer.type]
  const date = new Date(offer.date)
  const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const day = date.toLocaleDateString('fr-FR', { day: '2-digit' })
  const month = date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase()
  const similarHref = `/offers?${offer.specialty ? `specialty=${encodeURIComponent(offer.specialty)}&` : ''}location=${encodeURIComponent(offer.location)}`

  return (
    <article className={`lsb-offer-poster group relative ${offer.type.toLowerCase()}`}>
      {/* Partager : petit picto en haut à droite de la carte */}
      <button
        type="button"
        onClick={() => onShare(offer)}
        aria-label="Partager l'offre"
        title="Partager"
        className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/35 text-white/75 backdrop-blur transition hover:bg-black/55 hover:text-white"
      >
        <Share2 className="h-3.5 w-3.5" />
      </button>
      <div className="lsb-offer-art" aria-hidden="true">
        <div className="lsb-offer-beam lsb-offer-beam-one" />
        <div className="lsb-offer-beam lsb-offer-beam-two" />
        <span className={`lsb-offer-type ${cfg.badge}`}>{cfg.label} recherché</span>
        <div className="lsb-offer-date"><strong>{day}</strong><span>{month} · {timeStr}</span></div>
      </div>

      <div className="lsb-offer-content">
        <header className="lsb-offer-owner">
          <Link href={publicProfileHref(offer.organizer.role ?? 'ORGANIZER', offer.organizer.userId) || '#'} className="flex items-center gap-3 min-w-0 group/link">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 flex-shrink-0">
                {offer.organizer.avatar ? (
                  <Image src={offer.organizer.avatar} alt={offer.organizer.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50 text-sm font-bold">
                    {offer.organizer.name[0]?.toUpperCase()}
                  </div>
                )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white group-hover/link:text-white/80 transition-colors truncate">
                {offer.organizer.name}
              </p>
              <p className="text-xs text-white/40">Voir le profil</p>
            </div>
          </Link>
        </header>

        <div className="lsb-offer-title">
          <span>{offer.specialty || 'Opportunité'} · {offer.location}</span>
          <h3>{offer.title}</h3>
        </div>

        <p className="lsb-offer-description">{offer.description}</p>

        <div className="lsb-offer-stats">
          <span><strong>{offer.fee != null ? `${offer.fee.toLocaleString('fr-FR')} €` : 'À définir'}</strong><small>Cachet</small></span>
          <span><strong>{offer.applicantCount ?? 0}</strong><small>Candidat{(offer.applicantCount ?? 0) > 1 ? 's' : ''}</small></span>
          <span><strong>{dateStr}</strong><small>{offer.location}, {offer.country}</small></span>
        </div>

        <footer className="lsb-offer-actions">
          <Link
            href={similarHref}
            className="lsb-offer-secondary"
          >
            <Layers className="w-3 h-3" />
            Similaires
          </Link>

          {/* Envoyer un devis — à la place de Partager (choix d'Antho, 23/10/2026) */}
          {isLoggedIn && !isOwner && onQuote && (
            <button
              type="button"
              onClick={() => onQuote(offer)}
              className="lsb-offer-secondary"
            >
              <FileText className="w-3 h-3" />
              Envoyer un devis
            </button>
          )}

          {/* Auteur de l'offre : la clôturer une fois le booking trouvé */}
          {isOwner && onClose && (
            <button
              type="button"
              onClick={() => onClose(offer)}
              className="lsb-offer-secondary col-span-2 !text-white/80"
            >
              <CircleCheck className="w-3 h-3" />
              Clôturer l&apos;offre
            </button>
          )}

          {/* Postuler — visible pour tout utilisateur connecté sauf le créateur */}
          {isLoggedIn && !isOwner && (
            <button
              onClick={() => onApply(offer)}
              disabled={applying}
              className={`lsb-offer-apply bg-gradient-to-r ${cfg.apply}`}
            >
              <Send className="w-3 h-3" />
              {applying ? '…' : 'Postuler'}
            </button>
          )}
        </footer>
      </div>
    </article>
  )
}

