import 'server-only'

import type { Metadata } from 'next'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.lsbookers.com').replace(/\/$/, '')

type PublicProfile = {
  bio?: string | null
  avatar?: string | null
  location?: string | null
  profession?: string | null
  specialties?: string[]
  showRealName?: boolean
  user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null }
}

/** Titre, description et image d'aperçu d'un profil public (artiste, organisateur, prestataire) */
export async function profileMetadata(userId: string, fallbackTitle: string): Promise<Metadata> {
  if (!/^\d+$/.test(userId)) return { title: fallbackTitle }
  try {
    const res = await fetch(`${API_BASE}/api/profile/user/${userId}`, { next: { revalidate: 300 } })
    if (!res.ok) return { title: fallbackTitle }
    const data = await res.json()
    const p: PublicProfile = data?.profile ?? data
    const realName = [p.user?.firstName, p.user?.lastName].filter(Boolean).join(' ')
    const name = (p.showRealName && realName) || p.user?.pseudo || fallbackTitle
    const activity = p.profession || p.specialties?.slice(0, 3).join(', ')
    const description =
      p.bio?.trim().slice(0, 200) ||
      [activity, p.location].filter(Boolean).join(' · ') ||
      `Profil de ${name} sur LS Bookers`

    return {
      title: name,
      description,
      openGraph: {
        type: 'profile',
        title: `${name} · LS Bookers`,
        description,
        ...(p.avatar ? { images: [{ url: p.avatar, alt: name }] } : {}),
      },
      twitter: {
        card: p.avatar ? 'summary' : 'summary_large_image',
        title: `${name} · LS Bookers`,
        description,
        ...(p.avatar ? { images: [p.avatar] } : {}),
      },
    }
  } catch {
    return { title: fallbackTitle }
  }
}
