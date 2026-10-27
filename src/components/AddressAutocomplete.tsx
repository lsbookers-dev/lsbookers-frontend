'use client'

/**
 * Champ adresse avec propositions — Base Adresse Nationale (service public gratuit,
 * data.geopf.fr/geocodage, successeur d'api-adresse.data.gouv.fr).
 * Choisir une proposition remplit aussi le code postal et la ville.
 * La liste est affichée dans <body> (portail) pour ne pas être coupée par une fenêtre.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type AddressChoice = { address: string; postalCode: string; city: string; latitude: number | null; longitude: number | null }
type Feature = { properties: { label: string; name: string; postcode?: string; city?: string }; geometry?: { coordinates?: [number, number] } }

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder, className, ariaLabel = 'Adresse' }: {
  value: string
  onChange: (value: string) => void
  onSelect: (choice: AddressChoice) => void
  placeholder?: string
  className?: string
  ariaLabel?: string
}) {
  const [items, setItems] = useState<Feature[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const place = useCallback(() => {
    const r = inputRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.bottom + 4, left: r.left, width: r.width })
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 4) { setItems([]); setOpen(false); return }
    try {
      const res = await fetch(`https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(q.trim())}&autocomplete=1&limit=6&index=address`)
      if (!res.ok) return
      const data = await res.json()
      const features: Feature[] = data.features || []
      setItems(features)
      setActive(-1)
      if (features.length) { place(); setOpen(true) } else setOpen(false)
    } catch {
      setItems([])
      setOpen(false)
    }
  }, [place])

  const choose = (f: Feature) => {
    const [lon, lat] = f.geometry?.coordinates || []
    onSelect({
      address: f.properties.name,
      postalCode: f.properties.postcode || '',
      city: f.properties.city || '',
      latitude: typeof lat === 'number' ? lat : null,
      longitude: typeof lon === 'number' ? lon : null,
    })
    setItems([])
    setOpen(false)
  }

  // Fermer au clic ailleurs ; suivre le champ quand on fait défiler
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!inputRef.current?.contains(t) && !t.closest('[data-address-dropdown="true"]')) setOpen(false)
    }
    window.addEventListener('mousedown', close)
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, place])

  return (
    <>
      <input
        ref={inputRef}
        value={value}
        onChange={e => {
          onChange(e.target.value)
          if (timer.current) clearTimeout(timer.current)
          const q = e.target.value
          timer.current = setTimeout(() => search(q), 300)
        }}
        onKeyDown={e => {
          if (!open) return
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, items.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
          else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(items[active]) }
          else if (e.key === 'Escape') setOpen(false)
        }}
        maxLength={200}
        autoComplete="off"
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="address-suggestions"
        className={className}
      />
      {mounted && open && pos && createPortal(
        <ul id="address-suggestions" data-address-dropdown="true" role="listbox"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: Math.max(pos.width, 260), zIndex: 400 }}
          className="max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#1a1824] p-1 shadow-2xl">
          {items.map((f, i) => (
            <li key={`${f.properties.label}-${i}`} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={e => { e.preventDefault(); choose(f) }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${i === active ? 'bg-violet-500/20 text-white' : 'text-white/80 hover:bg-white/[0.06]'}`}>
                {f.properties.name}
                <span className="block text-xs text-white/45">{[f.properties.postcode, f.properties.city].filter(Boolean).join(' ')}</span>
              </button>
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </>
  )
}
