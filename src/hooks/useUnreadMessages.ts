/**
 * Nombre de messages non lus (pastille de « Messages » dans le bandeau gauche).
 * Vient du compteur partagé des pastilles (useUnreadCounts).
 */
import { useUnreadCounts } from './useUnreadCounts'

export function useUnreadMessages() {
  return useUnreadCounts().messages
}
