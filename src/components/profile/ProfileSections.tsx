'use client'

/** Blocs d'un profil, partagés par le Studio et le profil public (les 3 rôles). */

import Link from 'next/link'
import { useState } from 'react'
import { Briefcase, Calendar, Euro, Facebook, FileText, Globe, Instagram, Link as LinkIcon, Linkedin, MapPin, Music, Pencil, Plus, Trash2, Twitter, Youtube } from 'lucide-react'
import type { Offer } from '@/components/offers/OfferCard'
import { OFFER_TYPE_CONFIG } from '@/components/offers/OfferCard'
import type { EditorSection, ProfileData, ProfileMode } from './types'
import { socialLinks, soundcloudEmbedUrl, youtubeEmbedUrl } from './utils'

/* ── Cadre commun ─────────────────────────────────────────────────────────── */

export function Panel({ title, icon, onEdit, editLabel = 'Modifier', action, children }: {
  title: string
  icon?: React.ReactNode
  onEdit?: () => void
  editLabel?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xs uppercase tracking-widest text-white/35">{title}</h2>
        </div>
        {action}
        {onEdit && (
          <button type="button" onClick={onEdit} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/40 transition hover:bg-white/5 hover:text-white">
            <Pencil size={12} /> {editLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

/** Bloc vide : visible seulement dans le Studio, pour inviter à compléter. */
export function EmptyHint({ text, onAdd }: { text: string; onAdd?: () => void }) {
  return (
    <p className="text-sm text-white/35">
      {text}{' '}
      {onAdd && <button type="button" onClick={onAdd} className="text-violet-300 hover:underline">Ajouter</button>}
    </p>
  )
}

type SectionProps = {
  profile: ProfileData
  mode: ProfileMode
  onEdit?: (section: EditorSection) => void
}

const editFor = (mode: ProfileMode, onEdit: SectionProps['onEdit'], section: EditorSection) =>
  mode === 'studio' && onEdit ? () => onEdit(section) : undefined

/* ── Texte libre (À propos, CV, tarifs) ───────────────────────────────────── */

export function TextSection({ title, icon, value, emptyText, section, mode, onEdit }: Omit<SectionProps, 'profile'> & {
  title: string
  icon?: React.ReactNode
  value?: string | null
  emptyText: string
  section: EditorSection
}) {
  const edit = editFor(mode, onEdit, section)
  if (!value?.trim() && mode === 'public') return null
  return (
    <Panel title={title} icon={icon} onEdit={value?.trim() ? edit : undefined}>
      {value?.trim()
        ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">{value}</p>
        : <EmptyHint text={emptyText} onAdd={edit} />}
    </Panel>
  )
}

export const CvIcon = <FileText size={15} className="text-purple-400" />
export const FeesIcon = <Euro size={15} className="text-green-400" />

/* ── Styles musicaux ──────────────────────────────────────────────────────── */

export function StylesSection({ profile, mode, onEdit }: SectionProps) {
  const styles = profile.styles || []
  const edit = editFor(mode, onEdit, 'specialties')
  const hidden = profile.showStyles === false
  if (mode === 'public' && (hidden || !styles.length)) return null
  return (
    <Panel title="Styles musicaux" icon={<Music size={15} className="text-pink-400" />} onEdit={styles.length ? edit : undefined}>
      {styles.length ? (
        <>
          <div className="flex flex-wrap gap-2">
            {styles.map(style => <span key={style} className="rounded-full border border-white/[0.1] bg-white/[0.06] px-3 py-1 text-xs text-white/55">{style}</span>)}
          </div>
          {hidden && <p className="mt-2 text-[11px] text-white/35">Masqués sur ton profil public.</p>}
        </>
      ) : <EmptyHint text="Aucun style renseigné." onAdd={edit} />}
    </Panel>
  )
}

/* ── SoundCloud / vidéo ───────────────────────────────────────────────────── */

export function SoundcloudSection({ profile, mode, onEdit }: SectionProps) {
  const embed = soundcloudEmbedUrl(profile.soundcloudUrl)
  const visible = Boolean(profile.showSoundcloud && embed)
  if (mode === 'public' && !visible) return null
  if (mode === 'studio' && !embed) return null // proposé dans « Vidéo de présentation »
  return (
    <Panel title="SoundCloud" icon={<Music size={15} className="text-orange-400" />} onEdit={editFor(mode, onEdit, 'media')}>
      <div className="overflow-hidden rounded-lg">
        <iframe title="SoundCloud" width="100%" height="180" scrolling="no" frameBorder="no" allow="autoplay" src={embed!} />
      </div>
      {!visible && <p className="mt-2 text-[11px] text-white/35">Masqué sur ton profil public.</p>}
    </Panel>
  )
}

export function VideoSection({ profile, mode, onEdit }: SectionProps) {
  const embed = youtubeEmbedUrl(profile.youtubeUrl)
  const visible = Boolean(embed && profile.showYoutubeUrl !== false)
  const edit = editFor(mode, onEdit, 'media')
  if (mode === 'public' && !visible) return null
  return (
    <Panel title="Vidéo de présentation" icon={<Youtube size={15} className="text-red-400" />} onEdit={embed ? edit : undefined}>
      {embed ? (
        <>
          <div className="aspect-video overflow-hidden rounded-xl">
            <iframe title="Vidéo de présentation" width="100%" height="100%" src={embed} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
          {!visible && <p className="mt-2 text-[11px] text-white/35">Masquée sur ton profil public.</p>}
        </>
      ) : (
        <EmptyHint text={profile.youtubeUrl ? 'Ce lien vidéo n’est pas reconnu (YouTube ou Vimeo).' : 'Aucune vidéo de présentation.'} onAdd={edit} />
      )}
    </Panel>
  )
}

/* ── Réseaux sociaux ──────────────────────────────────────────────────────── */

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagramUrl: <Instagram size={16} className="text-pink-400" />,
  tiktokUrl: <Music size={16} />,
  facebookUrl: <Facebook size={16} className="text-blue-400" />,
  twitterUrl: <Twitter size={16} className="text-sky-400" />,
  linkedinUrl: <Linkedin size={16} className="text-blue-300" />,
  websiteUrl: <LinkIcon size={16} className="text-indigo-300" />,
}

export function SocialSection({ profile, mode, onEdit }: SectionProps) {
  const links = socialLinks(profile)
  const edit = editFor(mode, onEdit, 'socials')
  if (mode === 'public' && !links.length) return null
  return (
    <Panel title="Réseaux sociaux" icon={<Globe size={15} className="text-indigo-400" />} onEdit={links.length ? edit : undefined}>
      {links.length ? (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {links.map(link => (
            <a key={link.key} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-white/55 transition hover:text-white">
              {SOCIAL_ICONS[link.key]}{link.label}
            </a>
          ))}
        </div>
      ) : <EmptyHint text="Aucun réseau renseigné." onAdd={edit} />}
    </Panel>
  )
}

/* ── Carte (organisateurs) ────────────────────────────────────────────────── */

export function MapSection({ profile, mode, onEdit }: SectionProps) {
  const { latitude: lat, longitude: lng } = profile
  const hasCoords = lat != null && lng != null
  const edit = editFor(mode, onEdit, 'location')
  if (!hasCoords && mode === 'public') return null
  return (
    <Panel title="Localisation" icon={<MapPin size={15} className="text-white/40" />} onEdit={hasCoords ? edit : undefined}>
      {hasCoords ? (
        <>
          <div className="relative -mx-1 h-64 overflow-hidden rounded-xl">
            <iframe
              title="Carte"
              loading="lazy"
              className="absolute inset-0 h-full w-full"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng! - 0.03},${lat! - 0.02},${lng! + 0.03},${lat! + 0.02}&layer=mapnik&marker=${lat},${lng}`}
            />
          </div>
          <p className="mt-2 text-xs text-white/40">{[profile.location, profile.country].filter(Boolean).join(', ')}</p>
        </>
      ) : <EmptyHint text="Ajoute ta ville pour afficher la carte." onAdd={edit} />}
    </Panel>
  )
}

/* ── Offres publiées ──────────────────────────────────────────────────────── */

const OFFERS_PREVIEW = 4

export function OffersSection({ offers, mode, onPublish, onDelete }: {
  offers: Offer[]
  mode: ProfileMode
  onPublish?: () => void
  onDelete?: (offer: Offer) => void
}) {
  const [showAll, setShowAll] = useState(false)
  if (mode === 'public' && !offers.length) return null
  const visible = showAll ? offers : offers.slice(0, OFFERS_PREVIEW)
  return (
    <Panel
      title={mode === 'studio' ? 'Mes offres' : 'Offres'}
      icon={<Briefcase size={15} className="text-purple-400" />}
      action={onPublish && (
        <button type="button" onClick={onPublish} className="flex items-center gap-1 rounded-full bg-violet-600 px-3 py-1 text-xs text-white transition hover:bg-violet-500">
          <Plus size={12} /> Publier
        </button>
      )}
    >
      {offers.length === 0 ? (
        <EmptyHint text="Aucune offre en ligne. Les offres sont retirées automatiquement le lendemain de leur date." />
      ) : (
        <div className="space-y-2">
          {visible.map(offer => {
            const cfg = OFFER_TYPE_CONFIG[offer.type]
            return (
              <div key={offer.id} className="flex items-start gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                <Link href={`/offers?offer=${offer.id}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{offer.title}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${cfg.badge}`}>{cfg.label}</span>
                  </div>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/45">
                    {offer.specialty && <span>{offer.specialty}</span>}
                    <span className="flex items-center gap-1"><Calendar size={11} />{new Date(offer.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><MapPin size={11} />{offer.location}</span>
                    {offer.fee != null && <span className="text-green-400/80">{offer.fee.toLocaleString('fr-FR')} €</span>}
                  </p>
                </Link>
                {onDelete && (
                  <button type="button" onClick={() => onDelete(offer)} aria-label={`Supprimer ${offer.title}`} className="shrink-0 rounded-lg p-1.5 text-white/30 transition hover:bg-red-500/10 hover:text-red-300">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          })}
          {offers.length > OFFERS_PREVIEW && (
            <button type="button" onClick={() => setShowAll(v => !v)} className="w-full py-1 text-xs text-white/45 transition hover:text-white">
              {showAll ? 'Voir moins' : `Voir les ${offers.length} offres`}
            </button>
          )}
        </div>
      )}
    </Panel>
  )
}
