/** Journal de l'agence : libellé de chaque action faite pour un profil géré */

export type JournalEntry = {
  id: number
  managerUserId: number
  profileId: number
  action: string
  detail: string | null
  createdAt: string
  profileName?: string | null
  managerName?: string | null
}

const ACTION_LABEL: Record<string, string> = {
  BOOKING_ACCEPTED: 'a accepté le booking',
  BOOKING_APPROVAL_REQUESTED: 'propose d’accepter le booking',
  BOOKING_DECLINED: 'a refusé le booking',
  BOOKING_CANCELLED: 'a annulé la demande de booking',
  BOOKING_REQUEST_SENT: 'a envoyé une demande de booking',
  BOOKING_CANCEL_REQUESTED: 'a demandé l’annulation du booking',
  OFFER_APPLICATION: 'a candidaté à l’offre',
  OFFER_PUBLISHED: 'a publié l’offre',
  PUBLICATION: 'a publié une publication',
  EVENT_CREATED: 'a créé l’événement',
  PROFILE_UPDATED: 'a modifié le profil',
}

/** « a accepté le booking du 14 novembre avec Le Rex » */
export function journalText(entry: JournalEntry) {
  const label = ACTION_LABEL[entry.action] || 'a fait une action'
  return entry.detail ? `${label} ${entry.detail}` : label
}

export const journalDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
