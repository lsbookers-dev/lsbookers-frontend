// messages/_helpers.tsx — Constantes, icônes et fonctions utilitaires

import { Music2, Building2, Wrench } from 'lucide-react'
import type { Role } from './types'

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export const toAbs = (u?: string | null) => {
  if (!u) return '/default-avatar.png'
  if (u.startsWith('http') || u.startsWith('//')) return u
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

export const ROLE_LABEL: Record<Role, string> = {
  ARTIST: 'Artiste', ORGANIZER: 'Organisateur', PROVIDER: 'Prestataire',
}
export const ROLE_COLOR: Record<Role, string> = {
  ARTIST: 'text-pink-400', ORGANIZER: 'text-blue-400', PROVIDER: 'text-violet-400',
}
export const ROLE_ICON: Record<Role, React.ElementType> = {
  ARTIST: Music2, ORGANIZER: Building2, PROVIDER: Wrench,
}

export function formatTime(date: string) {
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export function formatMessageTime(date: string) {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function getHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}
