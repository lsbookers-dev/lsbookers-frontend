/** Ouvre un événement de l'agenda (et l'onglet Bookings pour l'organisateur). */
export function agendaEventLink(eventId?: number | null, tab?: 'bookings') {
  if (!eventId) return '/agenda'
  return `/agenda?event=${eventId}${tab ? `&tab=${tab}` : ''}`
}

/** Liens des notifications liées aux avis et aux bookings (cloche, page Notifications, Mon espace). */
export function reviewOrBookingItemLink(type: string, eventId?: number | null): string | null {
  if (type === 'NEW_REVIEW') return '/studio-profile'
  if (type === 'REVIEW_AVAILABLE') return '/space#avis'
  if (type === 'BOOKING_ITEM_ADDED') return agendaEventLink(eventId, 'bookings')
  return null
}
