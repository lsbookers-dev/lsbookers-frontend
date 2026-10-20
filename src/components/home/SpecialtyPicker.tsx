'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

/**
 * Menu déroulant des spécialités de la fenêtre « Voir plus » (remplace le menu natif du navigateur,
 * qui s'ouvrait sur tout l'écran dans Safari). La liste s'ouvre dans la fenêtre, défile toute seule
 * et se filtre en tapant quelques lettres.
 */
export default function SpecialtyPicker({ value, options, onChange }: {
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Fermeture au clic en dehors
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    setQuery('')
    // Curseur dans la recherche sur ordinateur seulement (sur téléphone, le clavier cacherait la liste)
    if (window.matchMedia('(pointer: fine)').matches) searchRef.current?.focus({ preventScroll: true })
  }, [open])

  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const filtered = query ? options.filter(o => normalize(o).includes(normalize(query))) : options

  const pick = (next: string) => { onChange(next); setOpen(false) }

  const item = (label: string, itemValue: string) => (
    <li key={itemValue || 'all'}>
      <button
        type="button"
        onClick={() => pick(itemValue)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${value === itemValue ? 'bg-accent/20 text-white' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}
      >
        <span className="truncate">{label}</span>
        {value === itemValue && <Check size={14} className="shrink-0 text-accent-light" />}
      </button>
    </li>
  )

  return (
    <div
      ref={rootRef}
      // Échap ferme d'abord la liste (sans fermer la fenêtre)
      onKeyDown={e => { if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false) } }}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white/[0.04] py-2.5 pl-3.5 pr-3 text-left text-sm text-white transition ${open ? 'border-accent/45' : 'border-white/10 hover:border-white/20'}`}
      >
        <span className="truncate">{value || 'Toutes les spécialités'}</span>
        <ChevronDown size={16} className={`shrink-0 text-white/45 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-surface-2">
          <div className="relative border-b border-white/8">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher une spécialité…"
              className="w-full bg-transparent py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto overscroll-contain p-1.5">
            {!query && item('Toutes les spécialités', '')}
            {filtered.map(o => item(o, o))}
            {filtered.length === 0 && <li className="px-3 py-3 text-center text-xs text-white/40">Aucune spécialité trouvée</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
