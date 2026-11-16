'use client'

/**
 * Liste déroulante aux couleurs du site (à la place du menu natif du navigateur).
 * Bouton arrondi + liste qui s'ouvre en dessous, coche sur le choix actuel ; clavier : flèches, Entrée, Échap.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type DropdownOption<T extends string> = { value: T; label: string; hint?: string }

export default function Dropdown<T extends string>({ value, options, onChange, label, icon, className = '', disabled }: {
  value: T
  options: DropdownOption<T>[]
  onChange: (value: T) => void
  /** Texte lu par les lecteurs d'écran */
  label: string
  icon?: React.ReactNode
  className?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = options.find(o => o.value === value) ?? options[0]

  // Fermer au clic à côté
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const choose = (v: T) => { onChange(v); setOpen(false) }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return }
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault(); setActive(Math.max(0, options.findIndex(o => o.value === value))); setOpen(true); return
    }
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(options.length - 1, i + 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(0, i - 1)) }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(options[active].value) }
  }

  return (
    <div ref={root} className={`relative ${className}`} onKeyDown={onKey}>
      <button type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-label={label}
        onClick={() => { setActive(Math.max(0, options.findIndex(o => o.value === value))); setOpen(o => !o) }}
        className={`flex h-10 w-full items-center gap-2 rounded-xl border px-3.5 text-left text-sm text-white transition disabled:opacity-50 ${open ? 'border-accent/60 bg-accent/10' : 'border-white/10 bg-white/[0.04] hover:border-white/20'}`}>
        {icon && <span className="shrink-0 text-white/50">{icon}</span>}
        <span className="min-w-0 flex-1 truncate">{current?.label}</span>
        <ChevronDown size={15} className={`shrink-0 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul id={listId} role="listbox" aria-label={label}
          className="absolute left-0 z-50 mt-1.5 min-w-full overflow-hidden rounded-xl border border-white/12 bg-surface-2 p-1 shadow-[0_18px_40px_rgba(0,0,0,.55)]">
          {options.map((o, i) => {
            const selected = o.value === value
            return (
              <li key={o.value} role="option" aria-selected={selected}>
                <button type="button" onClick={() => choose(o.value)} onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm transition ${i === active ? 'bg-white/[0.06] text-white' : 'text-white/75'}`}>
                  <span className="min-w-0 flex-1">
                    <span className={`block ${selected ? 'font-semibold text-white' : ''}`}>{o.label}</span>
                    {o.hint && <span className="block text-xs text-white/40">{o.hint}</span>}
                  </span>
                  {selected && <Check size={15} className="shrink-0 text-accent-light" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
