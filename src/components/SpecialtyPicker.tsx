'use client'
// SpecialtyPicker.tsx — Choix d'une spécialité avec recherche, au style des formulaires du site
// (remplace le <select> natif, que Safari affiche avec son propre style)

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function SpecialtyPicker({
  value, options, onChange, placeholder = 'Choisir une spécialité', className = '',
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return q ? options.filter(o => normalize(o).includes(q)) : options
  }, [options, query])

  // Fermer au clic à l'extérieur ou avec Échap
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) } }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    searchRef.current?.focus()
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const pick = (o: string) => { onChange(o); setOpen(false); setQuery('') }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center justify-between gap-2 text-left ${className} ${open ? 'border-violet-400/40 ring-2 ring-violet-500/15' : ''}`}
      >
        <span className={value ? 'text-white' : 'text-white/25'}>{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-violet-400/20 bg-[#12111c] shadow-2xl shadow-violet-950/40">
          <div className="relative border-b border-white/[0.07] p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-violet-200/45" aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && filtered[0]) { e.preventDefault(); pick(filtered[0]) } }}
              placeholder="Rechercher (DJ, photographe…)"
              className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-8 pr-3 text-sm text-white placeholder-white/30 outline-none focus:border-violet-400/40"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-center text-xs text-white/35">Aucune spécialité trouvée</li>
            )}
            {filtered.map(o => (
              <li key={o} role="option" aria-selected={o === value}>
                <button
                  type="button"
                  onClick={() => pick(o)}
                  className={`flex min-h-10 w-full items-center justify-between gap-2 px-3 text-left text-sm transition-colors ${
                    o === value ? 'bg-violet-500/15 text-violet-100' : 'text-white/75 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  {o}
                  {o === value && <Check className="h-4 w-4 text-violet-300" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
