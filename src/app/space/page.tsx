'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getAuthToken } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Eye,
  ImagePlus,
  MapPin,
  MessageCircle,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'

type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'

type ProfileIdentity = {
  id?: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  role?: Role
}

type Profile = {
  id: number
  userId?: number
  avatar?: string | null
  banner?: string | null
  bio?: string | null
  profession?: string | null
  location?: string | null
  country?: string | null
  specialties?: string[]
  styles?: string[]
  followersCount?: number
  followingCount?: number
  availableForBooking?: boolean
  typeEtablissement?: string | null
  radiusKm?: number | null
  cvText?: string | null
  websiteUrl?: string | null
  instagramUrl?: string | null
  soundcloudUrl?: string | null
  youtubeUrl?: string | null
  user?: ProfileIdentity
}

type BookingProfile = {
  id: number
  avatar?: string | null
  user?: ProfileIdentity
}

type BookingRequest = {
  id: number
  startDate: string
  endDate?: string | null
  fee?: number | null
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED'
  conversationId?: number | null
  requester?: BookingProfile
  target?: BookingProfile
}

type EventItem = {
  id: number
  title: string
  start: string
  end?: string | null
  lieu?: string | null
  category?: string | null
  status?: string | null
  staffStatus?: string | null
  staffRole?: string | null
}

type Offer = {
  id: number
  title: string
  type: 'ARTIST' | 'PROVIDER' | 'ALL'
  specialty?: string | null
  date: string
  location: string
  status?: string
  organizerId: number
  applicantCount?: number
}

type Review = { rating?: number | null }

type Notification = {
  id: number
  type: string
  content: string
  read: boolean
  createdAt: string
  actor?: { id: number; name?: string | null; avatar?: string | null; role?: Role | null } | null
  conversationId?: number | null
  offerId?: number | null
  eventId?: number | null
}

type DashboardData = {
  profile: Profile | null
  received: BookingRequest[]
  sent: BookingRequest[]
  events: EventItem[]
  offers: Offer[]
  reviews: Review[]
  notifications: Notification[]
  unreadMessages: number
}

const EMPTY_DATA: DashboardData = {
  profile: null,
  received: [],
  sent: [],
  events: [],
  offers: [],
  reviews: [],
  notifications: [],
  unreadMessages: 0,
}

const ROLE_CONTENT: Record<Exclude<Role, 'ADMIN'>, {
  label: string
  eyebrow: string
  intro: string
  priorityHint: string
}> = {
  ARTIST: {
    label: 'Artiste',
    eyebrow: 'VOTRE ACTIVITÉ ARTISTIQUE',
    intro: 'Vos demandes, vos prochaines dates et les opportunités qui correspondent à votre univers.',
    priorityHint: 'Les actions qui font avancer votre activité',
  },
  ORGANIZER: {
    label: 'Organisateur',
    eyebrow: 'VOS PROJETS',
    intro: 'Vos événements, vos recrutements et vos collaborations au même endroit.',
    priorityHint: 'Les décisions qui font avancer vos événements',
  },
  PROVIDER: {
    label: 'Prestataire',
    eyebrow: 'VOTRE ACTIVITÉ PROFESSIONNELLE',
    intro: 'Vos missions, vos demandes et les projets qui recherchent votre savoir-faire.',
    priorityHint: 'Les actions qui font avancer vos missions',
  },
}

const BOOKING_NOTIFICATION_TYPES = new Set([
  'BOOKING_REQUEST', 'BOOKING_ACCEPTED', 'BOOKING_DECLINED', 'BOOKING_CANCELLED',
  'CANCELLATION_REQUEST', 'CANCELLATION_ACCEPTED', 'CANCELLATION_DECLINED', 'PAYMENT_RECEIVED',
])

function displayName(profile?: BookingProfile | null) {
  const identity = profile?.user
  return identity?.pseudo || [identity?.firstName, identity?.lastName].filter(Boolean).join(' ') || 'Profil LSBookers'
}

function formatDate(value?: string | null, withYear = false) {
  if (!value) return 'Date à définir'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date à définir'
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}),
  })
}

