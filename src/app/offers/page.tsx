'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Briefcase, MapPin, Calendar, Euro, Search, SlidersHorizontal, Sparkles, Plus, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getAuthToken } from '@/utils/auth'
import { getSpecialtiesForOfferType } from '@/constants/specialties'

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

type OfferForm = {
  title: string; description: string
  type: 'ARTIST' | 'PROVIDER' | 'ALL'; specialty: string
  date: string; time: string; location: string; country: string; fee: string
}

const EMPTY_FORM: OfferForm = {
  title: '', description: '', type: 'ARTIST', specialty: '',
  date: '', time: '', location: '', country: '', fee: '',
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

/* ─── Config couleurs par type d'offre ──────────────────── */
const TYPE_CONFIG = {
  ARTIST:   { label: 'Artiste',      gradient: 'from-pink-500 to-rose-600',     border: 'border-pink-500/25',   badge: 'bg-pink-500/15 text-pink-300 border-pink-500/25',   apply: 'from-pink-600 to-rose-600' },
  PROVIDER: { label: 'Prestataire',  gradient: 'from-violet-500 to-purple-600', border: 'border-violet-500/25', badge: 'bg-violet-500/15 text-violet-300 border-violet-500/25', apply: 'from-violet-600 to-purple-600' },
  ALL:      { label: 'Tous profils', gradient: 'from-purple-500 to-indigo-600', border: 'border-purple-500/25', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/25', apply: 'from-purple-600 to-indigo-600' },
} as const

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
  const cfg = TYPE_CONFIG[offer.type]
  const date = new Date(offer.date)
  const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`group relative rounded-2xl border ${cfg.border} bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-200 overflow-hidden flex flex-col`}>

      {/* Trait couleur en haut — identique aux cartes de recherche */}
      <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${cfg.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* Organisateur + badge type */}
        <div className="flex items-start justify-between gap-3">
          <Link href={`/organizer/${offer.organizer.userId}`} className="flex items-center gap-3 min-w-0 group/link">
            <div className="relative flex-shrink-0">
              <div className={`absolute -inset-0.5 rounded-full bg-gradient-to-br ${cfg.gradient} opacity-0 group-hover:opacity-30 transition-opacity blur-sm`} />
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border border-white/10">
                {offer.organizer.avatar ? (
                  <Image src={offer.organizer.avatar} alt={offer.organizer.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50 text-sm font-bold">
                    {offer.organizer.name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white group-hover/link:text-white/80 transition-colors truncate">
                {offer.organizer.name}
              </p>
              <p className="text-xs text-white/40">Organisateur</p>
            </div>
          </Link>

          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0 ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>

        {/* Titre + spécialité */}
        <div>
          <h3 className="font-semibold text-white leading-snug">{offer.title}</h3>
          {offer.specialty && (
            <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full border ${cfg.badge}`}>
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
          <Link href={`/organizer/${offer.organizer.userId}`} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            Voir le profil →
          </Link>
          {canApply && (
            <button
              onClick={() => onApply(offer)}
              className={`ml-auto text-xs font-semibold px-5 py-2 rounded-full transition-all active:scale-95 bg-gradient-to-r ${cfg.apply} hover:opacity-90 text-white`}
            >
              Postuler
            </button>
          )}
        </div>
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

  const canApply    = user?.role === 'ARTIST' || user?.role === 'PROVIDER'
  const isOrganizer = user?.role === 'ORGANIZER'

  // Modal publication (organisateurs)
  const [showPublish, setShowPublish]     = useState(false)
  const [pubForm, setPubForm]             = useState<OfferForm>(EMPTY_FORM)
  const [pubSubmitting, setPubSubmitting] = useState(false)
  const [pubError, setPubError]           = useState<string | null>(null)

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

  const submitPublish = async () => {
    if (!pubForm.title.trim() || !pubForm.description.trim() || !pubForm.date || !pubForm.location.trim() || !pubForm.country.trim()) {
      setPubError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    if (!pubForm.specialty) {
      setPubError('Veuillez sélectionner une spécialité.')
      return
    }
    setPubError(null)
    setPubSubmitting(true)
    try {
      const token = getAuthToken()
      const dateTime = pubForm.time ? `${pubForm.date}T${pubForm.time}:00` : `${pubForm.date}T00:00:00`
      const res = await fetch(`${API_BASE}/api/offers`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          title: pubForm.title.trim(), description: pubForm.description.trim(),
          type: pubForm.type, specialty: pubForm.specialty || null,
          date: dateTime, location: pubForm.location.trim(),
          country: pubForm.country.trim(), fee: pubForm.fee ? parseFloat(pubForm.fee) : null,
        }),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      setOffers(prev => [saved, ...prev])
      setPubForm(EMPTY_FORM)
      setShowPublish(false)
    } catch {
      setPubError('Échec de la publication. Réessayez.')
    } finally {
      setPubSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── En-tête ── */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-5 h-5 text-purple-400" />
              <h1 className="text-2xl md:text-3xl font-bold">Offres</h1>
            </div>
            <p className="text-white/40 text-sm">
              Opportunités publiées par les organisateurs
            </p>
          </div>
          {isOrganizer && (
            <button
              onClick={() => { setPubForm(EMPTY_FORM); setPubError(null); setShowPublish(true) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-medium transition flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Publier une offre
            </button>
          )}
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

      {/* ── Modal : publier une offre (organisateurs) ── */}
      {showPublish && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPublish(false)}>
          <div className="max-w-lg w-full bg-neutral-950 border border-white/10 rounded-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Publier une offre</h3>
              <button onClick={() => setShowPublish(false)} className="text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input required value={pubForm.title} onChange={e => setPubForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Titre *"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500/40"
              />
              <textarea required rows={3} value={pubForm.description} onChange={e => setPubForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Description *"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500/40 resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <select value={pubForm.type} onChange={e => setPubForm(p => ({ ...p, type: e.target.value as OfferForm['type'], specialty: '' }))}
                  className="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500/40">
                  <option value="ARTIST">Artiste</option>
                  <option value="PROVIDER">Prestataire</option>
                  <option value="ALL">Tous profils</option>
                </select>
                <select value={pubForm.specialty} onChange={e => setPubForm(p => ({ ...p, specialty: e.target.value }))}
                  className="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500/40">
                  <option value="">Spécialité *</option>
                  {getSpecialtiesForOfferType(pubForm.type).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input required type="date" value={pubForm.date} onChange={e => setPubForm(p => ({ ...p, date: e.target.value }))}
                  className="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500/40"
                />
                <input type="time" value={pubForm.time} onChange={e => setPubForm(p => ({ ...p, time: e.target.value }))}
                  className="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input required value={pubForm.location} onChange={e => setPubForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="Ville *"
                  className="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500/40"
                />
                <input required value={pubForm.country} onChange={e => setPubForm(p => ({ ...p, country: e.target.value }))}
                  placeholder="Pays *"
                  className="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500/40"
                />
              </div>
              <input type="number" min="0" step="0.01" value={pubForm.fee} onChange={e => setPubForm(p => ({ ...p, fee: e.target.value }))}
                placeholder="Tarif proposé (optionnel)"
                className="h-10 w-full bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500/40"
              />
              {pubError && <p className="text-xs text-red-400">{pubError}</p>}
              <button onClick={submitPublish} disabled={pubSubmitting}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition">
                {pubSubmitting ? 'Publication…' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
