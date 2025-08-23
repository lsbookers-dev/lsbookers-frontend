'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface User {
  id: number
  name: string
  role: 'ARTIST' | 'ORGANIZER' | 'PROVIDER'
  profile: {
    location?: string
    country?: string
    specialties?: string[]
    typeEtablissement?: string
    avatar?: string | null
  }
}

const SPECIALTIES = ['DJ', 'Chanteur', 'Saxophoniste', 'Danseur', 'Guitariste']
const PROVIDER_TYPES = ['Traiteur', 'Photobooth', 'Artificier', 'Photographe', 'Décorateur']
const ESTABLISHMENT_TYPES = ['Club', 'Bar', 'Rooftop', 'Soirée privée', 'Autre']
const COUNTRIES = ['France', 'Belgium', 'Canada', 'United States', 'United Kingdom', 'Spain', 'Germany', 'Italy', 'Portugal', 'Switzerland']

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export default function SearchPage() {
  const router = useRouter()
  const { token } = useAuth()

  // ---- filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ARTIST' | 'ORGANIZER' | 'PROVIDER' | ''>('')
  const [zone, setZone] = useState('')
  const [country, setCountry] = useState('')
  const [radiusKm, setRadiusKm] = useState('')

  // états “hérités” (on les garde pour compat, mais on s’appuie surtout sur selectedSpecs)
  const [specialtyFilter, setSpecialtyFilter] = useState('')           // ARTIST (ancienne version)
  const [establishmentTypeFilter, setEstablishmentTypeFilter] = useState('') // ORGANIZER (ancienne)
  const [typeProviderFilter, setTypeProviderFilter] = useState('')      // PROVIDER (ancienne)

  // ---- multi-select
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([])
  const [specsOpen, setSpecsOpen] = useState(false)
  const specsRef = useRef<HTMLDivElement | null>(null)

  // options dynamiques selon le rôle
  const specOptions = useMemo<string[]>(() => {
    if (roleFilter === 'ARTIST') return SPECIALTIES
    if (roleFilter === 'PROVIDER') return PROVIDER_TYPES
    if (roleFilter === 'ORGANIZER') return ESTABLISHMENT_TYPES
    return []
  }, [roleFilter])

  // fermer le panneau en cliquant dehors
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (specsRef.current && !specsRef.current.contains(e.target as Node)) {
        setSpecsOpen(false)
      }
    }
    if (specsOpen) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [specsOpen])

  // résultats
  const [users, setUsers] = useState<User[]>([])

  const handleSearch = useCallback(() => {
    if (!token || !API_BASE) return

    const params = new URLSearchParams()

    if (searchTerm) params.append('name', searchTerm)
    if (roleFilter) params.append('role', roleFilter)

    // ---- Multi-spécialités en OU
    const specs: string[] =
      selectedSpecs.length
        ? selectedSpecs
        : roleFilter === 'ARTIST' && specialtyFilter
          ? [specialtyFilter]
          : roleFilter === 'PROVIDER' && typeProviderFilter
            ? [typeProviderFilter]
            : roleFilter === 'ORGANIZER' && establishmentTypeFilter
              ? [establishmentTypeFilter]
              : []

    // format multi-clés ?specialty=A&specialty=B
    specs.forEach(s => params.append('specialty', s))
    // fallback CSV si le backend préfère
    if (specs.length) params.append('specialties', specs.join(','))
    // petit hint toléré/ignoré côté API
    if (specs.length > 1) params.append('match', 'any')
    // ---------------------------------

    if (zone) params.append('zone', zone)
    if (country) params.append('country', country)
    if (radiusKm) params.append('radius', radiusKm)

    fetch(`${API_BASE}/api/search?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => '')
          throw new Error(`HTTP ${res.status} ${txt}`)
        }
        return res.json()
      })
      .then((data) => {
        const list = Array.isArray(data?.users) ? data.users : []
        setUsers(list)
      })
      .catch(err => {
        console.error('Erreur recherche :', err)
        setUsers([])
      })
  }, [
    token, searchTerm, roleFilter,
    specialtyFilter, establishmentTypeFilter, typeProviderFilter,
    selectedSpecs, zone, country, radiusKm
  ])

  useEffect(() => {
    if (!token) return
    handleSearch()
  }, [token, handleSearch])

  const goToProfile = (user: User) => {
    const route =
      user.role === 'ARTIST'
        ? `/artist/${user.id}`
        : user.role === 'ORGANIZER'
        ? `/organizer/${user.id}`
        : `/provider/${user.id}`
    router.push(route)
  }

  // ——— UI helpers (design only)
  const roleBadge = (r: User['role']) =>
    r === 'ARTIST'
      ? 'bg-pink-600/20 text-pink-300 border-pink-500/30'
      : r === 'PROVIDER'
      ? 'bg-violet-600/20 text-violet-300 border-violet-500/30'
      : 'bg-blue-600/20 text-blue-300 border-blue-500/30'

  // Label court pour le champ multi-select
  const specsLabel = selectedSpecs.length
    ? selectedSpecs.join(', ')
    : 'Types / Spécialités'

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Bandeau titre */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 via-violet-600/10 to-blue-600/10 blur-3xl" />
        <div className="relative px-6 pt-10 pb-6">
          <h1 className="text-3xl md:text-4xl font-bold">🔍 Recherche d’utilisateurs</h1>
          <p className="text-white/70 mt-2">
            Trouve des <span className="text-pink-400">artistes</span>, des <span className="text-violet-400">prestataires</span> et des
            <span className="text-blue-400"> organisateurs</span> près de chez toi.
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="px-6 pb-10 max-w-7xl mx-auto">
        {/* FILTRES */}
        <section className="rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur p-4 md:p-5 mb-8 overflow-visible">
          {/* Ligne 1 : Pseudo | Pays | Ville/Zone | Rayon */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <input
              type="text"
              placeholder="Rechercher par pseudo..."
              className="px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-white/30"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />

            <select
              className="px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-white/30"
              value={country}
              onChange={e => setCountry(e.target.value)}
            >
              <option value="">Tous les pays</option>
              {COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Ville ou zone géographique"
              className="px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-white/30"
              value={zone}
              onChange={e => setZone(e.target.value)}
            />

            <input
              type="number"
              placeholder="Rayon en km"
              className="px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-white/30"
              value={radiusKm}
              onChange={e => setRadiusKm(e.target.value)}
            />
          </div>

          {/* Ligne 2 : Rôle | Types/Spécialités | Actions */}
          <div className="mt-3 md:mt-4 grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto_auto] gap-3 md:gap-4 items-start">
            {/* Rôle */}
            <select
              className="px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-white/30"
              value={roleFilter}
              onChange={e => {
                const v = e.target.value as 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | ''
                setRoleFilter(v)
                // reset anciens champs + nouvelle sélection
                setSpecialtyFilter('')
                setEstablishmentTypeFilter('')
                setTypeProviderFilter('')
                setSelectedSpecs([])
              }}
            >
              <option value="">Tous les rôles</option>
              <option value="ARTIST">Artistes</option>
              <option value="ORGANIZER">Organisateurs</option>
              <option value="PROVIDER">Prestataires</option>
            </select>

            {/* Types / Spécialités — multi-select */}
            <div className="relative" ref={specsRef}>
              <button
                type="button"
                onClick={() => setSpecsOpen(o => !o)}
                className="w-full text-left px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-white/30"
                disabled={!roleFilter}
                title={!roleFilter ? 'Choisis un rôle pour voir les types' : 'Types / Spécialités'}
              >
                {specsLabel}
              </button>

              {specsOpen && roleFilter && (
                <div
                  className="absolute z-50 top-full mt-2 w-[min(560px,90vw)]
                             rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur p-3 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <button
                      className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                      onClick={() => setSelectedSpecs(specOptions)}
                    >
                      Tout sélectionner
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                      onClick={() => setSelectedSpecs([])}
                    >
                      Effacer
                    </button>
                  </div>

                  <ul className="max-h-64 overflow-auto pr-1 space-y-1">
                    {specOptions.map(opt => {
                      const checked = selectedSpecs.includes(opt)
                      return (
                        <li key={opt}>
                          <label className="flex items-center gap-3 px-2 py-2 rounded hover:bg-white/5 cursor-pointer">
                            <input
                              type="checkbox"
                              className="accent-pink-600"
                              checked={checked}
                              onChange={(e) => {
                                const on = e.target.checked
                                setSelectedSpecs(prev =>
                                  on ? [...prev, opt] : prev.filter(x => x !== opt)
                                )
                              }}
                            />
                            <span className="text-sm">{opt}</span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-pink-600 to-violet-600 text-white font-semibold hover:opacity-90 transition"
            >
              Rechercher
            </button>
            <button
              onClick={() => {
                setSearchTerm('')
                setRoleFilter('')
                setSpecialtyFilter('')
                setEstablishmentTypeFilter('')
                setTypeProviderFilter('')
                setSelectedSpecs([])
                setZone('')
                setCountry('')
                setRadiusKm('')
              }}
              className="px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition"
            >
              Réinitialiser
            </button>
          </div>
        </section>

        {/* RÉSULTATS (inchangé) */}
        {users.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {users.map(user => (
              <div
                key={user.id}
                className="group relative rounded-2xl border border-white/10 bg-neutral-900/60 hover:bg-neutral-900 transition shadow-lg overflow-hidden cursor-pointer"
                onClick={() => goToProfile(user)}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-600 via-violet-600 to-blue-600 opacity-70" />
                <div className="p-4 flex items-start gap-4">
                  <div className="relative w-12 h-12 shrink-0">
                    <Image
                      src={user.profile?.avatar || '/default-avatar.png'}
                      alt={user.name || 'avatar'}
                      fill
                      className="rounded-full object-cover ring-2 ring-white/10"
                      unoptimized
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold truncate">{user.name}</h2>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${roleBadge(user.role)}`}>
                        {user.role === 'ARTIST' ? 'Artiste'
                          : user.role === 'PROVIDER' ? 'Prestataire'
                          : 'Organisateur'}
                      </span>
                    </div>

                    <p className="text-sm text-white/70 mt-0.5 truncate">
                      {user.role === 'ARTIST'
                        ? user.profile?.specialties?.join(', ') || 'Artiste'
                        : user.role === 'PROVIDER'
                        ? user.profile?.specialties?.join(', ') || 'Prestataire'
                        : user.profile?.typeEtablissement || 'Organisateur'}
                    </p>

                    {(user.profile?.location || user.profile?.country) && (
                      <p className="text-xs text-white/50 mt-1 truncate">
                        📍 {user.profile?.location}
                        {user.profile?.country ? `, ${user.profile.country}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-gradient-to-br from-white/0 via-white/0 to-white/5" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-white/50 mt-8">Aucun résultat trouvé.</p>
        )}
      </div>
    </main>
  )
}