'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, MapPin, User } from 'lucide-react'

type Offer = {
  id: number
  title: string
  description: string
  type: 'ARTIST' | 'PROVIDER' | 'ALL'
  location: string
  date: string
  organizerName: string
}

const mockOffers: Offer[] = [
  {
    id: 1,
    title: 'DJ pour mariage privé',
    description: 'Recherche DJ expérimenté pour animer un mariage à Lyon.',
    type: 'ARTIST',
    location: 'Lyon',
    date: '2025-09-28',
    organizerName: 'Events Lyon',
  },
  {
    id: 2,
    title: 'Photographe soirée entreprise',
    description: 'Besoin d’un prestataire photo pour une soirée corporate à Paris.',
    type: 'PROVIDER',
    location: 'Paris',
    date: '2025-10-02',
    organizerName: 'StartUp Night',
  },
  {
    id: 3,
    title: 'DJ + Photobooth pour mariage',
    description: 'Cherche deux prestataires pour mariage à Marseille.',
    type: 'ALL',
    location: 'Marseille',
    date: '2025-10-15',
    organizerName: 'Mariage Provence',
  },
]

export default function OffersPage() {
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ARTIST' | 'PROVIDER' | ''>('')
  const [locationFilter, setLocationFilter] = useState('')
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>(mockOffers)

  useEffect(() => {
    let offers = [...mockOffers]
    if (typeFilter && typeFilter !== 'ALL') {
      offers = offers.filter(o => o.type === typeFilter || o.type === 'ALL')
    }
    if (locationFilter.trim() !== '') {
      offers = offers.filter(o =>
        o.location.toLowerCase().includes(locationFilter.toLowerCase())
      )
    }
    setFilteredOffers(offers)
  }, [typeFilter, locationFilter])

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Offres disponibles</h1>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          className="bg-neutral-900 border border-white/10 rounded px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as 'ALL' | 'ARTIST' | 'PROVIDER' | '')
          }
        >
          <option value="">Tous les types</option>
          <option value="ARTIST">Offres pour artistes</option>
          <option value="PROVIDER">Offres pour prestataires</option>
        </select>
        <input
          className="bg-neutral-900 border border-white/10 rounded px-3 py-2 text-sm"
          placeholder="Filtrer par ville"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        />
      </div>

      {/* Liste d’offres */}
      <div className="space-y-4">
        {filteredOffers.map((offer) => (
          <div
            key={offer.id}
            className="bg-neutral-900 border border-white/10 rounded-xl p-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{offer.title}</h2>
              <span className="text-sm px-2 py-1 rounded-full bg-pink-600/20 text-pink-400 border border-pink-600/40">
                {offer.type === 'ARTIST'
                  ? 'Artiste'
                  : offer.type === 'PROVIDER'
                  ? 'Prestataire'
                  : 'Tous'}
              </span>
            </div>
            <p className="text-sm text-neutral-300 mt-2">{offer.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-neutral-400">
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                {offer.location}
              </div>
              <div className="flex items-center gap-1">
                <CalendarDays size={14} />
                {new Date(offer.date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <User size={14} />
                {offer.organizerName}
              </div>
            </div>
            <div className="mt-4">
              <button
                className="bg-pink-600 hover:bg-pink-500 text-white text-sm px-4 py-2 rounded-lg"
                onClick={() => alert(`Contacter ${offer.organizerName}`)}
              >
                Postuler
              </button>
            </div>
          </div>
        ))}

        {filteredOffers.length === 0 && (
          <p className="text-center text-sm text-neutral-500 mt-6">
            Aucune offre ne correspond à vos critères.
          </p>
        )}
      </div>
    </div>
  )
}