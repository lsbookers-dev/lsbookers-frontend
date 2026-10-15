/** Petits formats de la page d'accueil. */

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  return `Il y a ${d}j`
}

export function roleLabel(role: string | null): string {
  if (role === 'ARTIST')    return 'Artiste'
  if (role === 'ORGANIZER') return 'Organisateur'
  if (role === 'PROVIDER')  return 'Prestataire'
  return ''
}

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
