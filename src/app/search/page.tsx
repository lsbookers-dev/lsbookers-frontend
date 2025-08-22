'use client'

import { useState, useEffect, useCallback } from 'react'
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

const SPECIALTIES_ARTIST = ['DJ', 'Chanteur', 'Saxophoniste', 'Danseur', 'Guitariste']
const SPECIALTIES_PROVIDER = ['Traiteur', 'Photobooth', 'Artificier', 'Photographe', 'Décorateur']
const ESTABLISHMENT_TYPES = ['Club', 'Bar', 'Rooftop', 'Soirée privée', 'Autre']
const COUNTRIES = ['France', 'Belgium', 'Canada', 'United States', 'United Kingdom', 'Spain', 'Germany', 'Italy', 'Portugal', 'Switzerland']
const RADIUS_CHOICES = ['50', '100', '200', '500', '1000'] as const

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export default function SearchPage() {
  const router = useRouter()
  const { token } = useAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ARTIST' | 'ORGANIZER' | 'PROVIDER' | ''>('')
  const [artistSpecs, setArtistSpecs] = useState<string[]>([])
  const [providerSpecs, setProviderSpecs] = useState<string[]>([])
  const [establishmentTypeFilter, setEstablishmentTypeFilter] = useState('')
  const [country, setCountry] = useState('')
  const [zone, setZone] = useState('')
  const [radiusKm, setRadiusKm] = useState('')
  const [users, setUsers] = useState<User[]>([])

  const handleSearch = useCallback(() => {
    if (!token || !API_BASE) return

    const params = new URLSearchParams()
    if (searchTerm) params.append('name', searchTerm)
    if (roleFilter) params.append('role', roleFilter)

    // spécialités multi-sélection (ARTIST & PROVIDER -> même clé 'specialty' côté API)
    const specsToSend =
      roleFilter === 'ARTIST' ? artistSpecs
      : roleFilter === 'PROVIDER' ? providerSpecs
      : []
    specsToSend.forEach(s => params.append('specialty', s))

    if (roleFilter === 'ORGANIZER' && establishmentTypeFilter) {
      params.append('typeEtablissement', establishmentTypeFilter)
    }
    if (country) params.append('country', country)
    if (zone) params.append('zone', zone)
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
  }, [token, searchTerm, roleFilter, artistSpecs, providerSpecs, establishmentTypeFilter, country, zone, radiusKm])

  useEffect(() => {
    if (!token) return
    handleSearch()
  }, [token, handleSearch])

  // reset des champs dépendants du rôle
  const onRoleChange = (val: '' | 'ARTIST' | 'ORGANIZER' | 'PROVIDER') => {
    setRoleFilter(val)
    setArtistSpecs([])
    setProviderSpecs([])
    setEstablishmentTypeFilter('')
  }

  const goToProfile = (user: User) => {
    const route =
      user.role === 'ARTIST'
        ? `/artist/${user.id}`
        : user.role === 'ORGANIZER'
        ? `/organizer/${user.id}`
        : `/provider/${user.id}`
    router.push(route)
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 pb-12">
      <header className="max-w-6xl mx-auto pt-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          <span className="align-middle">🔍 Recherche d’utilisateurs</span>
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Trouve des <span className="text-pink-400">artistes</span>, des <span className="text-violet-400">prestataires</span> et des <span className="text-sky-400">organisateurs</span> près de chez toi.
        </p>
      </header>

      {/* ===== Bloc filtres (visuel + ordre demandé) ===== */}
      <section className="max-w-6xl mx-auto mt-6">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pseudo */}
            <div>
              <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">Pseudo</label>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-11 rounded-lg bg-neutral-900/80 border border-white/10 px-3 text-sm placeholder-white/40 outline-none focus:border-white/30"
                placeholder="Rechercher par pseudo…"
              />
            </div>

            {/* Rôle */}
            <div className="relative">
              <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">Rôle</label>
              <select
                className="w-full h-11 appearance-none rounded-lg bg-neutral-900/80 border border-white/10 px-3 pr-10 text-sm outline-none focus:border-white/30"
                value={roleFilter}
                onChange={e => onRoleChange(e.target.value as any)}
              >
                <option value="">Tous les rôles</option>
                <option value="ARTIST">Artistes</option>
                <option value="ORGANIZER">Organisateurs</option>
                <option value="PROVIDER">Prestataires</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-8 text-white/50">▾</span>
            </div>

            {/* PAYS (avant ville) */}
            <div className="relative">
              <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">Pays</label>
              <select
                className="w-full h-11 appearance-none rounded-lg bg-neutral-900/80 border border-white/10 px-3 pr-10 text-sm outline-none focus:border-white/30"
                value={country}
                onChange={e => setCountry(e.target.value)}
              >
                <option value="">Tous les pays</option>
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-8 text-white/50">▾</span>
            </div>

            {/* Ville / zone */}
            <div>
              <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">Ville / zone</label>
              <input
                type="text"
                value={zone}
                onChange={e => setZone(e.target.value)}
                className="w-full h-11 rounded-lg bg-neutral-900/80 border border-white/10 px-3 text-sm placeholder-white/40 outline-none focus:border-white/30"
                placeholder="Ex. Marseille"
              />
            </div>

            {/* === Spécialités (sous Rôle) === */}
            {roleFilter === 'ARTIST' && (
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">
                  Spécialités (artiste) — sélection multiple
                </label>
                <select
                  multiple
                  className="w-full min-h-11 rounded-lg bg-neutral-900/80 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
                  value={artistSpecs}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions).map(o => o.value)
                    setArtistSpecs(values)
                  }}
                >
                  {SPECIALTIES_ARTIST.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-white/40">
                  Astuce : Cmd/Ctrl + clic pour multi‑sélectionner.
                </p>
              </div>
            )}

            {roleFilter === 'PROVIDER' && (
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">
                  Spécialités (prestataire) — sélection multiple
                </label>
                <select
                  multiple
                  className="w-full min-h-11 rounded-lg bg-neutral-900/80 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
                  value={providerSpecs}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions).map(o => o.value)
                    setProviderSpecs(values)
                  }}
                >
                  {SPECIALTIES_PROVIDER.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-white/40">
                  Astuce : Cmd/Ctrl + clic pour multi‑sélectionner.
                </p>
              </div>
            )}

            {roleFilter === 'ORGANIZER' && (
              <div className="sm:col-span-2 lg:col-span-2 relative">
                <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">
                  Type d’établissement
                </label>
                <select
                  className="w-full h-11 appearance-none rounded-lg bg-neutral-900/80 border border-white/10 px-3 pr-10 text-sm outline-none focus:border-white/30"
                  value={establishmentTypeFilter}
                  onChange={e => setEstablishmentTypeFilter(e.target.value)}
                >
                  <option value="">Tous les types</option>
                  {ESTABLISHMENT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-8 text-white/50">▾</span>
              </div>
            )}

            {/* Rayon (menu déroulant fixe) */}
            <div>
              <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">Rayon (km)</label>
              <select
                className="w-full h-11 appearance-none rounded-lg bg-neutral-900/80 border border-white/10 px-3 pr-10 text-sm outline-none focus:border-white/30"
                value={radiusKm}
                onChange={e => setRadiusKm(e.target.value)}
              >
                <option value="">—</option>
                {RADIUS_CHOICES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSearch}
              className="h-11 px-5 rounded-lg bg-gradient-to-r from-pink-500 to-violet-600 text-white font-semibold hover:opacity-95 active:opacity-90 transition"
            >
              Rechercher
            </button>
            <button
              type="button"
              className="h-11 px-5 rounded-lg bg-white/10 text-white hover:bg-white/15 transition"
              onClick={() => {
                setSearchTerm('')
                onRoleChange('')
                setCountry('')
                setZone('')
                setRadiusKm('')
              }}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </section>

      {/* ===== Résultats (cartes remises comme avant) ===== */}
      <section className="max-w-6xl mx-auto mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <div
              key={user.id}
              className="cursor-pointer rounded-2xl border border-white/10 bg-neutral-900/60 p-4 hover:bg-neutral-900 transition"
              onClick={() => goToProfile(user)}
            >
              <div className="flex items-center gap-4">
                <Image
                  src={user.profile?.avatar || '/default-avatar.png'}
                  alt="avatar"
                  width={54}
                  height={54}
                  className="rounded-full"
                  unoptimized
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold truncate">{user.name}</h2>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        user.role === 'ARTIST'
                          ? 'bg-pink-500/15 text-pink-300 border-pink-500/30'
                          : user.role === 'PROVIDER'
                          ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                          : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                      }`}
                    >
                      {user.role === 'ARTIST' ? 'Artiste' : user.role === 'PROVIDER' ? 'Prestataire' : 'Organisateur'}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 truncate">
                    {user.role === 'ARTIST'
                      ? user.profile?.specialties?.join(', ') || 'Artiste'
                      : user.role === 'PROVIDER'
                      ? user.profile?.specialties?.join(', ') || 'Prestataire'
                      : user.profile?.typeEtablissement || 'Organisateur'}
                  </p>
                  {(user.profile?.location || user.profile?.country) && (
                    <p className="text-xs text-white/50 truncate">
                      📍 {user.profile?.location}{user.profile?.country ? `, ${user.profile.country}` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <p className="text-center text-white/50 mt-6">Aucun résultat trouvé.</p>
        )}
      </section>
    </main>
  )
}