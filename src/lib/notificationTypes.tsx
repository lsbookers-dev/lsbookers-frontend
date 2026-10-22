/**
 * Types de notification : picto LS, couleur et libellé.
 * Source unique pour la cloche (Header), la page Notifications et Mon espace.
 */

import LsIcon, { type LsIconName, type LsIconTone } from '@/components/ui/LsIcon'

type NotificationType = { icon: LsIconName; tone: LsIconTone; label: string }

export const NOTIFICATION_TYPES: Record<string, NotificationType> = {
  // Messages
  NEW_MESSAGE:           { icon: 'message',  tone: 'accent', label: 'Message' },
  // Bookings
  BOOKING_REQUEST:       { icon: 'booking',  tone: 'accent', label: 'Demande de booking' },
  BOOKING_ACCEPTED:      { icon: 'check',    tone: 'ok',     label: 'Booking accepté' },
  BOOKING_DECLINED:      { icon: 'close',    tone: 'bad',    label: 'Booking refusé' },
  BOOKING_CANCELLED:     { icon: 'cancel',   tone: 'bad',    label: 'Booking annulé' },
  CANCELLATION_REQUEST:  { icon: 'warning',  tone: 'gold',   label: 'Demande d’annulation' },
  CANCELLATION_ACCEPTED: { icon: 'check',    tone: 'ok',     label: 'Annulation confirmée' },
  CANCELLATION_DECLINED: { icon: 'close',    tone: 'bad',    label: 'Annulation refusée' },
  BOOKING_ITEM_ADDED:    { icon: 'attach',   tone: 'accent', label: 'Booking mis à jour' },
  PAYMENT_RECEIVED:      { icon: 'payment',  tone: 'gold',   label: 'Paiement reçu' },
  BOOKING_PAYMENT:       { icon: 'payment',  tone: 'accent', label: 'Paiement en ligne' },
  BOOKING_PAYMENT_FAILED:{ icon: 'warning',  tone: 'bad',    label: 'Paiement refusé' },
  PAYOUT_RELEASED:       { icon: 'payment',  tone: 'gold',   label: 'Versement' },
  LATE_CANCEL_WARNING:   { icon: 'warning',  tone: 'gold',   label: 'Annulations tardives' },
  // Offres et abonnements
  SUBSCRIPTION_UPDATE:   { icon: 'star',     tone: 'gold',   label: 'Abonnement' },
  EXTRA_ORDER_UPDATE:    { icon: 'star',     tone: 'gold',   label: 'Formule' },
  // Admin
  ADMIN_CAROUSEL_REQUEST:{ icon: 'star',     tone: 'gold',   label: 'Carrousel à valider' },
  ADMIN_EXTRA_ORDER:     { icon: 'bolt',     tone: 'gold',   label: 'Formule à réaliser' },
  ADMIN_LATE_CANCEL_ALERT:{ icon: 'warning', tone: 'bad',    label: 'Annulations répétées' },
  ADMIN_PAYMENT_ISSUE:   { icon: 'warning',  tone: 'bad',    label: 'Paiement à vérifier' },
  // Offres
  NEW_OFFER:             { icon: 'offer',    tone: 'accent', label: 'Nouvelle offre' },
  NEW_APPLICATION:       { icon: 'offer',    tone: 'accent', label: 'Candidature' },
  OFFER_TO_CLOSE:        { icon: 'check',    tone: 'gold',   label: 'Offre à clôturer' },
  OFFER_CLOSED:          { icon: 'offer',    tone: 'muted',  label: 'Offre pourvue' },
  OFFER_FILLED:          { icon: 'check',    tone: 'ok',     label: 'Booking confirmé' },
  // Réseau
  NEW_FOLLOW:            { icon: 'follow',   tone: 'accent', label: 'Nouvel abonné' },
  NEW_COMMENT:           { icon: 'comment',  tone: 'accent', label: 'Commentaire' },
  NEW_COMMENT_REPLY:     { icon: 'reply',    tone: 'accent', label: 'Réponse' },
  NEW_COMMENT_LIKE:      { icon: 'heart',    tone: 'accent', label: 'J’aime' },
  NEW_LIKE:              { icon: 'heart',    tone: 'accent', label: 'J’aime' },
  TAG_ON_PUBLICATION:    { icon: 'image',    tone: 'accent', label: 'Identification' },
  // Avis
  NEW_REVIEW:            { icon: 'star',     tone: 'gold',   label: 'Nouvel avis' },
  REVIEW_AVAILABLE:      { icon: 'star',     tone: 'gold',   label: 'Avis à laisser' },
  REVIEW_REPLY:          { icon: 'reply',    tone: 'accent', label: 'Réponse à votre avis' },
  // Checklist d'un événement
  CHECKLIST_REMINDER:    { icon: 'clock',    tone: 'gold',   label: 'Rappel checklist' },
  // Sécurité
  NEW_DEVICE_LOGIN:      { icon: 'shield',   tone: 'gold',   label: 'Sécurité' },
  // Équipe d'un événement
  STAFF_INVITATION:      { icon: 'stage',    tone: 'accent', label: 'Invitation événement' },
  STAFF_ACCEPTED:        { icon: 'check',    tone: 'ok',     label: 'Invitation acceptée' },
  STAFF_REFUSED:         { icon: 'close',    tone: 'bad',    label: 'Invitation refusée' },
}

const DEFAULT_TYPE: NotificationType = { icon: 'bell', tone: 'accent', label: 'Notification' }

export const notificationType = (type: string) => NOTIFICATION_TYPES[type] || DEFAULT_TYPE

/** Picto d'une notification, dans un rond discret de la taille d'un avatar. */
export function NotificationIcon({ type, box = 32 }: { type: string; box?: number }) {
  const cfg = notificationType(type)
  return (
    <span style={{ width: box, height: box }} className="grid shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03]">
      <LsIcon name={cfg.icon} tone={cfg.tone} size={Math.round(box * 0.56)} />
    </span>
  )
}
