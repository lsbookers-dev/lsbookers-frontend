/** Classements « Tendances » : libellés et chargement. */
import { useEffect, useState } from 'react'
import { apiFetch } from '@/utils/auth'
import type { LsIconName } from '@/components/ui/LsIcon'
import type { TrendCriterion, TrendItem } from './types'
import { API_BASE } from './format'

export const TREND_CRITERIA: { key: TrendCriterion; label: string; title: string; icon: LsIconName; unit: (n: number) => string }[] = [
  { key: 'search',   label: 'Recherchés', title: 'Les plus recherchés', icon: 'search',  unit: n => (n > 1 ? 'recherches' : 'recherche') },
  { key: 'views',    label: 'Visités',    title: 'Les plus visités',    icon: 'user',    unit: n => (n > 1 ? 'visites' : 'visite') },
  { key: 'bookings', label: 'Bookés',     title: 'Les plus bookés',     icon: 'booking', unit: n => (n > 1 ? 'bookings' : 'booking') },
  { key: 'likes',    label: 'Aimés',      title: 'Les plus aimés',      icon: 'heart',   unit: () => 'J’aime' },
]

export const trendCriterion = (key: TrendCriterion) => TREND_CRITERIA.find(c => c.key === key) ?? TREND_CRITERIA[0]

export type TrendRole = 'ARTIST' | 'PROVIDER'

type TrendsState = { items: TrendItem[]; specialties: string[]; periodDays: number; loading: boolean }

/** Charge un classement ; `city` est attendu une demi-seconde (saisie au clavier). */
export function useTrends(role: TrendRole, criterion: TrendCriterion, { city = '', specialty = '', limit = 5 } = {}) {
  const [state, setState] = useState<TrendsState>({ items: [], specialties: [], periodDays: 30, loading: true })

  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, loading: true }))
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ role, criterion, limit: String(limit) })
      if (city) params.set('city', city)
      if (specialty) params.set('specialty', specialty)
      try {
        const res = await apiFetch(`${API_BASE}/api/home/trends?${params}`)
        const data = res.ok ? await res.json() : null
        if (!cancelled) setState({
          items: data?.items ?? [],
          specialties: data?.specialties ?? [],
          periodDays: data?.periodDays ?? 30,
          loading: false,
        })
      } catch {
        if (!cancelled) setState(s => ({ ...s, items: [], loading: false }))
      }
    }, city ? 500 : 0)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [role, criterion, city, specialty, limit])

  return state
}
