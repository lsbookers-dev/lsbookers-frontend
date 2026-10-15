/** Classements « Tendances » : un seul classement par rôle, tous les critères mélangés en points. */
import { useEffect, useState } from 'react'
import { apiFetch } from '@/utils/auth'
import type { TrendItem } from './types'
import { API_BASE } from './format'

export type TrendRole = 'ARTIST' | 'PROVIDER'

type TrendsState = { items: TrendItem[]; specialties: string[]; periodDays: number; loading: boolean }

/** Charge un classement ; `city` est attendu une demi-seconde (saisie au clavier). */
export function useTrends(role: TrendRole, { city = '', specialty = '', limit = 5 } = {}) {
  const [state, setState] = useState<TrendsState>({ items: [], specialties: [], periodDays: 30, loading: true })

  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, loading: true }))
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ role, limit: String(limit) })
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
  }, [role, city, specialty, limit])

  return state
}
