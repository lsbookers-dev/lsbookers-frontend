'use client'
import { useEffect, useState } from 'react'

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

/* ============== Page ============== */
export default function OffersPage() {
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

  // États pour les offres et les filtres
  const [offers, setOffers] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    type: '', // Vide par défaut pour montrer toutes les offres
    specialty: '',
    location: '',
    country: '',
    date: ''
  })

  // Charger les offres avec filtres
  useEffect(() => {
    const loadOffers = async () => {
      setLoading(true)
      try {
        // Construire les paramètres de requête, sans inclure "type" si vide
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

  // Gérer les changements de filtres
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  /* ================= Render ================= */
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ===== Entête ===== */}
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Offres d’emploi</h1>

        {/* ===== Filtres ===== */}
        <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
          <h2 className="text-lg font-semibold mb-3">Filtres</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              <option value="ARTIST">Artiste</option>
              <option value="PROVIDER">Prestataire</option>
            </select>
            <input
              name="specialty"
              value={filters.specialty}
              onChange={handleFilterChange}
              placeholder="Spécialité (ex: DJ, Lumière)"
              className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
            />
            <input
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="Ville"
              className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
            />
            <input
              name="country"
              value={filters.country}
              onChange={handleFilterChange}
              placeholder="Pays"
              className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
            />
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
            />
          </div>
        </section>

        {/* ===== Liste des offres ===== */}
        <section className="mt-6">
          {loading ? (
            <p className="text-sm text-neutral-400">Chargement...</p>
          ) : offers.length === 0 ? (
            <p className="text-sm text-neutral-400">Aucune offre disponible.</p>
          ) : (
            <ul className="space-y-3">
              {offers.map(offer => (
                <li key={offer.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{offer.title}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Par {offer.organizer.user.name} · {offer.date} · {offer.location}, {offer.country}
                        {offer.budget ? ` · ${offer.budget}` : ''}
                      </p>
                      <p className="text-sm text-neutral-200 mt-1">{offer.description}</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Type: {offer.type} {offer.specialty ? ` · Spécialité: ${offer.specialty}` : ''}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}