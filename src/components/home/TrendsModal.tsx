'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import LsIcon from '@/components/ui/LsIcon'
import { SPECIALTIES_BY_ROLE } from '@/constants/specialties'
import { useTrends, type TrendRole } from './trends'
import TrendsList from './TrendsList'
import SpecialtyPicker from './SpecialtyPicker'

/** Fenêtre « Voir plus » : classement complet, avec un menu déroulant de toutes les spécialités du rôle. */
export default function TrendsModal({ title, role, initialCity, onClose }: {
  title: string
  role: TrendRole
  initialCity: string
  onClose: () => void
}) {
  const [specialty, setSpecialty] = useState('')
  const shown = useTrends(role, { city: initialCity, specialty, limit: 30 })
  const specialties = SPECIALTIES_BY_ROLE[role] ?? []

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
        className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-surface shadow-2xl sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <LsIcon name="bolt" size={17} tone="gold" /> {title}
            </h2>
            <p className="mt-1 text-[11px] text-white/40">
              Sur les {shown.periodDays} derniers jours{initialCity ? ` · ${initialCity}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-white/60 transition hover:bg-white/10 hover:text-white">
            <X size={16} />
          </button>
        </header>

        <div className="px-4 pt-3">
          <SpecialtyPicker value={specialty} options={specialties} onChange={setSpecialty} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          <TrendsList
            items={shown.items}
            loading={shown.loading}
            role={role}
            rows={10}
            emptyText={specialty ? `Personne en tendance en « ${specialty} » pour l’instant` : undefined}
            onNavigate={onClose}
          />
        </div>
      </div>
    </div>
  )
}
