'use client'

/**
 * Mon espace — tableau de bord de travail (artistes / prestataires et organisateurs).
 * Ordre : Mon activité · Bookings en cours + Opportunités · Prochaine date + Activité récente ·
 * Mes avis · Lien de booking ou Équipe habituelle · Revenus / dépenses.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import LsIcon, { type LsIconName } from '@/components/ui/LsIcon'
import type { PendingReview } from '@/components/ReviewModal'
import { publicProfileHref } from '@/components/profile/utils'
import ActivityPanel, { type Kpis } from '@/components/space/ActivityPanel'
import AgencySpace from '@/components/space/AgencySpace'
import UpcomingPanel, { type UpcomingBooking } from '@/components/space/UpcomingPanel'
import OpportunitiesPanel, { type SpaceOffer } from '@/components/space/OpportunitiesPanel'
import NextDatePanel, { type NextEvent } from '@/components/space/NextDatePanel'
import RecentPanel, { type SpaceNotification } from '@/components/space/RecentPanel'
import ReviewsZone, { type ReceivedReview } from '@/components/space/ReviewsZone'
import TeamPanel, { type TeamMember } from '@/components/space/TeamPanel'
import BookingLinkCard from '@/components/space/BookingLinkCard'
import FinanceZone from '@/components/space/FinanceZone'

type Profile = {
  id: number
  avatar?: string | null
  banner?: string | null
  bio?: string | null
  profession?: string | null
  typeEtablissement?: string | null
  location?: string | null
  specialties?: string[]
  styles?: string[]
  cvText?: string | null
  websiteUrl?: string | null
  instagramUrl?: string | null
  youtubeUrl?: string | null
  soundcloudUrl?: string | null
  showRealName?: boolean
  user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null }
}

type Dashboard = { role: 'ARTIST' | 'ORGANIZER'; kpis: Kpis; upcoming: UpcomingBooking[]; team: TeamMember[] }

type SpaceData = {
  profile: Profile
  dashboard: Dashboard
  offers: SpaceOffer[]
  offersTotal: number
  nextEvent: NextEvent | null
  notifications: SpaceNotification[]
  unreadMessages: number
  reviews: { list: ReceivedReview[]; average: number | null; count: number }
  pendingReviews: PendingReview[]
}

// « Bonjour » jusqu'à 18 h, « Bonsoir » ensuite (heure de l'appareil)
const greeting = () => (new Date().getHours() >= 18 ? 'Bonsoir' : 'Bonjour')

const INTRO = {
  ARTIST: { kicker: 'Votre activité', text: 'Vos dates, vos demandes et vos revenus au même endroit.' },
  ORGANIZER: { kicker: 'Vos projets', text: 'Vos événements, vos recrutements et votre budget au même endroit.' },
}

/** Ce qui manque au profil, et la partie de l'éditeur du Studio à ouvrir. */
function profileProgress(profile: Profile, role: string) {
  const fields: { value: unknown; label: string; edit: string | null }[] = [
    { value: profile.avatar, label: 'Ajoutez une photo de profil', edit: null },
    { value: profile.banner, label: 'Ajoutez une bannière', edit: null },
    { value: profile.bio, label: 'Présentez votre activité', edit: 'presentation' },
    { value: profile.location, label: 'Ajoutez votre localisation', edit: 'location' },
    ...(role === 'ORGANIZER'
      ? [
          { value: profile.typeEtablissement || profile.profession, label: 'Précisez votre type d’établissement', edit: 'presentation' },
          { value: profile.websiteUrl || profile.instagramUrl, label: 'Ajoutez un lien professionnel', edit: 'socials' },
        ]
      : role === 'PROVIDER'
        ? [
            { value: profile.profession, label: 'Précisez votre métier', edit: 'presentation' },
            { value: profile.specialties?.length, label: 'Ajoutez vos spécialités', edit: 'specialties' },
            { value: profile.cvText, label: 'Complétez votre parcours', edit: 'career' },
          ]
        : [
            { value: profile.profession, label: 'Précisez votre activité artistique', edit: 'presentation' },
            { value: profile.specialties?.length, label: 'Ajoutez vos spécialités', edit: 'specialties' },
            { value: profile.styles?.length, label: 'Ajoutez vos styles', edit: 'specialties' },
            { value: profile.youtubeUrl || profile.soundcloudUrl, label: 'Ajoutez une vidéo ou un son', edit: 'media' },
          ]),
  ]
  const next = fields.find(f => !f.value)
  return {
    value: Math.round((fields.filter(f => f.value).length / fields.length) * 100),
    missing: next?.label ?? null,
    href: next?.edit ? `/studio-profile?edit=${next.edit}` : '/studio-profile',
  }
}


