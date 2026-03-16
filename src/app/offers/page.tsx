'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Briefcase,
  CalendarDays,
  Filter,
  Inbox,
  MapPin,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'

/* ================= Types ================= */
type Job = {
  id: number
  title: string
  description: string
  type: 'ARTIST' | 'PROVIDER' | 'ALL'
  specialty?: string
  location: string
  country: string
  date: string
  budget?: string
  createdAt: string
  organizer: { user: { name: string } }
}

/* ================= Helpers ================= */
function typeLabel(type: Job['type']) {
  if (type === 'ARTIST') return 'Artiste'
  if (type === 'PROVIDER') return 'Prestataire'
  return 'Tous profils'
}

function typeBadgeClass(type: Job['type']) {
  if (type === 'ARTIST') {
    return 'bg-pink-600/15 text-pink-300 border-pink-500/20'
  }
  if (type === 'PROVIDER') {
    return 'bg-violet-600/15 text-violet-300 border-violet-500/20'
  }
  return 'bg-blue-600/15 text-blue-300 border-blue-500/20'
}

function formatDate(date: string) {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function OrganizerAvatar({ name }: { name: string }) {
  const initial = (name || 'O').trim().charAt(0).toUpperCase()

  return (
    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-fuchsia-600/25 via-violet-600/25 to-blue-600/25 border border-white/10 flex items-center justify-center text-white font-semibold shadow-lg shrink-0">
      {initial}
    </div>
  )
}

/* ============== Page ============== */
export default function OffersPage() {
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

  const [offers, setOffers] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    type: '',
    specialty: '',
    location: '',
    country: '',
    date: '',
  })

  useEffect(() => {
    const loadOffers = async () => {
      setLoading(true)

      try {
        const params: Record<string, string> = {}
        if (filters.type) params.type = filters.type
        if (filters.specialty) params.specialty = filters.specialty
        if (filters.location) params.location = filters.location
        if (filters.country) params.country = filters.country
        if (filters.date) params.date = filters.date

        const query = new URLSearchParams(params).toString()
        const res = await fetch(`${API_BASE}/api/offers${query ? `?${query}` : ''}`)

        if (res.ok) {
          const data: Job[] = await res.json()
          setOffers(data)
        } else {
          alert('Erreur lors du chargement des offres.')
        }
      } catch (err) {
        console.error('Erreur chargement offres:', err)
        alert('Erreur lors du chargement des offres.')
      }

      setLoading(false)
    }

    loadOffers()
  }, [API_BASE, filters])

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const resetFilters = () => {
    setFilters({
      type: '',
      specialty: '',
      location: '',
      country: '',
      date: '',
    })
  }

  const stats = useMemo(() => {
    return {
      total: offers.length,
      artists: offers.filter((o) => o.type === 'ARTIST').length,
      providers: offers.filter((o) => o.type === 'PROVIDER').length,
    }
  }, [offers])

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* ===== Hero compact ===== */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/10 via-violet-600/10 to-blue-600/10 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-7">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 mb-4">
              <Sparkles size={14} className="text-violet-300" />
              Opportunités LSBookers
            </div>

            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              Offres d’emploi
            </h1>

            <p className="text-white/65 mt-3 text-sm md:text-base leading-relaxed max-w-2xl">
              Découvre les annonces publiées par les organisateurs et établissements,
              et trouve rapidement les opportunités adaptées à ton activité.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/70">
                {stats.total} offre{stats.total > 1 ? 's' : ''}
              </div>
              <div className="rounded-full border border-pink-500/15 bg-pink-600/10 px-3 py-1.5 text-sm text-pink-300">
                {stats.artists} artiste{stats.artists > 1 ? 's' : ''}
              </div>
              <div className="rounded-full border border-violet-500/15 bg-violet-600/10 px-3 py-1.5 text-sm text-violet-300">
                {stats.providers} prestataire{stats.providers > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Content ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid gap-5 xl:grid-cols-[300px,1fr] items-start">
          {/* ===== Filtres compacts ===== */}
          <aside className="rounded-[24px] border border-white/10 bg-neutral-900/75 backdrop-blur p-4 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-violet-600/15 flex items-center justify-center shrink-0">
                <Filter size={17} className="text-violet-300" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Filtres</h2>
                <p className="text-xs text-white/50 mt-1">
                  Affine les résultats rapidement.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="relative">
                <Users
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                />
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="w-full rounded-2xl bg-black/30 border border-white/10 focus:border-white/25 outline-none pl-10 pr-4 py-2.5 text-sm text-white"
                >
                  <option value="">Tous les profils</option>
                  <option value="ARTIST">Artistes</option>
                  <option value="PROVIDER">Prestataires</option>
                </select>
              </div>

              <div className="relative">
                <Briefcase
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                />
                <input
                  name="specialty"
                  value={filters.specialty}
                  onChange={handleFilterChange}
                  placeholder="Spécialité"
                  className="w-full rounded-2xl bg-black/30 border border-white/10 focus:border-white/25 outline-none pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/35"
                />
              </div>

              <div className="relative">
                <MapPin
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                />
                <input
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  placeholder="Ville"
                  className="w-full rounded-2xl bg-black/30 border border-white/10 focus:border-white/25 outline-none pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/35"
                />
              </div>

              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                />
                <input
                  name="country"
                  value={filters.country}
                  onChange={handleFilterChange}
                  placeholder="Pays"
                  className="w-full rounded-2xl bg-black/30 border border-white/10 focus:border-white/25 outline-none pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/35"
                />
              </div>

              <div className="relative">
                <CalendarDays
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                />
                <input
                  type="date"
                  name="date"
                  value={filters.date}
                  onChange={handleFilterChange}
                  className="w-full rounded-2xl bg-black/30 border border-white/10 focus:border-white/25 outline-none pl-10 pr-4 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            <button
              onClick={resetFilters}
              className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-4 py-2.5 text-sm text-white/80"
            >
              Réinitialiser
            </button>
          </aside>

          {/* ===== Liste des offres ===== */}
          <section className="rounded-[24px] border border-white/10 bg-neutral-900/75 backdrop-blur p-4 sm:p-5 shadow-2xl min-h-[560px]">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
              <div>
                <h2 className="text-xl font-semibold">Offres disponibles</h2>
                <p className="text-sm text-white/50 mt-1">
                  Les opportunités publiées récemment sur la plateforme.
                </p>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-white/45">Chargement...</p>
            ) : offers.length === 0 ? (
              <div className="h-[420px] rounded-3xl border border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
                  <Inbox className="text-white/35" size={28} />
                </div>
                <h3 className="text-lg font-medium mb-2">Aucune offre disponible</h3>
                <p className="text-white/45 text-sm max-w-md">
                  Aucune offre ne correspond actuellement à tes filtres. Essaie d’élargir la recherche.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {offers.map((offer) => (
                  <li
                    key={offer.id}
                    className="group rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition p-4"
                  >
                    <div className="flex items-start gap-3">
                      <OrganizerAvatar name={offer.organizer.user.name} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-semibold text-white">
                                {offer.title}
                              </h3>

                              <span
                                className={`text-[11px] px-2.5 py-1 rounded-full border ${typeBadgeClass(
                                  offer.type
                                )}`}
                              >
                                {typeLabel(offer.type)}
                              </span>

                              {offer.specialty && (
                                <span className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/60">
                                  {offer.specialty}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-white/45 mt-1.5">
                              Par <span className="text-white/75">{offer.organizer.user.name}</span>
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm text-white/60">
                              {formatDate(offer.date)}
                            </p>
                            {offer.budget && (
                              <p className="text-sm font-medium text-violet-300 mt-1">
                                {offer.budget}
                              </p>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-white/72 leading-relaxed mt-3 line-clamp-2">
                          {offer.description}
                        </p>

                        <div className="flex items-center gap-4 flex-wrap mt-3 text-xs text-white/50">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={14} />
                            {offer.location}, {offer.country}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={14} />
                            {formatDate(offer.date)}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Briefcase size={14} />
                            {typeLabel(offer.type)}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center gap-2.5">
                          <button className="rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:opacity-90 transition px-4 py-2 text-sm font-medium text-white shadow-lg">
                            Contacter
                          </button>

                          <button className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-4 py-2 text-sm text-white/80">
                            Voir le profil
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}