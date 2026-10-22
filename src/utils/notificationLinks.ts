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
