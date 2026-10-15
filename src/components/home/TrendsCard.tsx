'use client'

import { useState } from 'react'
import CityAutocomplete from '@/components/CityAutocomplete'
import LsIcon from '@/components/ui/LsIcon'
import { useTrends, type TrendRole } from './trends'
import TrendsList from './TrendsList'
import TrendsModal from './TrendsModal'

/**
 * Bloc « Tendances » de la colonne de droite : un seul classement (bookings, recherches, visites
 * et J'aime mélangés en points), les 5 premiers, et « Voir plus » pour le classement par spécialité.
 */
export default function TrendsCard({ title, role }: { title: string; role: TrendRole }) {
  const [city, setCity] = useState('')
  const [open, setOpen] = useState(false)
  const { items, loading } = useTrends(role, { city, limit: 5 })

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

      <TrendsList items={items} loading={loading} role={role} />

      <div className="border-t border-white/8 px-4 py-3">
        <button type="button" onClick={() => setOpen(true)} className="text-xs text-accent-light transition-colors hover:text-white">
          Voir plus →
        </button>
      </div>

      {open && <TrendsModal title={title} role={role} initialCity={city} onClose={() => setOpen(false)} />}
    </div>
  )
}
