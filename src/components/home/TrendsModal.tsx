'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import LsIcon from '@/components/ui/LsIcon'
import type { TrendCriterion } from './types'
import { TREND_CRITERIA, trendCriterion, useTrends, type TrendRole } from './trends'
import TrendsList from './TrendsList'

/** Fenêtre « Voir plus » : classement complet, filtrable par spécialité. */
export default function TrendsModal({ title, role, initialCriterion, initialCity, onClose }: {
  title: string
  role: TrendRole
  initialCriterion: TrendCriterion
  initialCity: string
  onClose: () => void
}) {
  const [criterion, setCriterion] = useState<TrendCriterion>(initialCriterion)
  const [specialty, setSpecialty] = useState('')
  const shown = useTrends(role, criterion, { city: initialCity, specialty, limit: 30 })
  // Puces : spécialités du classement complet (sans filtre), gardées pendant qu'on filtre
  const [specialties, setSpecialties] = useState<string[]>([])
  useEffect(() => {
    if (!specialty && !shown.loading) setSpecialties(shown.specialties)
  }, [specialty, shown.loading, shown.specialties])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  // Changer de classement repart de « Toutes » (les spécialités présentes ne sont pas les mêmes)
  const pickCriterion = (key: TrendCriterion) => { setCriterion(key); setSpecialty('') }

  const current = trendCriterion(criterion)

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${title} — ${current.title}`}
        onClick={e => e.stopPropagation()}
        className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-surface shadow-2xl sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-white/45">
              <LsIcon name="bolt" size={13} tone="gold" /> {title}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">{current.title}</h2>
            <p className="text-[11px] text-white/40">
              Sur les {shown.periodDays} derniers jours{initialCity ? ` · ${initialCity}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-white/60 transition hover:bg-white/10 hover:text-white">
            <X size={16} />
          </button>
        </header>

        <div className="grid grid-cols-4 gap-1 px-4 pt-3" role="tablist" aria-label="Classements">
          {TREND_CRITERIA.map(c => (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={criterion === c.key}
              onClick={() => pickCriterion(c.key)}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-1 py-2 text-[11px] font-medium transition ${criterion === c.key ? 'bg-accent/20 text-white' : 'text-white/45 hover:bg-white/5 hover:text-white/75'}`}
            >
              <LsIcon name={c.icon} size={14} tone="inherit" className="hidden sm:block" />
              {c.label}
            </button>
          ))}
        </div>

        {specialties.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto px-4 pb-1 pt-3 [scrollbar-width:none]">
            {['', ...specialties].map(s => (
              <button
                key={s || 'all'}
                type="button"
                onClick={() => setSpecialty(s)}
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] transition ${specialty === s ? 'border-accent/50 bg-accent/20 text-white' : 'border-white/10 text-white/50 hover:text-white/80'}`}
              >
                {s || 'Toutes'}
              </button>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          <TrendsList items={shown.items} loading={shown.loading} criterion={criterion} role={role} rows={10} onNavigate={onClose} />
        </div>
      </div>
    </div>
  )
}
