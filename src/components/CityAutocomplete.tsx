'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type Commune = {
  nom: string
  departement?: { nom: string; code: string }
}

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
 * Champ ville avec autocomplétion — utilise l'API gratuite geo.api.gouv.fr
 * Fonctionne pour toutes les communes françaises.
 * Pour les villes étrangères : l'utilisateur peut toujours saisir manuellement.
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
  const [suggestions, setSuggestions] = useState<Commune[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        setOpen(data.length > 0)
        setActiveIndex(-1)
      }
    } catch {
      setSuggestions([])
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [])

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
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      select(suggestions[activeIndex].nom)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Fermer si clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const defaultInputClass =
    'w-full rounded-xl bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-purple-500/60'

  return (
    <div ref={wrapperRef} className={`relative ${className ?? ''}`}>
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className={inputClassName ?? defaultInputClass}
      />

      {/* Indicateur de chargement */}
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-purple-400 rounded-full animate-spin" />
        </div>
      )}

      {/* Liste de suggestions */}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
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
        </ul>
      )}
    </div>
  )
}
