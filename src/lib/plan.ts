'use client'

/**
 * Compte Gratuit / Pro du membre connecté (GET /api/billing/me), partagé par tout le site.
 *   const { plan, isPro, refresh } = usePlan()
 * Les limites sont vérifiées par le serveur ; le site s'en sert pour griser et expliquer.
 */
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'

export type PlanLimits = {
  applicationsPerMonth: number
  bookingRequestsPerMonth: number
  activeEvents: number
  activeOffers: number
  albums: number
  videos: number
  videoMaxSeconds: number
}

export type PlanInfo = {
  isPro: boolean
  role: string
  paymentsAvailable: boolean
  subscription: null | {
    status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'
    interval: 'MONTH' | 'YEAR' | 'LIFETIME'
    source: 'STRIPE' | 'FOUNDER' | 'ADMIN'
    priceCents: number
    trialEndsAt: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    promoCode: string | null
    startDate: string
  }
  trialAvailable: boolean
  trialDays: number
  prices: { monthCents: number; yearCents: number } | null
  allPrices: Record<string, { monthCents: number; yearCents: number }>
  commission: { freePct: number; proPct: number }
  limits: PlanLimits
  usage: Partial<Record<keyof PlanLimits, number>> | null
  /** Formule choisie à l'inscription, pas encore finalisée */
  signupPlan: null | { plan: 'FREE' | 'PRO'; interval: 'MONTH' | 'YEAR'; promoCode: string | null }
}

let cache: PlanInfo | null = null
let inflight: Promise<PlanInfo | null> | null = null
const listeners = new Set<(p: PlanInfo | null) => void>()

async function load(force = false): Promise<PlanInfo | null> {
  if (cache && !force) return cache
  if (inflight && !force) return inflight
  inflight = apiFetch(apiUrl('billing/me'), { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((data: PlanInfo | null) => {
      cache = data
      inflight = null
      listeners.forEach(fn => fn(data))
      return data
    })
  return inflight
}

/** À appeler après un changement (abonnement, code Fondateur…) */
export const refreshPlan = () => load(true)

export function usePlan() {
  const [plan, setPlan] = useState<PlanInfo | null>(cache)
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    const onChange = (p: PlanInfo | null) => { setPlan(p); setLoading(false) }
    listeners.add(onChange)
    load().then(onChange)
    return () => { listeners.delete(onChange) }
  }, [])

  const refresh = useCallback(() => load(true), [])
  return { plan, isPro: !!plan?.isPro, loading, refresh }
}

export const euros = (cents: number, decimals = true) =>
  (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: decimals ? 2 : 0, maximumFractionDigits: 2 })

/** Prix lisible : 11,99 € ou 199 € (sans centimes inutiles) */
export const price = (cents: number) => euros(cents, cents % 100 !== 0)

/** Durée d'une vidéo choisie (en secondes), lue avant l'envoi */
export function readVideoDuration(file: File): Promise<number | null> {
  return new Promise(resolve => {
    try {
      const url = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.preload = 'metadata'
      const done = (value: number | null) => { URL.revokeObjectURL(url); resolve(value) }
      video.onloadedmetadata = () => done(Number.isFinite(video.duration) ? video.duration : null)
      video.onerror = () => done(null)
      video.src = url
    } catch {
      resolve(null)
    }
  })
}
