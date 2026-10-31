'use client'

// Éléments communs de l'admin (refonte du 31/10/2026, charte « Violet & or ») :
// titres de page, cartes, sous-onglets, chiffres, états vides. Toutes les pages de l'admin s'en servent
// pour avoir la même largeur, les mêmes titres et les mêmes couleurs.

import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

export const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export const INPUT = 'w-full rounded-xl border border-line bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 [color-scheme:dark] focus:border-accent/50 focus:outline-none'
export const CARD = 'rounded-2xl border border-line bg-surface p-5'
export const BTN = 'rounded-xl bg-accent-strong px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent disabled:opacity-40'
export const BTN2 = 'rounded-xl border border-white/12 px-4 py-2 text-xs text-white/80 transition hover:bg-white/[0.06] disabled:opacity-40'
export const BTN_DANGER = 'rounded-xl border border-red-400/30 px-4 py-2 text-xs text-red-300 transition hover:bg-red-500/10 disabled:opacity-40'

export const ROLE_LABEL: Record<string, string> = { ARTIST: 'Artiste', ORGANIZER: 'Organisateur', PROVIDER: 'Prestataire', ADMIN: 'Admin' }
export const money = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
export const fmtDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')
export const fmtDateTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function SubTabs<T extends string>({ tabs, value, onChange }: {
  tabs: { key: T; label: string; badge?: number }[]
  value: T
  onChange: (key: T) => void
}) {
  return (
    <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map(t => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition ${
            value === t.key ? 'border-accent text-white' : 'border-transparent text-muted hover:text-white'
          }`}
        >
          {t.label}
          {!!t.badge && <Badge value={t.badge} />}
        </button>
      ))}
    </div>
  )
}

/** Pastille or : quelque chose attend une action */
export function Badge({ value }: { value: number }) {
  return (
    <span className="min-w-[20px] rounded-full bg-gold px-1.5 text-center text-[11px] font-semibold leading-5 text-[#2a1f08]">
      {value > 99 ? '99+' : value}
    </span>
  )
}

export function Kpi({ label, value, sub, gold }: { label: string; value: string; sub?: string; gold?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${gold ? 'text-gold' : 'text-white'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  )
}

export function Spinner() {
  return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
}

export function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-line py-10 text-center text-sm text-muted">{text}</p>
}

export function ErrorBox({ text }: { text: string }) {
  return <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{text}</div>
}

/** Pastille de formule : Gratuit, Pro, Business (or = valeur) */
export function PlanTag({ plan, source }: { plan: 'FREE' | 'PRO' | 'BUSINESS'; source?: string | null }) {
  if (plan === 'FREE') return <span className="rounded-md bg-white/8 px-2 py-0.5 text-[11px] text-white/60">Gratuit</span>
  const extra = source === 'ADMIN' ? ' offert' : source === 'FOUNDER' ? ' fondateur' : ''
  return <span className="rounded-md bg-gold/15 px-2 py-0.5 text-[11px] text-gold-light">{plan === 'PRO' ? 'Pro' : 'Business'}{extra}</span>
}
