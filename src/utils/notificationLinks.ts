/** Ouvre un événement de l'agenda (et l'onglet Bookings pour l'organisateur). */
export function agendaEventLink(eventId?: number | null, tab?: 'bookings' | 'checklist') {
  if (!eventId) return '/agenda'
  return `/agenda?event=${eventId}${tab ? `&tab=${tab}` : ''}`
}

/** Liens des notifications liées aux avis et aux bookings (cloche, page Notifications, Mon espace). */
export function reviewOrBookingItemLink(type: string, eventId?: number | null): string | null {
  if (type === 'NEW_REVIEW') return '/studio-profile'
  if (type === 'REVIEW_AVAILABLE') return '/space#avis'
  if (type === 'BOOKING_ITEM_ADDED') return agendaEventLink(eventId, 'bookings')
  if (type === 'CHECKLIST_REMINDER') return agendaEventLink(eventId, 'checklist')
  // Offre clôturée par un booking confirmé : on ouvre ce booking dans l'agenda
  if (type === 'OFFER_FILLED') return agendaEventLink(eventId, 'bookings')
  return null
}

/** Paiements, abonnements, formules et alertes admin → la page qui permet d'agir */
export function billingLink(type: string): string | null {
  switch (type) {
    case 'SUBSCRIPTION_UPDATE':
    case 'EXTRA_ORDER_UPDATE':
      return '/subscriptions'
    case 'PAYOUT_RELEASED':
    case 'LATE_CANCEL_WARNING':
      return '/settings/subscription'
    case 'BOOKING_PAYMENT':
    case 'BOOKING_PAYMENT_FAILED':
      return '/agenda'
    // Profils gérés : le titulaire répond dans ses Réglages, l'agence retrouve ses profils
    case 'MANAGEMENT_INVITE':
    case 'MANAGEMENT_ENDED':
    case 'PRO_PAUSED_BY_MANAGER':
      return '/settings/management'
    case 'MANAGEMENT_ACCEPTED':
    case 'MANAGEMENT_DECLINED':
      return '/gestion'
    case 'ADMIN_MANAGED_PROFILE_CHECK':
      return '/admin/users'
    case 'ADMIN_CAROUSEL_REQUEST':
    case 'ADMIN_EXTRA_ORDER':
      return '/admin/subscriptions?tab=orders'
    case 'ADMIN_LATE_CANCEL_ALERT':
      return '/admin/subscriptions?tab=cancellations'
    case 'ADMIN_PAYMENT_ISSUE':
      return '/admin/subscriptions'
    default:
      return null
  }
}

/* ─────────────────────────────────────────────────────────
   Où mène une notification (cloche ET page Notifications : une seule règle, 04/11/2026)
───────────────────────────────────────────────────────── */
export type NotificationLinkData = {
  type: string
  actor?: { id: number; role?: string | null } | null
  conversationId?: number | null
  offerId?: number | null
  publicationId?: number | null
  eventId?: number | null
}

/** Publication à ouvrir dans sa fenêtre (sans quitter la page), ou adresse où aller, ou rien */
export type NotificationTarget = { publicationId: number } | { href: string } | null

const PUBLICATION_TYPES = ['NEW_LIKE', 'NEW_COMMENT', 'NEW_COMMENT_REPLY', 'NEW_COMMENT_LIKE', 'TAG_ON_PUBLICATION']
const CONVERSATION_TYPES = [
  'NEW_MESSAGE', 'BOOKING_REQUEST', 'BOOKING_APPROVAL_NEEDED', 'BOOKING_ACCEPTED', 'BOOKING_DECLINED',
  'BOOKING_CANCELLED', 'CANCELLATION_REQUEST', 'CANCELLATION_ACCEPTED', 'CANCELLATION_DECLINED', 'PAYMENT_RECEIVED',
]
const OFFER_TYPES = ['NEW_OFFER', 'NEW_APPLICATION', 'OFFER_CLOSED', 'OFFER_TO_CLOSE']
const EVENT_TYPES = ['STAFF_INVITATION', 'STAFF_ACCEPTED', 'STAFF_REFUSED']
const PAYMENT_TYPES = ['BOOKING_PAYMENT', 'BOOKING_PAYMENT_FAILED', 'PAYOUT_RELEASED']

function profileLink(actor?: { id: number; role?: string | null } | null): string | null {
  if (!actor?.id) return null
  const role = actor.role?.toUpperCase()
  if (role === 'ARTIST') return `/artist/${actor.id}`
  if (role === 'ORGANIZER') return `/organizer/${actor.id}`
  if (role === 'PROVIDER') return `/provider/${actor.id}`
  return null
}

export function notificationTarget(n: NotificationLinkData): NotificationTarget {
  // J'aime, commentaires, identifications : la publication concernée
  if (PUBLICATION_TYPES.includes(n.type)) return n.publicationId ? { publicationId: n.publicationId } : null
  // Bookings : la conversation du booking (demande, réponse, annulation)
  if (CONVERSATION_TYPES.includes(n.type)) return { href: n.conversationId ? `/messages?c=${n.conversationId}` : '/agenda' }
  // Offres : l'offre elle-même (nouvelle, candidature reçue, clôturée, à clôturer)
  if (OFFER_TYPES.includes(n.type)) return { href: n.offerId ? `/offers?offer=${n.offerId}` : '/offers' }
  // Équipe d'un événement : l'événement dans l'agenda
  if (EVENT_TYPES.includes(n.type)) return { href: agendaEventLink(n.eventId) }
  // Paiements d'un booking : le booking dans l'agenda (sinon la page des paiements)
  if (PAYMENT_TYPES.includes(n.type) && n.eventId) return { href: agendaEventLink(n.eventId, 'bookings') }
  // Avis reçu : Mon espace › Mes avis, où l'on peut répondre
  if (n.type === 'NEW_REVIEW') return { href: '/space#avis' }
  if (n.type === 'NEW_DEVICE_LOGIN') return { href: '/settings/security' }
  const itemOrReview = reviewOrBookingItemLink(n.type, n.eventId)
  if (itemOrReview) return { href: itemOrReview }
  const billing = billingLink(n.type)
  if (billing) return { href: billing }
  // Nouvel abonné, réponse à votre avis : le profil de la personne
  const profile = profileLink(n.actor)
  return profile ? { href: profile } : null
}
