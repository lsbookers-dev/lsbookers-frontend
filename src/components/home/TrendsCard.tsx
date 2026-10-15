'use client'

import { useState } from 'react'
import CityAutocomplete from '@/components/CityAutocomplete'
import LsIcon from '@/components/ui/LsIcon'
import type { TrendCriterion } from './types'
import { TREND_CRITERIA, useTrends, type TrendRole } from './trends'
import TrendsList from './TrendsList'
import TrendsModal from './TrendsModal'

/**
 * Bloc « Tendances » de la colonne de droite : 4 classements (recherchés, visités, bookés, aimés),
 * les 5 premiers, et « Voir plus » pour le classement complet par spécialité.
 */
export default function TrendsCard({ title, role }: { title: string; role: TrendRole }) {
  const [criterion, setCriterion] = useState<TrendCriterion>('views')
  const [city, setCity] = useState('')
  const [open, setOpen] = useState(false)
  const { items, loading } = useTrends(role, criterion, { city, limit: 5 })

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <LsIcon name="bolt" size={15} tone="gold" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/80">{title}</span>
        </div>
        {/* Largeur fixe, et passe sous le titre si la carte est étroite (iPad) */}
        <div className="w-24 shrink-0">
          <CityAutocomplete
            value={city}
            onChange={setCity}
            placeholder="Ville…"
            showDepartment={false}
            dropdownMinWidth={0}
            inputClassName="bg-white/5 border border-white/10 text-white/70 text-xs rounded-lg px-2 py-1 w-full placeholder:text-white/25 focus:outline-none focus:border-accent/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 px-3 pt-3" role="tablist" aria-label={`Classements ${title}`}>
        {TREND_CRITERIA.map(c => (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={criterion === c.key}
            onClick={() => setCriterion(c.key)}
            className={`flex items-center justify-center gap-1.5 truncate rounded-lg px-1 py-1.5 text-[11px] font-medium transition ${criterion === c.key ? 'bg-accent/20 text-white' : 'text-white/45 hover:bg-white/5 hover:text-white/75'}`}
          >
            <LsIcon name={c.icon} size={13} tone="inherit" />
            {c.label}
          </button>
        ))}
      </div>

      <TrendsList items={items} loading={loading} criterion={criterion} role={role} />

      <div className="border-t border-white/8 px-4 py-3">
        <button type="button" onClick={() => setOpen(true)} className="text-xs text-accent-light transition-colors hover:text-white">
          Voir plus →
        </button>
      </div>

      {open && <TrendsModal title={title} role={role} initialCriterion={criterion} initialCity={city} onClose={() => setOpen(false)} />}
    </div>
  )
}