function formatTime(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function relativeDate(value: string) {
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return ''
  const delta = Date.now() - time
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (delta < minute) return 'À l’instant'
  if (delta < hour) return `Il y a ${Math.max(1, Math.floor(delta / minute))} min`
  if (delta < day) return `Il y a ${Math.floor(delta / hour)} h`
  if (delta < 7 * day) return `Il y a ${Math.floor(delta / day)} j`
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function notificationLink(notification: Notification) {
  if (notification.conversationId) return `/messages?c=${notification.conversationId}`
  if (notification.offerId || notification.type === 'NEW_OFFER' || notification.type === 'NEW_APPLICATION') return '/offers'
  if (notification.eventId || notification.type.startsWith('STAFF_')) return '/agenda'
  if (notification.actor?.id && ['ARTIST', 'ORGANIZER', 'PROVIDER'].includes(notification.actor.role || '')) {
    return `/${notification.actor.role?.toLowerCase()}/${notification.actor.id}`
  }
  if (BOOKING_NOTIFICATION_TYPES.has(notification.type)) return '/agenda'
  return '/notifications'
}

function notificationIcon(type: string) {
  if (type === 'NEW_MESSAGE') return MessageCircle
  if (type === 'NEW_FOLLOW') return Users
  if (type === 'NEW_OFFER' || type === 'NEW_APPLICATION') return BriefcaseBusiness
  if (BOOKING_NOTIFICATION_TYPES.has(type) || type.startsWith('STAFF_')) return CalendarClock
  return Bell
}

export default function SpacePage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData>(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setLoadError(false)
      const token = getAuthToken()
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
      const authOptions: RequestInit = { credentials: 'include', headers, cache: 'no-store' }

      try {
        const profileResponse = await fetch(apiUrl('profile/me'), authOptions)
        if (!profileResponse.ok) throw new Error('PROFILE_UNAVAILABLE')
        const profilePayload = await profileResponse.json()
        const profile: Profile | null = profilePayload?.profile || null

        const requests = [
          fetch(apiUrl('events/booking-requests'), authOptions),
          fetch(apiUrl('events/all'), authOptions),
          fetch(apiUrl('events/assigned'), authOptions),
          fetch(apiUrl('messages/unread-count'), authOptions),
          fetch(apiUrl('notifications'), authOptions),
          fetch(apiUrl('offers'), { cache: 'no-store' }),
          profile?.id ? fetch(apiUrl(`reviews/profile/${profile.id}`), { cache: 'no-store' }) : Promise.resolve(null),
        ]

        const [bookingsRes, eventsRes, assignedRes, unreadRes, notificationsRes, offersRes, reviewsRes] = await Promise.allSettled(requests)

        const readJson = async (result: PromiseSettledResult<Response | null>) => {
          if (result.status !== 'fulfilled' || !result.value?.ok) return null
          return result.value.json().catch(() => null)
        }

        const [bookings, ownedEvents, assignedEvents, unread, notifications, offers, reviews] = await Promise.all([
          readJson(bookingsRes), readJson(eventsRes), readJson(assignedRes), readJson(unreadRes),
          readJson(notificationsRes), readJson(offersRes), readJson(reviewsRes),
        ])

        const eventMap = new Map<number, EventItem>()
        for (const event of [...(ownedEvents?.events || []), ...(assignedEvents?.events || [])]) eventMap.set(event.id, event)

        if (!cancelled) {
          setData({
            profile,
            received: bookings?.received || [],
            sent: bookings?.sent || [],
            events: [...eventMap.values()],
            offers: Array.isArray(offers) ? offers : [],
            reviews: reviews?.reviews || [],
            notifications: notifications?.notifications || [],
            unreadMessages: unread?.count || 0,
          })
        }
      } catch {
        if (!cancelled) setLoadError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboard()
    return () => { cancelled = true }
  }, [user?.id])

  const role = (user?.role === 'ADMIN' ? 'ORGANIZER' : user?.role || 'ARTIST') as Exclude<Role, 'ADMIN'>
  const content = ROLE_CONTENT[role]
  const profile = data.profile
  const name = profile?.user?.pseudo || [profile?.user?.firstName, profile?.user?.lastName].filter(Boolean).join(' ') || user?.name || 'Votre espace'
  const publicProfileHref = user?.id ? `/${role.toLowerCase()}/${user.id}` : '/studio-profile'

  const profileProgress = useMemo(() => {
    if (!profile) return { value: 0, missing: 'Complétez les informations principales' }
    const common = [
      { value: profile.avatar, label: 'Ajoutez une photo de profil' },
      { value: profile.banner, label: 'Ajoutez une bannière' },
      { value: profile.bio, label: 'Présentez votre activité' },
      { value: profile.location, label: 'Ajoutez votre localisation' },
    ]
    const specific = role === 'ORGANIZER'
      ? [
          { value: profile.typeEtablissement || profile.profession, label: 'Précisez votre type de structure' },
          { value: profile.websiteUrl || profile.instagramUrl, label: 'Ajoutez un lien professionnel' },
        ]
      : role === 'PROVIDER'
        ? [
            { value: profile.profession, label: 'Précisez votre métier' },
            { value: profile.specialties?.length, label: 'Ajoutez vos spécialités' },
            { value: profile.cvText, label: 'Complétez votre présentation professionnelle' },
          ]
        : [
            { value: profile.profession, label: 'Précisez votre activité artistique' },
            { value: profile.specialties?.length, label: 'Ajoutez vos spécialités' },
            { value: profile.styles?.length, label: 'Ajoutez vos styles' },
            { value: profile.youtubeUrl || profile.soundcloudUrl, label: 'Ajoutez un média de prestation' },
          ]
    const fields = [...common, ...specific]
    const completed = fields.filter(field => Boolean(field.value)).length
    return {
      value: Math.round((completed / fields.length) * 100),
      missing: fields.find(field => !field.value)?.label || 'Votre profil est prêt à être présenté',
    }
  }, [profile, role])

  const averageReview = useMemo(() => {
    const ratings = data.reviews.map(review => Number(review.rating)).filter(rating => Number.isFinite(rating) && rating > 0)
    return ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null
  }, [data.reviews])

  const allBookings = useMemo(() => {
    const byId = new Map<number, BookingRequest>()
    for (const booking of [...data.received, ...data.sent]) byId.set(booking.id, booking)
    return [...byId.values()]
  }, [data.received, data.sent])

  const pendingRequests = useMemo(() => {
    const source = role === 'ORGANIZER' ? data.sent : data.received
    return source.filter(request => request.status === 'PENDING').sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  }, [data.received, data.sent, role])

  const acceptedBookings = allBookings.filter(booking => booking.status === 'ACCEPTED' || booking.status === 'COMPLETED')
  const upcomingEvents = useMemo(() => data.events
    .filter(event => new Date(event.start).getTime() >= Date.now() && !['CANCELLED', 'COMPLETED'].includes(event.status || ''))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()), [data.events])
  const nextEvent = upcomingEvents[0]

  const ownedOffers = data.offers.filter(offer => offer.organizerId === profile?.id)
  const activeOwnedOffers = ownedOffers.filter(offer => !offer.status || offer.status === 'ACTIVE')
  const applicationsCount = activeOwnedOffers.reduce((sum, offer) => sum + (offer.applicantCount || 0), 0)
  const matchedOffers = data.offers.filter(offer => {
    if (role === 'ORGANIZER' || offer.organizerId === profile?.id) return false
    if (offer.type !== role && offer.type !== 'ALL') return false
    if (!offer.specialty || !profile?.specialties?.length) return true
    const specialty = offer.specialty.toLocaleLowerCase('fr-FR')
    return profile.specialties.some(item => {
      const own = item.toLocaleLowerCase('fr-FR')
      return own === specialty || own.includes(specialty) || specialty.includes(own)
    })
  })

  const activity = data.notifications
    .filter(notification => notification.type !== 'NEW_DEVICE_LOGIN')
    .slice(0, 4)

  const metrics = role === 'ORGANIZER'
    ? [
        { icon: CalendarDays, value: upcomingEvents.length, label: 'Événements à venir' },
        { icon: BriefcaseBusiness, value: activeOwnedOffers.length, label: 'Offres ouvertes' },
        { icon: Users, value: applicationsCount, label: 'Candidatures reçues' },
        { icon: CheckCircle2, value: acceptedBookings.length, label: 'Bookings confirmés' },
      ]
    : [
        { icon: Users, value: profile?.followersCount ?? 0, label: 'Abonnés' },
        { icon: Star, value: averageReview ? averageReview.toFixed(1) : '—', label: `${data.reviews.length} avis` },
        { icon: CheckCircle2, value: acceptedBookings.length, label: role === 'ARTIST' ? 'Bookings confirmés' : 'Missions confirmées' },
        { icon: BriefcaseBusiness, value: matchedOffers.length, label: 'Opportunités adaptées' },
      ]

  const bookingActionLabel = role === 'ORGANIZER'
    ? `${pendingRequests.length} réponse${pendingRequests.length > 1 ? 's' : ''} de booking attendue${pendingRequests.length > 1 ? 's' : ''}`
    : `${pendingRequests.length} demande${pendingRequests.length > 1 ? 's' : ''} à examiner`

  if (loading) {
    return (
      <div className="lsb-page lsb-space-v2" aria-busy="true">
        <div className="lsb-space-loading"><Sparkles /><span>Préparation de votre espace…</span></div>
      </div>
    )
  }

  if (loadError || !profile) {
    return (
      <div className="lsb-page lsb-space-v2">
        <section className="lsb-space-empty">
          <CircleAlert />
          <h1>Votre espace n’a pas pu être chargé.</h1>
          <p>Réessayez dans quelques instants ou complétez votre profil pour activer votre tableau de bord.</p>
          <Link href="/studio-profile" className="lsb-primary-button">Ouvrir le Studio profil</Link>
        </section>
      </div>
    )
  }

  return (
    <div className="lsb-page lsb-space-v2">
      <header className="lsb-space-heading">
        <div>
          <span>{content.eyebrow}</span>
          <h1>Bonsoir, {name}<em>.</em></h1>
          <p>{content.intro}</p>
        </div>
        <div className="lsb-space-heading-actions">
          <Link href={publicProfileHref} className="lsb-space-button is-secondary"><Eye /> Voir mon profil</Link>
          <Link href="/studio-profile" className="lsb-space-button is-primary"><Sparkles /> Modifier mon profil</Link>
        </div>
      </header>

      <section className="lsb-space-hero">
        <div className="lsb-space-profile">
          {profile.banner && <Image src={profile.banner} alt="" fill className="lsb-space-profile-cover" unoptimized />}
          <div className="lsb-space-profile-shade" />
          <div className="lsb-space-profile-main">
            <div className="lsb-space-avatar">
              {profile.avatar
                ? <Image src={profile.avatar} alt={name} fill className="object-cover" unoptimized />
                : name.slice(0, 2).toUpperCase()}
            </div>
            <div className="lsb-space-profile-copy">
              <span>{content.label} · {profile.profession || profile.typeEtablissement || 'Profil professionnel'}</span>
              <h2>{name}</h2>
              <p><MapPin /> {profile.location || 'Localisation à compléter'}{profile.country ? `, ${profile.country}` : ''}</p>
            </div>
          </div>
          <div className="lsb-space-completion">
            <div><span>Profil professionnel</span><strong>{profileProgress.value}%</strong></div>
            <div className="lsb-space-progress"><i style={{ width: `${profileProgress.value}%` }} /></div>
            <p>{profileProgress.missing}</p>
          </div>
        </div>

        <div className="lsb-space-metrics">
          {metrics.map(({ icon: Icon, value, label }) => (
            <div key={label}><span><Icon /></span><strong>{value}</strong><small>{label}</small></div>
          ))}
        </div>
      </section>

      <section className="lsb-space-priorities">
        <div className="lsb-space-section-title">
          <h2>À traiter maintenant</h2>
          <span>{content.priorityHint}</span>
        </div>
        <div className="lsb-space-priority-grid">
          <Link href="/agenda" className={pendingRequests.length ? 'has-alert' : ''}>
            <i><CalendarClock /></i>
            <span><strong>{role === 'ORGANIZER' ? 'Bookings envoyés' : 'Demandes de booking'}</strong><small>{pendingRequests.length ? bookingActionLabel : 'Aucune demande en attente'}</small></span>
            {pendingRequests.length > 0 && <b>{pendingRequests.length}</b>}
          </Link>
          <Link href="/messages" className={data.unreadMessages ? 'has-alert' : ''}>
            <i><MessageCircle /></i>
            <span><strong>Nouveaux messages</strong><small>{data.unreadMessages ? `${data.unreadMessages} message${data.unreadMessages > 1 ? 's' : ''} non lu${data.unreadMessages > 1 ? 's' : ''}` : 'Vous êtes à jour'}</small></span>
            {data.unreadMessages > 0 && <b>{data.unreadMessages}</b>}
          </Link>
          <Link href="/studio-profile" className={profileProgress.value < 100 ? 'has-alert' : ''}>
            <i><ImagePlus /></i>
            <span><strong>{profileProgress.value < 100 ? 'Profil à compléter' : 'Profil complété'}</strong><small>{profileProgress.missing}</small></span>
            <em>{profileProgress.value}%</em>
          </Link>
        </div>
      </section>

      <div className="lsb-space-main-grid">
        <section className="lsb-space-panel lsb-space-activity">
          <div className="lsb-space-panel-heading">
            <div><span>ACTIVITÉ RÉCENTE</span><h2>Ce qui se passe autour de vous</h2></div>
            <Link href="/notifications">Tout voir</Link>
          </div>
          {activity.length ? (
            <div className="lsb-space-activity-list">
              {activity.map(notification => {
                const Icon = notificationIcon(notification.type)
                return (
                  <Link key={notification.id} href={notificationLink(notification)} className={!notification.read ? 'is-unread' : ''}>
                    <i><Icon /></i>
                    <span><strong>{notification.content || 'Nouvelle activité sur votre profil'}</strong><small>{notification.actor?.name || 'LSBookers'}</small></span>
                    <time>{relativeDate(notification.createdAt)}</time>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="lsb-space-panel-empty"><Bell /><p>Votre activité récente apparaîtra ici.</p></div>
          )}
        </section>

        <section className="lsb-space-panel lsb-space-requests">
          <div className="lsb-space-panel-heading">
            <div><span>DEMANDES</span><h2>{role === 'ORGANIZER' ? 'Réponses en attente' : 'Bookings en attente'}</h2></div>
            <Link href="/agenda">Gérer</Link>
          </div>
          {pendingRequests.length ? (
            <div className="lsb-space-request-list">
              {pendingRequests.slice(0, 3).map(request => {
                const counterpart = role === 'ORGANIZER' ? request.target : request.requester
                return (
                  <article key={request.id}>
                    <div className="lsb-space-request-date"><strong>{new Date(request.startDate).getDate()}</strong><span>{new Date(request.startDate).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}</span></div>
                    <div>
                      <span>EN ATTENTE</span>
                      <h3>{displayName(counterpart)}</h3>
                      <p>{formatDate(request.startDate)}{formatTime(request.startDate) ? ` · ${formatTime(request.startDate)}` : ''}{request.fee != null ? ` · ${request.fee.toLocaleString('fr-FR')} €` : ''}</p>
                    </div>
                    <Link href={request.conversationId ? `/messages?c=${request.conversationId}` : '/agenda'}>Ouvrir <ArrowRight /></Link>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="lsb-space-panel-empty"><CheckCircle2 /><p>Aucune demande ne nécessite votre attention.</p></div>
          )}
        </section>
      </div>

      <div className="lsb-space-highlight-grid">
        <section className="lsb-space-highlight is-opportunity">
          <div>
            <span>{role === 'ORGANIZER' ? 'VOS RECRUTEMENTS' : 'OPPORTUNITÉS POUR VOUS'}</span>
            <h2>{role === 'ORGANIZER'
              ? `${applicationsCount} candidature${applicationsCount > 1 ? 's' : ''} sur vos offres`
              : `${matchedOffers.length} offre${matchedOffers.length > 1 ? 's' : ''} correspond${matchedOffers.length > 1 ? 'ent' : ''} à votre profil`}</h2>
            <p>{role === 'ORGANIZER'
              ? `${activeOwnedOffers.length} offre${activeOwnedOffers.length > 1 ? 's' : ''} actuellement ouverte${activeOwnedOffers.length > 1 ? 's' : ''}.`
              : 'Sélection basée sur votre métier et vos spécialités.'}</p>
          </div>
          <Link href="/offers">{role === 'ORGANIZER' ? 'Gérer les offres' : 'Explorer les opportunités'} <ArrowRight /></Link>
        </section>

        <section className="lsb-space-highlight is-event">
          <div>
            <span>PROCHAINE DATE</span>
            <h2>{nextEvent?.title || 'Votre agenda est disponible'}</h2>
            <p>{nextEvent
              ? `${formatDate(nextEvent.start, true)}${formatTime(nextEvent.start) ? ` · ${formatTime(nextEvent.start)}` : ''}${nextEvent.lieu ? ` · ${nextEvent.lieu}` : ''}`
              : 'Ajoutez vos disponibilités, vos événements et vos prochaines missions.'}</p>
          </div>
          <Link href="/agenda">Ouvrir l’agenda <ArrowRight /></Link>
        </section>
      </div>

      <footer className="lsb-space-footer-card">
        <div><Sparkles /><span><strong>Votre profil public reste séparé de cet espace privé.</strong><small>Modifiez vos informations dans le Studio profil, puis contrôlez exactement ce que voient les autres utilisateurs.</small></span></div>
        <Link href="/studio-profile">Accéder au Studio profil <ArrowRight /></Link>
      </footer>
    </div>
  )
}