export default function SpacePage() {
  const { user, acting } = useAuth()
  const [data, setData] = useState<SpaceData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    const get = async (path: string) => {
      try {
        const res = await apiFetch(apiUrl(path), { cache: 'no-store' })
        return res.ok ? await res.json() : null
      } catch { return null }
    }

    ;(async () => {
      const [me, dashboard] = await Promise.all([get('profile/me'), get('space/dashboard')])
      const profile: Profile | null = me?.profile ?? null
      if (!profile || !dashboard) { if (!cancelled) setStatus('error'); return }
      const organizer = dashboard.role === 'ORGANIZER'
      // Chargements légers : la base renvoie seulement ce que la page affiche
      const [offers, next, notifications, unread, reviews, pending] = await Promise.all([
        get(organizer ? `offers?organizerId=${profile.id}` : 'space/opportunities'),
        get('space/next-event'),
        get('notifications?limit=10'),
        get('messages/unread-count'),
        get(`reviews/profile/${profile.id}`),
        get('reviews/pending'),
      ])
      if (cancelled) return
      const offerList: SpaceOffer[] = organizer ? (Array.isArray(offers) ? offers : []) : offers?.offers || []
      setData({
        profile,
        dashboard,
        offers: offerList,
        offersTotal: organizer ? offerList.length : offers?.total ?? 0,
        nextEvent: next?.event ?? null,
        notifications: notifications?.notifications || [],
        unreadMessages: unread?.count || 0,
        reviews: { list: reviews?.reviews || [], average: reviews?.average ?? null, count: reviews?.count ?? 0 },
        pendingReviews: pending?.pending || [],
      })
      setStatus('ready')
    })()
    return () => { cancelled = true }
  }, [user?.id])

  // Lien « laissez votre avis » (/space#avis) : la zone n'existe qu'une fois les données chargées
  useEffect(() => {
    if (status !== 'ready' || window.location.hash !== '#avis') return
    document.getElementById('avis')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [status])

  const role = user?.role || 'ARTIST'
  const organizer = data?.dashboard.role === 'ORGANIZER'
  const name = data?.profile.user?.pseudo || [data?.profile.user?.firstName, data?.profile.user?.lastName].filter(Boolean).join(' ') || user?.name || ''
  const progress = useMemo(() => (data ? profileProgress(data.profile, role) : null), [data, role])

  if (status === 'loading') {
    return (
      <div className="lsb-page" aria-busy="true">
        <div className="grid gap-4">
          <div className="h-16 w-72 animate-pulse rounded-xl bg-white/[0.05]" />
          <div className="h-40 animate-pulse rounded-[18px] bg-white/[0.04]" />
          <div className="grid gap-4 lg:grid-cols-2">{[0, 1].map(i => <div key={i} className="h-56 animate-pulse rounded-[18px] bg-white/[0.04]" />)}</div>
        </div>
      </div>
    )
  }

  if (status === 'error' || !data || !progress) {
    return (
      <div className="lsb-page grid min-h-[60vh] place-items-center text-center">
        <div className="grid justify-items-center gap-3">
          <LsIcon name="warning" size={30} tone="gold" />
          <h1 className="text-xl font-semibold">Votre espace n’a pas pu être chargé</h1>
          <p className="max-w-sm text-sm text-muted">Réessayez dans quelques instants.</p>
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Réessayer</button>
        </div>
      </div>
    )
  }

  const { dashboard } = data
  const alerts: { icon: LsIconName; text: React.ReactNode; href: string }[] = [
    ...(data.unreadMessages ? [{ icon: 'message' as const, text: <><b className="text-white">{data.unreadMessages}</b> message{data.unreadMessages > 1 ? 's' : ''} non lu{data.unreadMessages > 1 ? 's' : ''}</>, href: '/messages' }] : []),
    ...(dashboard.kpis.upcomingPending ? [{ icon: organizer ? 'hourglass' as const : 'booking' as const, text: <><b className="text-white">{dashboard.kpis.upcomingPending}</b> {organizer ? `booking${dashboard.kpis.upcomingPending > 1 ? 's' : ''} sans réponse` : `demande${dashboard.kpis.upcomingPending > 1 ? 's' : ''} de booking à examiner`}</>, href: '/agenda' }] : []),
    ...(progress.value < 100 ? [{ icon: 'user' as const, text: <>Profil complété à <b className="text-white">{progress.value} %</b> · {progress.missing}</>, href: progress.href }] : []),
  ]
  const publicHref = user?.id ? publicProfileHref(role, user.id) : null
  const intro = INTRO[dashboard.role]

  return (
    <div className="lsb-page grid gap-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[.2em] text-violet-400">{intro.kicker}</span>
          <h1 className="mt-1 text-[clamp(1.9rem,4vw,2.6rem)] font-semibold leading-tight">{greeting()}, {name}<em className="not-italic text-accent">.</em></h1>
          <p className="mt-1 text-sm text-muted">{intro.text}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {publicHref && (
            <Link href={publicHref} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-surface/80 px-3.5 text-xs font-semibold text-white">
              <LsIcon name="user" size={16} tone="inherit" />Voir mon profil
            </Link>
          )}
          <Link href="/studio-profile" className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-3.5 text-xs font-semibold text-white transition hover:bg-accent-strong">
            <LsIcon name="plus" size={16} tone="inherit" />Modifier mon profil
          </Link>
        </div>
      </header>

      {/* Formule Agence, sur son propre profil : l'espace agence passe en premier (E1) */}
      {user?.canManageProfiles && !acting && <AgencySpace agencyName={name} />}
      {user?.canManageProfiles && !acting && <h2 className="mt-2 text-sm font-semibold uppercase tracking-[.16em] text-white/45">Votre propre profil</h2>}
      <ActivityPanel
        organizer={organizer}
        kpis={dashboard.kpis}
        monthLabel={new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        alerts={alerts}
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <UpcomingPanel bookings={dashboard.upcoming} organizer={organizer} />
        <OpportunitiesPanel organizer={organizer} offers={data.offers} total={data.offersTotal} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <NextDatePanel event={data.nextEvent} />
        <RecentPanel notifications={data.notifications} />
      </div>

      <ReviewsZone
        received={data.reviews.list}
        average={data.reviews.average}
        count={data.reviews.count}
        pending={data.pendingReviews}
        onPendingDone={done => setData(d => d && { ...d, pendingReviews: d.pendingReviews.filter(p => !(p.kind === done.kind && p.id === done.id)) })}
      />

      {organizer ? <TeamPanel team={dashboard.team} /> : user?.id && <BookingLinkCard userId={user.id} name={name} />}

      <FinanceZone organizer={organizer} ownerName={name} />
    </div>
  )
}
