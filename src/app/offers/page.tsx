'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Briefcase, MapPin, Search, SlidersHorizontal, Sparkles, Plus, X, Send } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import CityAutocomplete from '@/components/CityAutocomplete'
import OfferCard, { type Offer } from '@/components/offers/OfferCard'
import PublishOfferModal from '@/components/offers/PublishOfferModal'
import LsIcon from '@/components/ui/LsIcon'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

/* ─── Contenu principal (nécessite useSearchParams) ─────── */
function OffersInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth() as { user: { id: number | string; role: string; name?: string; avatarUrl?: string | null } | null }

  const [offers, setOffers]             = useState<Offer[]>([])
  const [loading, setLoading]           = useState(true)
  const [filters, setFilters]           = useState({
    type: '', specialty: '', location: '', country: '',
  })
  const [forMe, setForMe]               = useState(false)
  const [filtersOpen, setFiltersOpen]   = useState(false)
  const [userSpecialties, setUserSpec]  = useState<string[]>([])

  // Organisateurs, et prestataires qui cherchent un partenaire
  const canPublish   = user?.role === 'ORGANIZER' || user?.role === 'PROVIDER'
  const canFilterMe  = user?.role === 'ARTIST' || user?.role === 'PROVIDER'
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  // Modal publication (organisateurs)
  const [showPublish, setShowPublish]     = useState(false)


  // Auto-fill ville/pays depuis le profil
  const [userLocation, setUserLocation] = useState('')
  const [userCountry, setUserCountry]   = useState('')

  // Postuler
  const [applyingId, setApplyingId] = useState<number | null>(null)

  // Modal partager
  const [shareOffer, setShareOffer]   = useState<Offer | null>(null)
  const [shareQuery, setShareQuery]   = useState('')
  const [shareUsers, setShareUsers]   = useState<{ id: number; pseudo?: string; firstName?: string; lastName?: string; avatar?: string | null }[]>([])
  const [shareSubmitting, setShareSubmitting] = useState(false)
  const [shareSuccess, setShareSuccess]       = useState(false)

  // Lire les filtres depuis l'URL (réactif aux navigations Similaires)
  useEffect(() => {
    const specialty = searchParams.get('specialty') || ''
    const location  = searchParams.get('location')  || ''
    if (specialty || location) {
      setFilters(prev => ({ ...prev, specialty, location }))
    }
  }, [searchParams])

  // Charger le profil connecté (spécialités + ville/pays)
  useEffect(() => {
    if (!user?.id) return
    const headers: Record<string, string> = {}
    apiFetch(`${API_BASE}/api/profile/user/${user.id}`, { credentials: 'include', headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.profile) return
        if (data.profile.specialties) setUserSpec(data.profile.specialties)
        if (data.profile.location)    setUserLocation(data.profile.location)
        if (data.profile.country)     setUserCountry(data.profile.country)
      })
      .catch(() => {})
  }, [user?.id])

  // Filtrage "Pour moi"
  const visibleOffers = forMe && user
    ? offers.filter(o => {
        const roleMatch = o.type === user.role || o.type === 'ALL'
        if (!roleMatch) return false
        if (o.specialty) {
          const sp = o.specialty.toLowerCase().trim()
          return userSpecialties.some(s => s.toLowerCase().trim() === sp)
        }
        return true
      })
    : offers

  // Lien direct vers une offre (depuis un profil) : /offers?offer=12
  const focusedOfferId = Number(searchParams.get('offer')) || null

  const loadOffers = useCallback(async () => {
    setLoading(true)
    try {
      if (focusedOfferId) {
        const res = await apiFetch(`${API_BASE}/api/offers/${focusedOfferId}`)
        setOffers(res.ok ? [await res.json()] : [])
        return
      }
      const params = new URLSearchParams()
      if (filters.type)      params.set('type',      filters.type)
      if (filters.specialty) params.set('specialty', filters.specialty)
      if (filters.location)  params.set('location',  filters.location)
      if (filters.country)   params.set('country',   filters.country)
      const res = await apiFetch(`${API_BASE}/api/offers?${params}`)
      if (res.ok) setOffers(await res.json())
    } catch (err) {
      console.error('Erreur chargement offres:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, focusedOfferId])

  useEffect(() => {
    const t = setTimeout(loadOffers, 400)
    return () => clearTimeout(t)
  }, [loadOffers])

  // Recherche utilisateurs pour le partage (param "name" attendu par le backend)
  useEffect(() => {
    if (!shareOffer || shareQuery.trim().length < 2) { setShareUsers([]); return }
    const t = setTimeout(async () => {
      try {
        const headers: Record<string, string> = {}
        const res = await apiFetch(`${API_BASE}/api/search?name=${encodeURIComponent(shareQuery)}`, { credentials: 'include', headers })
        if (res.ok) {
          const data = await res.json()
          setShareUsers((data.users || []).slice(0, 8))
        }
      } catch { setShareUsers([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [shareQuery, shareOffer])

  // Postuler → appelle l'API et redirige vers la conversation
  const handleApply = async (offer: Offer) => {
    if (!user) { router.push('/login'); return }
    setApplyingId(offer.id)
    try {
      const res = await apiFetch(`${API_BASE}/api/offers/${offer.id}/apply`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Bonjour, je suis intéressé(e) par votre offre "${offer.title}". N'hésitez pas à consulter mon profil.` }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.conversationId) {
          router.push(`/messages?c=${data.conversationId}`)
        } else {
          router.push('/messages')
        }
      }
    } catch { /* silent */ } finally {
      setApplyingId(null)
    }
  }

  // Partager → utilise l'endpoint dédié share-offer
  const sendShare = async (toUserId: number) => {
    if (!shareOffer) return
    setShareSubmitting(true)
    try {
      await apiFetch(`${API_BASE}/api/messages/share-offer`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: toUserId, offerId: shareOffer.id }),
      })
      setShareSuccess(true)
      setTimeout(() => { setShareOffer(null); setShareSuccess(false); setShareQuery(''); setShareUsers([]) }, 1800)
    } catch { /* silent */ } finally {
      setShareSubmitting(false)
    }
  }



  return (
    <main className="min-h-screen text-white lsb-surface-page lsb-offers-page">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── En-tête ── */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="lsb-eyebrow">OPPORTUNITÉS</p>
            <div className="flex items-center gap-2 mb-1"><Briefcase className="w-5 h-5 text-purple-400" /><h1 className="text-2xl md:text-3xl font-bold">Trouvez votre prochaine scène<span className="text-violet-400">.</span></h1></div>
            <p className="text-white/40 text-sm">Les projets publiés par les organisateurs du réseau.</p>
          </div>
          {canPublish && (
            <button
              onClick={() => setShowPublish(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-medium transition flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Publier une offre
            </button>
          )}
        </div>

        {/* ── Filtres ── */}
        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-3 sm:p-4 mb-5 sm:mb-8">
          {/* Téléphone : une seule ligne, les filtres s'ouvrent au besoin */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => setFiltersOpen(v => !v)}
              aria-expanded={filtersOpen}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                filtersOpen || activeFilterCount > 0
                  ? 'border-purple-500/50 bg-purple-600/20 text-purple-200'
                  : 'border-white/10 text-white/70'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
            </button>
            {canFilterMe && (
              <button
                onClick={() => setForMe(v => !v)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  forMe ? 'border-purple-500/50 bg-purple-600/30 text-purple-200' : 'border-white/10 text-white/60'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Pour moi
              </button>
            )}
          </div>
          <div className="hidden sm:flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-white/40" />
              <span className="text-sm font-medium text-white/60">Filtrer les offres</span>
              {(Object.values(filters).some(Boolean) || forMe) && (
                <button
                  onClick={() => { setFilters({ type: '', specialty: '', location: '', country: '' }); setForMe(false) }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 transition-all"
                >
                  <X className="w-3 h-3" />
                  Réinitialiser
                </button>
              )}
            </div>
            {canFilterMe && (
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
          <div className={`${filtersOpen ? 'grid' : 'hidden'} mt-3 sm:mt-0 sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`}>
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

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                value={filters.specialty}
                onChange={e => setFilters(p => ({ ...p, specialty: e.target.value }))}
                placeholder="Spécialité (DJ, Photo…)"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/30 pointer-events-none z-10" />
              <CityAutocomplete
                value={filters.location}
                onChange={v => setFilters(p => ({ ...p, location: v }))}
                placeholder="Ville"
                inputClassName="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                value={filters.country}
                onChange={e => setFilters(p => ({ ...p, country: e.target.value }))}
                placeholder="Pays"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {(activeFilterCount > 0 || forMe) && (
              <button
                onClick={() => { setFilters({ type: '', specialty: '', location: '', country: '' }); setForMe(false) }}
                className="sm:hidden flex items-center justify-center gap-1.5 rounded-xl border border-white/10 py-2.5 text-sm text-white/50"
              >
                <X className="w-4 h-4" />
                Réinitialiser les filtres
              </button>
            )}
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
            {focusedOfferId ? (
              <button type="button" onClick={() => router.push('/offers')} className="mb-4 text-xs text-violet-300 hover:text-white">← Voir toutes les offres</button>
            ) : (
              <p className="text-xs text-white/30 mb-4">{visibleOffers.length} offre{visibleOffers.length > 1 ? 's' : ''}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleOffers.map(offer => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  isLoggedIn={!!user}
                  isOwner={!!user && Number(user.id) === offer.organizer.userId}
                  applying={applyingId === offer.id}
                  onApply={handleApply}
                  onShare={o => { setShareOffer(o); setShareQuery(''); setShareUsers([]); setShareSuccess(false) }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Modal : Partager ── */}
      {shareOffer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShareOffer(null)}>
          <div className="max-w-sm w-full bg-neutral-950 border border-white/10 rounded-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Partager cette offre</h3>
              <button onClick={() => setShareOffer(null)} className="text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {shareSuccess ? (
              <p className="flex items-center justify-center gap-2 text-green-400 py-6"><LsIcon name="check" size={18} tone="inherit" />Offre partagée !</p>
            ) : (
              <>
                <input
                  autoFocus
                  value={shareQuery}
                  onChange={e => setShareQuery(e.target.value)}
                  placeholder="Rechercher un utilisateur…"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500/40 mb-3"
                />
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {shareUsers.map(u => {
                    const name = u.pseudo || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Utilisateur'
                    return (
                      <button
                        key={u.id}
                        onClick={() => sendShare(u.id)}
                        disabled={shareSubmitting}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition text-left disabled:opacity-50"
                      >
                        <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                          {u.avatar ? (
                            <Image src={u.avatar} alt={name} width={32} height={32} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-white/50 font-bold">{name[0]?.toUpperCase()}</div>
                          )}
                        </div>
                        <span className="text-sm text-white/80">{name}</span>
                        <Send className="w-3.5 h-3.5 text-white/30 ml-auto" />
                      </button>
                    )
                  })}
                  {shareQuery.length >= 2 && shareUsers.length === 0 && (
                    <p className="text-xs text-white/30 text-center py-4">Aucun utilisateur trouvé</p>
                  )}
                  {shareQuery.length < 2 && (
                    <p className="text-xs text-white/20 text-center py-3">Tapez au moins 2 caractères…</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modal : publier une offre (organisateurs) — formulaire + aperçu en direct ── */}
      {showPublish && (
        <PublishOfferModal
          defaultLocation={userLocation}
          defaultCountry={userCountry}
          onClose={() => setShowPublish(false)}
          onPublished={saved => { setOffers(prev => [saved, ...prev]); setShowPublish(false) }}
        />
      )}
    </main>
  )
}

/* ─── Export — Suspense requis pour useSearchParams ─────── */
export default function OffersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OffersInner />
    </Suspense>
  )
}
