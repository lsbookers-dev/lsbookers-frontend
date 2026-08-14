'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

type Commune = {
  nom: string
  departement?: { nom: string; code: string }
}

type DropdownPos = { top: number; left: number; width: number }

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  required?: boolean
  id?: string
  name?: string
}

/**
 * Champ ville avec autocomplétion — API gratuite geo.api.gouv.fr (communes françaises).
 * Le dropdown est rendu via un Portal dans <body> pour éviter les problèmes
 * d'overflow-hidden sur les containers parents.
 */
export default function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Ville…',
  className,
  inputClassName,
  required,
  id,
  name,
}: Props) {
  const [suggestions, setSuggestions]   = useState<Commune[]>([])
  const [open, setOpen]                 = useState(false)
  const [loading, setLoading]           = useState(false)
  const [activeIndex, setActiveIndex]   = useState(-1)
  const [dropdownPos, setDropdownPos]   = useState<DropdownPos | null>(null)
  const [mounted, setMounted]           = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Nécessaire pour createPortal (évite les erreurs SSR)
  useEffect(() => { setMounted(true) }, [])

  // Calcule la position du dropdown en coordonnées viewport (pour position: fixed)
  const updatePos = useCallback(() => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,departement&boost=population&limit=8`
      )
      if (res.ok) {
        const data: Commune[] = await res.json()
        setSuggestions(data)
        if (data.length > 0) { updatePos(); setOpen(true) } else { setOpen(false) }
        setActiveIndex(-1)
      }
    } catch {
      setSuggestions([])
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [updatePos])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    onChange(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(v), 300)
  }

  const select = (nom: string) => {
    onChange(nom)
    setSuggestions([])
    setOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); select(suggestions[activeIndex].nom) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  // Fermer si clic en dehors (du wrapper ET du dropdown portal)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const clickedWrapper  = wrapperRef.current?.contains(target)
      const clickedDropdown = target.closest('[data-city-dropdown="true"]')
      if (!clickedWrapper && !clickedDropdown) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Recalcule la position si scroll ou resize pendant que le dropdown est ouvert
  useEffect(() => {
    if (!open) return
    const handler = () => updatePos()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [open, updatePos])

  const defaultInputClass =
    'w-full rounded-xl bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-purple-500/60'

  return (
    <div ref={wrapperRef} className={`relative ${className ?? ''}`}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) { updatePos(); setOpen(true) } }}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className={inputClassName ?? defaultInputClass}
      />

      {/* Spinner chargement */}
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-purple-400 rounded-full animate-spin" />
        </div>
      )}

      {/* Dropdown via Portal → rendu dans <body>, passe au-dessus de tout overflow-hidden */}
      {mounted && open && suggestions.length > 0 && dropdownPos && createPortal(
        <ul
          data-city-dropdown="true"
          style={{
            position: 'fixed',
            top:   dropdownPos.top,
            left:  dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
          }}
          className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
        >
          {suggestions.map((s, i) => (
            <li key={`${s.nom}-${i}`}>
              <button
                type="button"
                onMouseDown={() => select(s.nom)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-3 ${
                  i === activeIndex
                    ? 'bg-purple-600/30 text-white'
                    : 'text-white hover:bg-white/8'
                }`}
              >
                <span className="font-medium">{s.nom}</span>
                {s.departement && (
                  <span className="text-xs text-white/35 flex-shrink-0">
                    {s.departement.nom} ({s.departement.code})
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  )
}
