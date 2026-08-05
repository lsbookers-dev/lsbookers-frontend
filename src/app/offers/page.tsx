'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Briefcase, MapPin, Calendar, Euro, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getAuthToken } from '@/utils/auth'

/* ─── Types ─────────────────────────────────────────────── */
type Offer = {
  id: number
  title: string
  description: string
  type: 'ARTIST' | 'PROVIDER' | 'ALL'
  specialty?: string | null
  date: string
  location: string
  country: string
  fee?: number | null
  createdAt: string
  organizerId: number
  organizer: {
    id: number
    userId: number
    avatar: string | null
    name: string
  }
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

const TYPE_LABELS: Record<string, string> = {
  ARTIST:   'Artiste',
  PROVIDER: 'Prestataire',
  ALL:      'Tous profils',
}

const TYPE_COLORS: Record<string, string> = {
  ARTIST:   'bg-pink-500/15 text-pink-300 border-pink-500/20',
  PROVIDER: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  ALL:      'bg-purple-500/15 text-purple-300 border-purple-500/20',
}

/* ─── Carte d'offre ─────────────────────────────────────── */
function OfferCard({
  offer,
  canApply,
  onApply,
}: {
  offer: Offer
  canApply: boolean
  onApply: (offer: Offer) => void
}) {
  const date = new Date(offer.date)
  const dateStr = date.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5 flex flex-col gap-4 hover:border-white/20 transition-colors">

      {/* Organisateur + badge type */}
      <div className="flex items-start justify-between gap-3">
        <Link href={`/organizer/${offer.organizer.userId}`} className="flex items-center gap-3 min-w-0 group">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border border-white/10 flex-shrink-0">
            {offer.organizer.avatar ? (
              <Image
                src={offer.organizer.avatar}
                alt={offer.organizer.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50 text-sm font-bold">
                {offer.organizer.name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
              {offer.organizer.name}
            </p>
            <p className="text-xs text-white/40">Organisateur</p>
          </div>
        </Link>

        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0 ${TYPE_COLORS[offer.type]}`}>
          {TYPE_LABELS[offer.type]}
        </span>
      </div>

      {/* Titre + spécialité */}
      <div>
        <h3 className="font-semibold text-white leading-snug">{offer.title}</h3>
        {offer.specialty && (
          <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
            {offer.specialty}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-white/60 leading-relaxed line-clamp-3 flex-1">
        {offer.description}
      </p>

      {/* Infos : date, lieu, tarif */}
      <div className="flex flex-wrap gap-3 text-xs text-white/50">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          {dateStr} à {timeStr}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          {offer.location}, {offer.country}
        </span>
        {offer.fee != null && (
          <span className="flex items-center gap-1.5 text-green-400/80 font-medium">
            <Euro className="w-3.5 h-3.5 flex-shrink-0" />
            {offer.fee.toLocaleString('fr-FR')} €
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-3 border-t border-white/5">
        <Link
          href={`/organizer/${offer.organizer.userId}`}
          className="text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Voir le profil →
        </Link>
        {canApply && (
          <button
            onClick={() => onApply(offer)}
            className="ml-auto bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-semibold px-5 py-2 rounded-full transition-all"
          >
            Postuler
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Page principale ───────────────────────────────────── */
export default function OffersPage() {
  const { user } = useAuth() as { user: { id: number | string; role: string } | null }
  const router = useRouter()

  const [offers, setOffers]             = useState<Offer[]>([])
  const [loading, setLoading]           = useState(true)
  const [filters, setFilters]           = useState({
    type: '', specialty: '', location: '', country: '',
  })
  const [forMe, setForMe]               = useState(false)
  const [userSpecialties, setUserSpec]  = useState<string[]>([])

  const canApply = user?.role === 'ARTIST' || user?.role === 'PROVIDER'

  // Charger les spécialités du profil connecté
  useEffect(() => {
    if (!user?.id || !canApply) return
    const token = getAuthToken()
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
    fetch(`${API_BASE}/api/profile/user/${user.id}`, { credentials: 'include', headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.profile?.specialties) setUserSpec(data.profile.specialties)
      })
      .catch(() => {})
  }, [user?.id, canApply])

  // Filtrage "Pour moi" côté client
  const visibleOffers = forMe && user
    ? offers.filter(o => {
        // L'offre doit cibler le rôle de l'utilisateur ou "ALL"
        const roleMatch = o.type === user.role || o.type === 'ALL'
        if (!roleMatch) return false
        // Si l'offre précise une spécialité, vérifier qu'elle correspond
        if (o.specialty) {
          const sp = o.specialty.toLowerCase().trim()
          return userSpecialties.some(s => s.toLowerCase().trim() === sp)
        }
        return true
      })
    : offers

  const loadOffers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.type)      params.set('type',      filters.type)
      if (filters.specialty) params.set('specialty', filters.specialty)
      if (filters.location)  params.set('location',  filters.location)
      if (filters.country)   params.set('country',   filters.country)

      const res = await fetch(`${API_BASE}/api/offers?${params}`)
      if (res.ok) setOffers(await res.json())
    } catch (err) {
      console.error('Erreur chargement offres:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Debounce : attend 400ms après le dernier changement de filtre
  useEffect(() => {
    const t = setTimeout(loadOffers, 400)
    return () => clearTimeout(t)
  }, [loadOffers])

  const handleApply = (offer: Offer) => {
    router.push(
      `/messages/new?to=${offer.organizer.userId}&subject=${encodeURIComponent(`Candidature : ${offer.title}`)}`
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── En-tête ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-5 h-5 text-purple-400" />
            <h1 className="text-2xl md:text-3xl font-bold">Offres</h1>
          </div>
          <p className="text-white/40 text-sm">
            Opportunités publiées par les organisateurs
          </p>
        </div>

        {/* ── Filtres ── */}
        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4 mb-8">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-white/40" />
              <span className="text-sm font-medium text-white/60">Filtrer les offres</span>
            </div>
            {canApply && (
              <button
                onClick={() => setForMe(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  forMe
                    ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
                    : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Offres qui me concernent
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Type */}
            <select
              value={filters.type}
              onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
              className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-purple-500/50"
            >
              <option value="">Tous les types</option>
              <option value="ARTIST">Artiste</option>
              <option value="PROVIDER">Prestataire</option>
              <option value="ALL">Tous profils</option>
            </select>

            {/* Spécialité */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                value={filters.specialty}
                onChange={e => setFilters(p => ({ ...p, specialty: e.target.value }))}
                placeholder="Spécialité (DJ, Photo…)"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Ville */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                value={filters.location}
                onChange={e => setFilters(p => ({ ...p, location: e.target.value }))}
                placeholder="Ville"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Pays */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                value={filters.country}
                onChange={e => setFilters(p => ({ ...p, country: e.target.value }))}
                placeholder="Pays"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>
        </div>

        {/* ── Liste ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visibleOffers.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {forMe ? 'Aucune offre ne correspond à votre profil pour le moment' : 'Aucune offre disponible pour le moment'}
            </p>
            {(Object.values(filters).some(Boolean) || forMe) && (
              <button
                onClick={() => { setFilters({ type: '', specialty: '', location: '', country: '' }); setForMe(false) }}
                className="mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-white/30 mb-4">{visibleOffers.length} offre{visibleOffers.length > 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleOffers.map(offer => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  canApply={canApply}
                  onApply={handleApply}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
