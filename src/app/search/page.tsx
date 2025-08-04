'use client'

import { useState, useEffect } from 'react'
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
  }
}

const SPECIALTIES = ['DJ', 'Chanteur', 'Saxophoniste', 'Danseur', 'Guitariste']
const PROVIDER_TYPES = ['Traiteur', 'Photobooth', 'Artificier', 'Photographe', 'Décorateur']
const ESTABLISHMENT_TYPES = ['Club', 'Bar', 'Rooftop', 'Soirée privée', 'Autre']

const COUNTRIES = ['France', 'Belgium', 'Canada', 'United States', 'United Kingdom', 'Spain', 'Germany', 'Italy', 'Portugal', 'Switzerland']

export default function SearchPage() {
  const router = useRouter()
  const { token } = useAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [establishmentTypeFilter, setEstablishmentTypeFilter] = useState('')
  const [typeProviderFilter, setTypeProviderFilter] = useState('')
  const [zone, setZone] = useState('')
  const [country, setCountry] = useState('')
  const [radiusKm, setRadiusKm] = useState('')
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    if (!token) return
    handleSearch()
  }, [token])

  const handleSearch = () => {
    if (!token) return

    const params = new URLSearchParams()
    if (searchTerm) params.append('name', searchTerm)
    if (roleFilter) params.append('role', roleFilter)
    if (specialtyFilter) params.append('specialty', specialtyFilter)
    if (typeProviderFilter) params.append('specialty', typeProviderFilter)
    if (establishmentTypeFilter) params.append('typeEtablissement', establishmentTypeFilter)
    if (zone) params.append('zone', zone)
    if (country) params.append('country', country)
    if (radiusKm) params.append('radius', radiusKm)

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/search?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setUsers(data.users))
      .catch(err => console.error('Erreur recherche :', err))
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
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">🔍 Recherche d’utilisateurs</h1>

      {/* FILTRES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Rechercher par pseudo..."
          className="px-4 py-2 rounded bg-gray-800 text-white placeholder-gray-400"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        <select
          className="px-4 py-2 rounded bg-gray-800 text-white"
          value={roleFilter}
          onChange={e => {
            setRoleFilter(e.target.value)
            setSpecialtyFilter('')
            setEstablishmentTypeFilter('')
            setTypeProviderFilter('')
          }}
        >
          <option value="">Tous les rôles</option>
          <option value="ARTIST">Artistes</option>
          <option value="ORGANIZER">Organisateurs</option>
          <option value="PROVIDER">Prestataires</option>
        </select>

        {/* 🎵 Spécialité (si ARTIST) */}
        {roleFilter === 'ARTIST' && (
          <select
            className="px-4 py-2 rounded bg-gray-800 text-white"
            value={specialtyFilter}
            onChange={e => setSpecialtyFilter(e.target.value)}
          >
            <option value="">Toutes les spécialités</option>
            {SPECIALTIES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        {/* 🏢 Type d’établissement (si ORGANIZER) */}
        {roleFilter === 'ORGANIZER' && (
          <select
            className="px-4 py-2 rounded bg-gray-800 text-white"
            value={establishmentTypeFilter}
            onChange={e => setEstablishmentTypeFilter(e.target.value)}
          >
            <option value="">Tous les types d’établissement</option>
            {ESTABLISHMENT_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}

        {/* 🛠️ Type de prestataire (si PROVIDER) */}
        {roleFilter === 'PROVIDER' && (
          <select
            className="px-4 py-2 rounded bg-gray-800 text-white"
            value={typeProviderFilter}
            onChange={e => setTypeProviderFilter(e.target.value)}
          >
            <option value="">Tous les types de prestataire</option>
            {PROVIDER_TYPES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}

        <input
          type="text"
          placeholder="Ville ou zone géographique"
          className="px-4 py-2 rounded bg-gray-800 text-white placeholder-gray-400"
          value={zone}
          onChange={e => setZone(e.target.value)}
        />
        <select
          className="px-4 py-2 rounded bg-gray-800 text-white"
          value={country}
          onChange={e => setCountry(e.target.value)}
        >
          <option value="">Tous les pays</option>
          {COUNTRIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Rayon en km"
          className="px-4 py-2 rounded bg-gray-800 text-white placeholder-gray-400"
          value={radiusKm}
          onChange={e => setRadiusKm(e.target.value)}
        />

        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-600 transition"
        >
          Rechercher
        </button>
      </div>

      {/* RÉSULTATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div
            key={user.id}
            className="bg-gray-800 p-4 rounded hover:bg-gray-700 transition cursor-pointer"
            onClick={() => goToProfile(user)}
          >
            <div className="flex items-center gap-4">
              <Image
                src="/default-avatar.png"
                alt="avatar"
                width={50}
                height={50}
                className="rounded-full"
              />
              <div>
                <h2 className="text-lg font-semibold">{user.name}</h2>
                <p className="text-sm text-gray-400">
                  {user.role === 'ARTIST'
                    ? user.profile?.specialties?.join(', ') || 'Artiste'
                    : user.role === 'PROVIDER'
                    ? user.profile?.specialties?.join(', ') || 'Prestataire'
                    : user.profile?.typeEtablissement || 'Organisateur'}
                </p>
                {(user.profile?.location || user.profile?.country) && (
                  <p className="text-xs text-gray-500">
                    📍 {user.profile.location}
                    {user.profile.country ? `, ${user.profile.country}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <p className="text-center text-gray-500 mt-6">Aucun résultat trouvé.</p>
      )}
    </main>
  )
}