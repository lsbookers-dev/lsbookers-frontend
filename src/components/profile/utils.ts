import type { ProfileData, ProfileRole } from './types'

export const isProfileRole = (role?: string | null): role is ProfileRole =>
  role === 'ARTIST' || role === 'ORGANIZER' || role === 'PROVIDER'

export const publicProfileHref = (role: string | null | undefined, userId: number | string) =>
  isProfileRole(role) ? `/${role.toLowerCase()}/${userId}` : null

/**
 * Nom affiché : pseudo, ou « prénom nom » si la personne l'a choisi.
 * (Le profil public ne reçoit déjà que l'un des deux depuis l'API.)
 */
export function profileName(profile?: ProfileData | null) {
  const u = profile?.user
  if (!u) return 'Profil LS Bookers'
  const realName = [u.firstName, u.lastName].filter(Boolean).join(' ')
  if (profile?.showRealName && realName) return realName
  return u.pseudo || realName || 'Profil LS Bookers'
}

/** Activité affichée sous le nom (saisie par la personne, jamais le rôle technique). */
export const profileActivity = (profile: ProfileData) =>
  profile.profession || profile.typeEtablissement || ''

export function youtubeEmbedUrl(url?: string | null) {
  const value = url?.trim()
  if (!value) return null
  const youtube = value.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/)
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`
  const vimeo = value.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

export function soundcloudEmbedUrl(url?: string | null) {
  const value = url?.trim()
  if (!value) return null
  if (value.includes('w.soundcloud.com/player/')) return value
  if (!/soundcloud\.com\//.test(value)) return null
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(value)}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true`
}

export const SOCIAL_FIELDS = [
  { key: 'instagramUrl', label: 'Instagram', placeholder: 'instagram.com/…' },
  { key: 'tiktokUrl', label: 'TikTok', placeholder: 'tiktok.com/@…' },
  { key: 'facebookUrl', label: 'Facebook', placeholder: 'facebook.com/…' },
  { key: 'twitterUrl', label: 'X / Twitter', placeholder: 'x.com/…' },
  { key: 'linkedinUrl', label: 'LinkedIn', placeholder: 'linkedin.com/in/…' },
  { key: 'websiteUrl', label: 'Site web', placeholder: 'monsite.com' },
] as const

export type SocialKey = typeof SOCIAL_FIELDS[number]['key']

export const socialLinks = (profile: ProfileData) =>
  SOCIAL_FIELDS
    .map(field => ({ ...field, url: profile[field.key]?.trim() || '' }))
    .filter(field => field.url)

/** Libellés propres à chaque rôle (aucune mention du rôle lui-même). */
export const ROLE_TEXT: Record<ProfileRole, {
  about: string
  publications: string
  fees: string
  activityLabel: string
  activityPlaceholder: string
  accent: 'pink' | 'violet' | 'blue'
}> = {
  ARTIST: { about: 'À propos', publications: 'Publications', fees: 'Tarifs', activityLabel: 'Activité artistique', activityPlaceholder: 'Ex : DJ, chanteuse, groupe…', accent: 'violet' },
  ORGANIZER: { about: 'Description', publications: 'Publications', fees: 'Tarifs', activityLabel: 'Type d’établissement', activityPlaceholder: 'Ex : club, festival, agence…', accent: 'violet' },
  PROVIDER: { about: 'Description', publications: 'Réalisations', fees: 'Prestations & tarifs', activityLabel: 'Métier', activityPlaceholder: 'Ex : photographe, traiteur…', accent: 'violet' },
}
