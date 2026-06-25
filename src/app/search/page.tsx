'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Search, MapPin, Globe, Sliders, X, Music2, Building2, Wrench, ChevronDown } from 'lucide-react'

interface User {
  id: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  role: 'ARTIST' | 'ORGANIZER' | 'PROVIDER'
  profile: {
    location?: string
    country?: string
    specialties?: string[]
    typeEtablissement?: string
    avatar?: string | null
  }
}

const SPECIALTIES     = ['DJ', 'Chanteur', 'Saxophoniste', 'Danseur', 'Guitariste']
const PROVIDER_TYPES  = ['Traiteur', 'Photobooth', 'Artificier', 'Photographe', 'Décorateur']
const ESTABLISHMENT_TYPES = ['Club', 'Bar', 'Rooftop', 'Soirée privée', 'Autre']
const COUNTRIES = [
  'France', 'Belgium', 'Canada', 'United States',
  'United Kingdom', 'Spain', 'Germany', 'Italy', 'Portugal', 'Switzerland',
]
const RADIUS_OPTIONS = ['50', '100', '200', '500', '1000']

const ROLE_CONFIG = {
  ARTIST:    { label: 'Artistes',       color: 'pink',   icon: Music2,    gradient: 'from-pink-500 to-rose-600',    bg: 'bg-pink-500/10 border-pink-500/30 text-pink-300' },
  PROVIDER:  { label: 'Prestataires',   color: 'violet', icon: Wrench,    gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/10 border-violet-500/30 text-violet-300' },
  ORGANIZER: { label: 'Organisateurs',  color: 'blue',   icon: Building2, gradient: 'from-blue-500 to-cyan-600',    bg: 'bg-blue-500/10 border-blue-500/30 text-blue-300' },
} as const

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

/* ── Multi-select dropdown ─────────────────────────────────── */
function MultiSelectDropdown({
  options, values, placeholder, onChange,
}: { options: string[]; values: string[]; placeholder: string; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const toggle = (opt: string) =>
    onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt])

  const label = values.length === 0 ? placeholder : values.length <= 2 ? values.join(', ') : `${values.length} sélectionnées`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:border-white/20 transition focus:outline-none focus:border-white/30"
      >
        <span className="text-sm truncate text-white/70">{label}</span>
        <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-[9999] top-full mt-2 w-full min-w-[220px] rounded-xl border border-white/10 bg-neutral-900 shadow-2xl overflow-hidden">
          <div className="flex gap-2 p-2 border-b border-white/5">
            <button type="button" onClick={() => onChange([...options])} className="flex-1 text-xs py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition text-white/70">
              Tout
            </button>
            <button type="button" onClick={() => onChange([])} className="flex-1 text-xs py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition text-white/70">
              Effacer
            </button>
          </div>
          <ul className="max-h-48 overflow-y-auto p-1">
            {options.map(opt => (
              <li key={opt}>
                <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <input type="checkbox" checked={values.includes(opt)} onChange={() => toggle(opt)} className="h-4 w-4 accent-violet-500 rounded" />
                  <span className="text-sm text-white/80">{opt}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ── Carte résultat ────────────────────────────────────────── */
function UserCard({ user, onClick }: { user: User; onClick: () => void }) {
  const cfg = ROLE_CONFIG[user.role]
  const Icon = cfg.icon
  const displayName = user.pseudo || [user.firstName, user.lastName].filter(Boolean).join(' ') || '—'
  const subtitle = user.role === 'ORGANIZER'
    ? user.profile?.typeEtablissement || 'Organisateur'
    : user.profile?.specialties?.join(' · ') || cfg.label

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Trait couleur en haut */}
      <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${cfg.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className="p-4 flex items-center gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={`absolute -inset-0.5 rounded-full bg-gradient-to-br ${cfg.gradient} opacity-0 group-hover:opacity-40 transition-opacity blur-sm`} />
          <div className="relative w-14 h-14 rounded-full overflow-hidden ring-1 ring-white/10">
            <Image
              src={user.profile?.avatar || '/default-avatar.png'}
              alt={displayName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>

        {/* Infos */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="font-semibold text-white truncate">{displayName}</h2>
          </div>
          <p className="text-sm text-white/50 truncate">{subtitle}</p>
          {(user.profile?.location || user.profile?.country) && (
            <div className="flex items-center gap-1 mt-1.5">
              <MapPin className="w-3 h-3 text-white/30 shrink-0" />
              <span className="text-xs text-white/40 truncate">
                {[user.profile.location, user.profile.country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Badge rôle */}
        <div className="shrink-0">
          <div className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${cfg.bg}`}>
            <Icon className="w-3 h-3" />
            <span>{cfg.label.replace(/s$/, '')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Page principale ───────────────────────────────────────── */
export default function SearchPage() {
  const router = useRouter()
  const { token } = useAuth()

  const [searchTerm, setSearchTerm]   = useState('')
  const [typeFilter, setTypeFilter]   = useState<'ARTIST' | 'ORGANIZER' | 'PROVIDER' | ''>('')
  const [typeFilters, setTypeFilters] = useState<string[]>([])
  const [zone, setZone]               = useState('')
  const [country, setCountry]         = useState('')
  const [radiusKm, setRadiusKm]       = useState('')
  const [users, setUsers]             = useState<User[]>([])
  const [loading, setLoading]         = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = useCallback(() => {
    if (!token || !API_BASE) return
    setLoading(true)
    setHasSearched(true)

    const params = new URLSearchParams()
    if (searchTerm.trim()) params.append('name', searchTerm.trim())
    if (typeFilter)        params.append('role', typeFilter)
    if (zone.trim()) {
      params.append('zone', zone.trim())
      params.append('location', zone.trim())
    }
    if (country.trim())  params.append('country', country.trim())
    if (radiusKm.trim()) params.append('radius', radiusKm.trim())

    fetch(`${API_BASE}/api/search?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        let list: User[] = Array.isArray(data?.users) ? data.users : []

        if (typeFilters.length > 0) {
          const selected = new Set(typeFilters.map(s => s.toLowerCase().trim()))
          list = list.filter(u => {
            if (u.role === 'ARTIST' || u.role === 'PROVIDER') {
              return (u.profile?.specialties || []).some(s => selected.has(String(s).toLowerCase().trim()))
            }
            if (u.role === 'ORGANIZER') {
              return selected.has((u.profile?.typeEtablissement || '').toLowerCase().trim())
            }
            return false
          })
        }

        setUsers(list)
      })
      .catch(err => { console.error('Erreur recherche :', err); setUsers([]) })
      .finally(() => setLoading(false))
  }, [token, searchTerm, typeFilter, typeFilters, zone, country, radiusKm])

  // Chargement initial
  useEffect(() => { if (token) handleSearch() }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => {
    setSearchTerm(''); setTypeFilter(''); setTypeFilters([])
    setZone(''); setCountry(''); setRadiusKm('')
  }

  const goToProfile = (user: User) => {
    router.push(
      user.role === 'ARTIST' ? `/artist/${user.id}` :
      user.role === 'ORGANIZER' ? `/organizer/${user.id}` :
      `/provider/${user.id}`
    )
  }

  const currentTypeOptions =
    typeFilter === 'ARTIST'    ? SPECIALTIES :
    typeFilter === 'PROVIDER'  ? PROVIDER_TYPES :
    typeFilter === 'ORGANIZER' ? ESTABLISHMENT_TYPES : []

  const hasActiveFilters = !!(typeFilter || typeFilters.length || zone || country || radiusKm)

  /* Répartition par rôle pour les stats */
  const counts = { ARTIST: 0, ORGANIZER: 0, PROVIDER: 0 }
  users.forEach(u => { if (u.role in counts) counts[u.role]++ })

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-pink-600/10 blur-3xl" />
          <div className="absolute -top-20 right-1/4 w-80 h-80 rounded-full bg-violet-600/8 blur-3xl" />
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-blue-600/8 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Recherche</h1>
              <p className="text-white/50 mt-1 text-sm">
                Trouve des{' '}
                <span className="text-pink-400">artistes</span>,{' '}
                <span className="text-violet-400">prestataires</span> et{' '}
                <span className="text-blue-400">organisateurs</span>
              </p>
            </div>

            {hasSearched && !loading && (
              <div className="flex gap-3 flex-wrap">
                {(Object.entries(counts) as [keyof typeof counts, number][]).map(([role, count]) => {
                  if (!count) return null
                  const cfg = ROLE_CONFIG[role]
                  const Icon = cfg.icon
                  return (
                    <div key={role} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${cfg.bg} text-xs`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="font-semibold">{count}</span>
                      <span className="opacity-70">{count > 1 ? cfg.label : cfg.label.replace(/s$/, '')}</span>
                    </div>
                  )
                })}
                {users.length === 0 && <span className="text-white/30 text-sm self-center">Aucun résultat</span>}
              </div>
            )}
          </div>

          {/* Barre de recherche principale */}
          <div className="mt-6 flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Rechercher par pseudo, prénom ou nom…"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:bg-white/8 transition"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 transition disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? 'Recherche…' : 'Rechercher'}
            </button>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`px-4 py-3.5 rounded-xl border transition flex items-center gap-2 ${
                showFilters || hasActiveFilters
                  ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                  : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
              }`}
            >
              <Sliders className="w-4 h-4" />
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-violet-400" />}
            </button>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-3 p-4 rounded-xl border border-white/8 bg-white/[0.02] space-y-4">
              {/* Type */}
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Type de compte</p>
                <div className="flex gap-2 flex-wrap">
                  {([['', 'Tous'], ['ARTIST', 'Artistes'], ['PROVIDER', 'Prestataires'], ['ORGANIZER', 'Organisateurs']] as const).map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { setTypeFilter(val); setTypeFilters([]) }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                        typeFilter === val
                          ? 'bg-white/10 border-white/25 text-white'
                          : 'border-white/8 text-white/40 hover:text-white/70 hover:border-white/15'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spécialités si type sélectionné */}
              {typeFilter && currentTypeOptions.length > 0 && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                    {typeFilter === 'ARTIST' ? 'Spécialités' : typeFilter === 'PROVIDER' ? 'Types de prestation' : "Type d'établissement"}
                  </p>
                  <MultiSelectDropdown
                    options={currentTypeOptions}
                    values={typeFilters}
                    onChange={setTypeFilters}
                    placeholder="Toutes"
                  />
                </div>
              )}

              {/* Localisation */}
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Localisation</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <select
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/25 transition text-sm appearance-none"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                    >
                      <option value="">Tous les pays</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      placeholder="Ville ou zone"
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/25 transition text-sm"
                      value={zone}
                      onChange={e => setZone(e.target.value)}
                    />
                  </div>
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/25 transition text-sm appearance-none"
                    value={radiusKm}
                    onChange={e => setRadiusKm(e.target.value)}
                    disabled={!zone.trim()}
                  >
                    <option value="">Rayon (si ville)</option>
                    {RADIUS_OPTIONS.map(r => <option key={r} value={r}>{r} km</option>)}
                  </select>
                </div>
              </div>

              {/* Reset */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition"
                >
                  <X className="w-3.5 h-3.5" /> Réinitialiser tous les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Résultats ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
            <p className="text-white/30 text-sm">Recherche en cours…</p>
          </div>
        )}

        {/* Grille résultats */}
        {!loading && users.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map(user => (
              <UserCard key={user.id} user={user} onClick={() => goToProfile(user)} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && hasSearched && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Search className="w-7 h-7 text-white/20" />
            </div>
            <div>
              <p className="text-white/60 font-medium">Aucun résultat trouvé</p>
              <p className="text-white/30 text-sm mt-1">Essaie d'élargir ta recherche ou de modifier les filtres</p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="text-xs px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/8 transition"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
