/**
 * Mise en forme des notifications, commune à la cloche et à la page (choix A1 + B2 d'Antho, 04/11/2026) :
 * rangement par jour, regroupement des J'aime et des abonnés, bouton d'action principal.
 */

export type FeedNotif = {
  id: number
  type: string
  content: string
  read: boolean
  createdAt: string
  actor?: { id: number; name?: string | null; avatar?: string | null; role?: string | null } | null
  conversationId?: number | null
  offerId?: number | null
  publicationId?: number | null
  staffId?: number | null
  eventId?: number | null
  staffStatus?: string | null
}

/** Une ligne affichée : une notification, ou plusieurs regroupées (« Mika et 4 autres ont aimé… ») */
export type FeedItem = {
  key: string
  lead: FeedNotif
  ids: number[]
  count: number
  text: string
  read: boolean
}

export type FeedSection = { label: string; items: FeedItem[] }

const DAY = 24 * 3600 * 1000

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function dayLabel(iso: string, now = new Date()): string {
  const diff = Math.round((startOfDay(now) - startOfDay(new Date(iso))) / DAY)
  if (diff <= 0) return 'Aujourd’hui'
  if (diff === 1) return 'Hier'
  if (diff < 7) return 'Cette semaine'
  return 'Plus ancien'
}

/** « il y a 5 min », « il y a 3 h », puis « lundi », puis « 28 oct. » */
export function shortTime(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const min = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (min < 1) return 'à l’instant'
  if (min < 60) return `il y a ${min} min`
  if (min < 24 * 60 && startOfDay(d) === startOfDay(now)) return `il y a ${Math.floor(min / 60)} h`
  const days = Math.round((startOfDay(now) - startOfDay(d)) / DAY)
  if (days === 1) return `hier, ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  if (days < 7) return d.toLocaleDateString('fr-FR', { weekday: 'long' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' })
}

const others = (n: number) => (n === 1 ? '1 autre' : `${n} autres`)

/** Clé de regroupement : J'aime d'une même publication, ou nouveaux abonnés, dans un même jour */
function groupKey(n: FeedNotif, section: string): string | null {
  if (n.type === 'NEW_LIKE' && n.publicationId) return `like:${n.publicationId}:${section}`
  if (n.type === 'NEW_FOLLOW') return `follow:${section}`
  return null
}

function groupText(lead: FeedNotif, count: number): string {
  if (count <= 1) return lead.content
  const name = lead.actor?.name || 'Quelqu’un'
  if (lead.type === 'NEW_LIKE') return `${name} et ${others(count - 1)} ont aimé votre publication.`
  return `${name} et ${others(count - 1)} vous suivent maintenant.`
}

/** Range la liste (déjà triée du plus récent au plus ancien) par jour, en regroupant ce qui peut l'être */
export function buildFeed(list: FeedNotif[], now = new Date()): FeedSection[] {
  const sections: FeedSection[] = []
  const groups = new Map<string, { item: FeedItem; members: FeedNotif[] }>()
  for (const n of list) {
    const label = dayLabel(n.createdAt, now)
    let section = sections.at(-1)
    if (!section || section.label !== label) {
      section = { label, items: [] }
      sections.push(section)
    }
    const key = groupKey(n, label)
    const existing = key ? groups.get(key) : undefined
    if (existing) {
      existing.members.push(n)
      existing.item.ids.push(n.id)
      existing.item.count++
      existing.item.read = existing.item.read && n.read
      existing.item.text = groupText(existing.item.lead, existing.item.count)
      continue
    }
    const item: FeedItem = { key: key || `n:${n.id}`, lead: n, ids: [n.id], count: 1, text: n.content, read: n.read }
    section.items.push(item)
    if (key) groups.set(key, { item, members: [n] })
  }
  return sections
}

/** Bouton mis en avant sous la notification (le clic mène au même endroit que la ligne) */
const PRIMARY_ACTION: Record<string, string> = {
  BOOKING_REQUEST: 'Voir la demande',
  BOOKING_APPROVAL_NEEDED: 'Voir la demande',
  CANCELLATION_REQUEST: 'Répondre',
  NEW_APPLICATION: 'Voir la candidature',
  NEW_OFFER: 'Voir l’offre',
  OFFER_TO_CLOSE: 'Clôturer l’offre',
  NEW_REVIEW: 'Répondre',
  REVIEW_AVAILABLE: 'Laisser un avis',
  BOOKING_PAYMENT_FAILED: 'Voir le paiement',
  NEW_DEVICE_LOGIN: 'Voir mes appareils',
  MANAGEMENT_INVITE: 'Voir l’invitation',
}

export const primaryAction = (type: string) => PRIMARY_ACTION[type] || null

/** Sépare le nom de la personne du reste du texte, pour l'écrire en gras */
export function splitActor(text: string, name?: string | null): [string, string] {
  if (name && text.startsWith(name)) return [name, text.slice(name.length)]
  return ['', text]
}
