'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  Settings2, MessageCircle, Star, Plus, MapPin, Briefcase,
  Calendar, Euro, ChevronLeft, ChevronRight, X, Globe, Music, Youtube, Users,
  Instagram, Twitter, Facebook, Linkedin, Link, Building2, Pencil, Check,
} from 'lucide-react'
import AgendaCalendar from '@/components/AgendaCalendar'
import PublicationsSection from '@/components/PublicationsSection'
import CropModal from '@/components/CropModal'
import AddPublicationModal from '@/components/AddPublicationModal'
import AlbumsTab from '@/components/AlbumsTab'
import { getAuthToken } from '@/utils/auth'
import { getSpecialtiesForOfferType } from '@/constants/specialties'
import CityAutocomplete from '@/components/CityAutocomplete'

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

// ─────────────────────────────────────────────
// Types offres
// ─────────────────────────────────────────────
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
  status: string
}

type OfferForm = {
  title: string
  description: string
  type: 'ARTIST' | 'PROVIDER' | 'ALL'
  specialty: string
  date: string
  time: string
  location: string
  country: string
  fee: string
}

const EMPTY_OFFER_FORM: OfferForm = {
  title: '', description: '', type: 'ARTIST', specialty: '',
  date: '', time: '', location: '', country: '', fee: '',
}

const OFFERS_PER_PAGE = 3

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ApiProfile = {
  id: number
  userId: number
  bio?: string | null
  location?: string | null
  country?: string | null
  radiusKm?: number | null
  specialties?: string[]
  avatar?: string | null
  banner?: string | null
  availableForBooking?: boolean
  showRealName?: boolean
  followersCount?: number
  followingCount?: number
  reviewsAvg?: number | null
  reviewsCount?: number
  soundcloudUrl?: string | null
  showSoundcloud?: boolean
  youtubeUrl?: string | null
  showYoutubeUrl?: boolean
  instagramUrl?: string | null
  facebookUrl?: string | null
  tiktokUrl?: string | null
  twitterUrl?: string | null
  linkedinUrl?: string | null
  websiteUrl?: string | null
  address?: string | null
  postalCode?: string | null
  city?: string | null
  user?: {
    id: number
    pseudo?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string
    role?: string
  }
}

type Publication = {
  id: number
  title: string
  media: string
  mediaType: string
  caption?: string
  createdAt?: string
  _count?: { likes: number; comments: number }
}

type Review = {
  id: number
  rating: number
  comment?: string | null
  createdAt: string
  author?: {
    user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null }
    avatar?: string | null
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const displayName = (profile: ApiProfile | null): string => {
  if (!profile) return '—'
  const u = profile.user
  if (!u) return '—'
  // Pour un organisateur : toujours afficher le pseudo (nom de l'établissement)
  return u.pseudo || u.email || '—'
}

function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const t = typeof window !== 'undefined' ? getAuthToken() : null
  return t ? { Authorization: `Bearer ${t}`, ...extra } : { ...extra }
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function OrganizerProfilePage() {
  const router = useRouter()
  const { user } = useAuth()

  const [profile, setProfile] = useState<ApiProfile | null>(null)
  const [publications, setPublications] = useState<Publication[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [pubTab, setPubTab]   = useState<'publications' | 'albums'>('publications')
  const [loading, setLoading] = useState(true)

  // Offres
  const [myOffers, setMyOffers]         = useState<Offer[]>([])
  const [offerPage, setOfferPage]       = useState(0)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerForm, setOfferForm]       = useState<OfferForm>(EMPTY_OFFER_FORM)
  const [offerSubmitting, setOfferSubmitting] = useState(false)
  const [offerError, setOfferError]     = useState<string | null>(null)

  // Coordonnées — édition inline
  const [editingContact, setEditingContact] = useState(false)
  const [contactForm, setContactForm] = useState({
    instagramUrl: '', facebookUrl: '', tiktokUrl: '', twitterUrl: '',
    linkedinUrl: '', websiteUrl: '', soundcloudUrl: '', youtubeUrl: '',
    address: '', postalCode: '', city: '',
  })
  const [contactSaving, setContactSaving] = useState(false)

  // Publication modal
  const [showAddPub, setShowAddPub] = useState(false)

  // Avatar / Bannière — upload inline
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [cropModal, setCropModal] = useState<{ src: string; type: 'avatar' | 'banner' } | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // ── Chargement du profil
  useEffect(() => {
    if (!user) return
    const userId = typeof user.id === 'string' ? parseInt(user.id) : Number(user.id)

    fetch(`${API}/api/profile/user/${userId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(({ profile: p }) => {
        if (!p) return
        setProfile(p)
        setContactForm({
          instagramUrl: p.instagramUrl || '',
          facebookUrl: p.facebookUrl || '',
          tiktokUrl: p.tiktokUrl || '',
          twitterUrl: p.twitterUrl || '',
          linkedinUrl: p.linkedinUrl || '',
          websiteUrl: p.websiteUrl || '',
          soundcloudUrl: p.soundcloudUrl || '',
          youtubeUrl: p.youtubeUrl || '',
          address: p.address || '',
          postalCode: p.postalCode || '',
          city: p.city || '',
        })

        if (p.id) {
          fetch(`${API}/api/publications/profile/${p.id}`)
            .then(r => r.json())
            .then(d => setPublications(d.publications || []))
            .catch(() => {})
        }

        if (p.id) {
          fetch(`${API}/api/reviews/profile/${p.id}`)
            .then(r => r.json())
            .then(d => setReviews(d.reviews || []))
            .catch(() => {})
        }

        // Charger les offres publiées par cet organisateur
        fetch(`${API}/api/offers?organizerId=${p.id}`)
          .then(r => r.json())
          .then(d => setMyOffers(Array.isArray(d) ? d : []))
          .catch(() => {})
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  // ── Supprimer une publication
  const deletePublication = async (id: number) => {
    if (!confirm('Supprimer cette publication ?')) return
    try {
      const res = await fetch(`${API}/api/publications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Suppression échouée')
      setPublications(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error(err)
      alert('Échec de la suppression.')
    }
  }

  // ── Publier une offre (sans événement)
  const submitOffer = async () => {
    if (!offerForm.title.trim() || !offerForm.description.trim() || !offerForm.date || !offerForm.location.trim() || !offerForm.country.trim()) {
      setOfferError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    if (!offerForm.specialty) {
      setOfferError('Veuillez sélectionner une spécialité.')
      return
    }
    setOfferError(null)
    setOfferSubmitting(true)
    try {
      const token = getAuthToken()
      const dateTime = offerForm.time ? `${offerForm.date}T${offerForm.time}:00` : `${offerForm.date}T00:00:00`
      const res = await fetch(`${API}/api/offers`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          title: offerForm.title.trim(),
          description: offerForm.description.trim(),
          type: offerForm.type,
          specialty: offerForm.specialty,
          date: dateTime,
          location: offerForm.location.trim(),
          country: offerForm.country.trim(),
          fee: offerForm.fee ? parseFloat(offerForm.fee) : null,
        }),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      const saved = await res.json()
      setMyOffers(prev => [saved, ...prev])
      setOfferForm(EMPTY_OFFER_FORM)
      setShowOfferModal(false)
      setOfferPage(0)
    } catch {
      setOfferError('Échec de la publication. Réessayez.')
    } finally {
      setOfferSubmitting(false)
    }
  }

  // ── Supprimer une offre
  const deleteOffer = async (id: number) => {
    if (!confirm('Supprimer cette offre ?')) return
    try {
      const token = getAuthToken()
      await fetch(`${API}/api/offers/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setMyOffers(prev => prev.filter(o => o.id !== id))
    } catch {
      alert('Erreur lors de la suppression.')
    }
  }

  // ── Sauvegarder les coordonnées
  const saveContact = async () => {
    if (!profile) return
    setContactSaving(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API}/api/profile/${profile.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(contactForm),
      })
      if (res.ok) {
        const { profile: updated } = await res.json()
        setProfile(prev => prev ? { ...prev, ...updated } : prev)
        setEditingContact(false)
      }
    } catch { /* silencieux */ }
    finally { setContactSaving(false) }
  }

  // ── Sauvegarder un champ quelconque
  const saveField = async (data: Record<string, string | null>) => {
    if (!profile) return false
    const token = getAuthToken()
    const res = await fetch(`${API}/api/profile/${profile.id}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const { profile: updated } = await res.json()
      setProfile(prev => prev ? { ...prev, ...updated } : prev)
      return true
    }
    return false
  }

  // ── Upload avatar / bannière inline
  const uploadImage = async (file: File, folder: 'avatars' | 'banners') => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', folder)
    const res = await fetch(`${API}/api/upload`, {
      method: 'POST', credentials: 'include', headers: getAuthHeaders(), body: fd,
    })
    if (!res.ok) throw new Error('Upload échoué')
    const data = await res.json()
    return data.url as string
  }

  const openCrop = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (file.size > 100 * 1024 * 1024) { alert('Le fichier dépasse 100 Mo.'); return }
    const reader = new FileReader()
    reader.onload = () => setCropModal({ src: reader.result as string, type })
    reader.readAsDataURL(file)
  }

  const handleCropConfirm = async (blob: Blob) => {
    const type = cropModal?.type
    setCropModal(null)
    if (!type || !profile) return
    const file = new File([blob], `${type}.jpg`, { type: 'image/jpeg' })
    if (type === 'avatar') {
      setUploadingAvatar(true)
      try {
        const url = await uploadImage(file, 'avatars')
        const ok = await saveField({ avatar: url })
        if (ok) setProfile(p => p ? { ...p, avatar: url } : p)
      } catch { alert("Erreur lors de l'upload") }
      finally { setUploadingAvatar(false) }
    } else {
      setUploadingBanner(true)
      try {
        const url = await uploadImage(file, 'banners')
        const ok = await saveField({ banner: url })
        if (ok) setProfile(p => p ? { ...p, banner: url } : p)
      } catch { alert("Erreur lors de l'upload") }
      finally { setUploadingBanner(false) }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-neutral-400">Chargement…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── Bannière */}
      <div
        className="relative h-56 sm:h-64 md:h-72 lg:h-80 group cursor-pointer"
        onClick={() => bannerInputRef.current?.click()}
      >
        {profile?.banner ? (
          <Image src={profile.banner} alt="Bannière" fill priority className="object-cover opacity-90" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-pink-900/60 to-black" />
        )}
        {/* Overlay hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploadingBanner
            ? <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Pencil size={28} className="text-white drop-shadow-lg" />
          }
        </div>
        <button
          onClick={e => { e.stopPropagation(); router.push('/settings/profile') }}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl flex items-center gap-2 backdrop-blur z-10"
        >
          <Settings2 size={18} />
          Paramètres
        </button>
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => openCrop(e, 'banner')} />
      </div>

      {/* ── En-tête sous bannière */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="relative h-20 w-20 rounded-full overflow-hidden ring-4 ring-black flex-shrink-0 group cursor-pointer"
            onClick={() => avatarInputRef.current?.click()}
          >
            {profile?.avatar ? (
              <Image src={profile.avatar} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-pink-800 flex items-center justify-center text-2xl font-bold">
                {displayName(profile).charAt(0).toUpperCase()}
              </div>
            )}
            {/* Overlay hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
              {uploadingAvatar
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Pencil size={16} className="text-white" />
              }
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => openCrop(e, 'avatar')} />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{displayName(profile)}</h1>

            <div className="flex items-center gap-3 mt-1 text-sm text-neutral-400">
              <span><strong className="text-white">{profile?.followingCount ?? 0}</strong> abonné{(profile?.followingCount ?? 0) > 1 ? 's' : ''}</span>
              <span><strong className="text-white">{profile?.followersCount ?? 0}</strong> abonnement{(profile?.followersCount ?? 0) > 1 ? 's' : ''}</span>
              {profile?.reviewsAvg != null && (
                <span className="flex items-center gap-1">
                  <Star size={13} className="fill-yellow-400 text-yellow-400" />
                  {profile.reviewsAvg.toFixed(1)} ({profile.reviewsCount} avis)
                </span>
              )}
            </div>

            {(profile?.location || profile?.country) && (
              <p className="text-sm text-neutral-300 flex items-center gap-1 mt-1">
                <MapPin size={14} className="text-pink-500" />
                {[profile?.location, profile?.country].filter(Boolean).join(', ')}
                {profile?.radiusKm ? ` · Rayon ${profile.radiusKm} km` : ''}
              </p>
            )}

            {profile?.specialties && profile.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.specialties.map(s => (
                  <span key={s} className="text-xs px-2 py-1 rounded-full bg-pink-600/20 border border-pink-600/40">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button className="bg-white text-black rounded-full px-5 py-2 flex items-center gap-2 hover:bg-neutral-200">
          <MessageCircle size={18} /> Messages
        </button>
      </div>

      {/* ── Corps */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 pb-12">

        {/* ── Colonne gauche */}
        <div className="space-y-6">

          {/* À propos */}
          {profile?.bio && (
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
              <h2 className="text-base font-semibold mb-2 text-white/90">À propos</h2>
              <p className="text-sm text-neutral-300 leading-relaxed">{profile.bio}</p>
            </section>
          )}

          {/* Agenda */}
          {profile && (
            <AgendaCalendar
              profileId={profile.id}
              isOwner={true}
              showAvailability={false}
              defaultCountry={profile.country ?? null}
            />
          )}

          {/* Publications + Albums (onglets) */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1 bg-black/30 rounded-xl p-1">
                <button
                  onClick={() => setPubTab('publications')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${pubTab === 'publications' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  Publications
                </button>
                <button
                  onClick={() => setPubTab('albums')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${pubTab === 'albums' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  Albums
                </button>
              </div>
              {pubTab === 'publications' && (
                <button
                  onClick={() => setShowAddPub(true)}
                  className="text-xs px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center gap-1 transition"
                >
                  <Plus size={13} /> Ajouter
                </button>
              )}
            </div>

            {pubTab === 'publications' ? (
              <PublicationsSection
                publications={publications}
                isOwner={true}
                onDelete={deletePublication}
              />
            ) : profile ? (
              <AlbumsTab
                profileId={profile.id}
                isOwner={true}
                token={getAuthToken() ?? ''}
                accent="violet"
                publications={publications}
              />
            ) : null}
          </section>
        </div>

        {/* ── Colonne droite */}
        <aside className="space-y-5">

          {/* Avis */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star size={15} className="text-yellow-400" />
              <h2 className="text-base font-semibold">Avis</h2>
              {profile?.reviewsAvg != null && (
                <span className="ml-auto text-sm font-medium text-yellow-400">
                  {profile.reviewsAvg.toFixed(1)}<span className="text-neutral-500 text-xs font-normal"> / 5</span>
                </span>
              )}
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-neutral-500">Aucun avis pour l&apos;instant.</p>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 4).map(r => {
                  const rName = r.author?.user
                    ? (r.author.user.pseudo || [r.author.user.firstName, r.author.user.lastName].filter(Boolean).join(' ') || 'Anonyme')
                    : 'Anonyme'
                  return (
                    <div key={r.id} className="rounded-xl border border-white/8 bg-black/20 p-3">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="relative h-7 w-7 rounded-full overflow-hidden bg-neutral-700 flex-shrink-0">
                          {r.author?.avatar ? (
                            <Image src={r.author.avatar} alt={rName} fill className="object-cover" />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                              {rName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium leading-none mb-1">{rName}</p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={10} className={i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-600'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {r.comment && <p className="text-xs text-neutral-300 leading-relaxed">{r.comment}</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Vidéo de présentation */}
          {profile?.showYoutubeUrl !== false && profile?.youtubeUrl && (
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Youtube size={15} className="text-red-400" />
                <h2 className="text-base font-semibold">Vidéo de présentation</h2>
              </div>
              <div className="rounded-xl overflow-hidden aspect-video">
                <iframe
                  width="100%" height="100%"
                  src={(() => { const m = profile.youtubeUrl!.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/); return m ? `https://www.youtube.com/embed/${m[1]}` : profile.youtubeUrl! })()}
                  title="Vidéo de présentation" frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {/* Mes offres */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase size={15} className="text-pink-400" />
                <h2 className="text-base font-semibold">Mes offres</h2>
                {myOffers.length > 0 && (
                  <span className="text-xs text-neutral-500">({myOffers.length})</span>
                )}
              </div>
              <button
                onClick={() => { setOfferForm({ ...EMPTY_OFFER_FORM, location: profile?.location ?? '', country: profile?.country ?? '' }); setOfferError(null); setShowOfferModal(true) }}
                className="text-xs px-2.5 py-1 rounded-full bg-pink-600 hover:bg-pink-500 flex items-center gap-1 transition"
              >
                <Plus size={12} /> Publier
              </button>
            </div>

            {myOffers.length === 0 ? (
              <p className="text-sm text-neutral-500">Aucune offre publiée.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {myOffers.slice(offerPage * OFFERS_PER_PAGE, (offerPage + 1) * OFFERS_PER_PAGE).map(o => {
                    const dateStr = new Date(o.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                    return (
                      <div key={o.id} className="rounded-xl border border-white/8 bg-black/20 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{o.title}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-neutral-500">
                              <span className="flex items-center gap-1"><Calendar size={10} />{dateStr}</span>
                              <span className="flex items-center gap-1"><MapPin size={10} />{o.location}</span>
                              {o.fee != null && <span className="flex items-center gap-1 text-green-400/80"><Euro size={10} />{Number(o.fee).toLocaleString('fr-FR')} €</span>}
                            </div>
                            {o.specialty && (
                              <span className="inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10">{o.specialty}</span>
                            )}
                          </div>
                          <button onClick={() => deleteOffer(o.id)} className="text-neutral-600 hover:text-red-400 transition text-xs flex-shrink-0">✕</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {myOffers.length > OFFERS_PER_PAGE && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <button onClick={() => setOfferPage(p => Math.max(0, p - 1))} disabled={offerPage === 0} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white disabled:opacity-30 transition">
                      <ChevronLeft size={13} /> Préc.
                    </button>
                    <span className="text-xs text-neutral-600">{offerPage + 1} / {Math.ceil(myOffers.length / OFFERS_PER_PAGE)}</span>
                    <button onClick={() => setOfferPage(p => Math.min(Math.ceil(myOffers.length / OFFERS_PER_PAGE) - 1, p + 1))} disabled={(offerPage + 1) * OFFERS_PER_PAGE >= myOffers.length} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white disabled:opacity-30 transition">
                      Suiv. <ChevronRight size={13} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Partenaires */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users size={15} className="text-blue-400" />
              <h2 className="text-base font-semibold">Partenaires</h2>
            </div>
            <p className="text-sm text-neutral-500">Aucun partenaire ajouté.</p>
          </section>

          {/* Coordonnées & Réseaux sociaux */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-indigo-400" />
                <h2 className="text-base font-semibold">Coordonnées</h2>
              </div>
              {!editingContact ? (
                <button
                  onClick={() => setEditingContact(true)}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/5"
                >
                  <Pencil size={12} /> Modifier
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingContact(false)}
                    className="text-xs text-neutral-500 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/5"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveContact}
                    disabled={contactSaving}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition"
                  >
                    <Check size={12} /> {contactSaving ? 'Sauvegarde…' : 'Enregistrer'}
                  </button>
                </div>
              )}
            </div>

            {editingContact ? (
              /* ── Mode édition ── */
              <div className="space-y-3">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Réseaux sociaux</p>
                {[
                  { key: 'instagramUrl',  label: 'Instagram',   placeholder: 'https://instagram.com/...' },
                  { key: 'tiktokUrl',     label: 'TikTok',      placeholder: 'https://tiktok.com/@...' },
                  { key: 'facebookUrl',   label: 'Facebook',    placeholder: 'https://facebook.com/...' },
                  { key: 'twitterUrl',    label: 'X / Twitter', placeholder: 'https://x.com/...' },
                  { key: 'linkedinUrl',   label: 'LinkedIn',    placeholder: 'https://linkedin.com/...' },
                  { key: 'youtubeUrl',    label: 'YouTube',     placeholder: 'https://youtube.com/...' },
                  { key: 'soundcloudUrl', label: 'SoundCloud',  placeholder: 'https://soundcloud.com/...' },
                  { key: 'websiteUrl',    label: 'Site web',    placeholder: 'https://monsite.com' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 w-24 flex-shrink-0">{label}</span>
                    <input
                      type="url"
                      value={contactForm[key as keyof typeof contactForm]}
                      onChange={e => setContactForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-indigo-500/40"
                    />
                  </div>
                ))}
                <p className="text-xs text-neutral-500 uppercase tracking-wider pt-1">Adresse de l&apos;établissement</p>
                {[
                  { key: 'address',    label: 'Adresse',     placeholder: '12 rue de la Paix' },
                  { key: 'postalCode', label: 'Code postal', placeholder: '75001' },
                  { key: 'city',       label: 'Ville',       placeholder: 'Paris' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 w-24 flex-shrink-0">{label}</span>
                    <input
                      type="text"
                      value={contactForm[key as keyof typeof contactForm]}
                      onChange={e => setContactForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-indigo-500/40"
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* ── Mode affichage ── */
              (() => {
                const socials = [
                  { url: profile?.instagramUrl,  icon: <Instagram size={13} className="text-pink-400" />,   bg: 'bg-pink-500/15 border-pink-500/25',   label: 'Instagram' },
                  { url: profile?.tiktokUrl,     icon: <Music size={13} className="text-white" />,           bg: 'bg-white/10 border-white/15',          label: 'TikTok' },
                  { url: profile?.facebookUrl,   icon: <Facebook size={13} className="text-blue-400" />,    bg: 'bg-blue-500/15 border-blue-500/25',   label: 'Facebook' },
                  { url: profile?.twitterUrl,    icon: <Twitter size={13} className="text-sky-400" />,      bg: 'bg-sky-500/15 border-sky-500/25',     label: 'X / Twitter' },
                  { url: profile?.linkedinUrl,   icon: <Linkedin size={13} className="text-blue-300" />,    bg: 'bg-blue-400/15 border-blue-400/25',   label: 'LinkedIn' },
                  { url: profile?.youtubeUrl,    icon: <Youtube size={13} className="text-red-400" />,      bg: 'bg-red-500/15 border-red-500/25',     label: 'YouTube' },
                  { url: profile?.soundcloudUrl, icon: <Music size={13} className="text-orange-400" />,     bg: 'bg-orange-500/15 border-orange-500/25', label: 'SoundCloud' },
                  { url: profile?.websiteUrl,    icon: <Link size={13} className="text-indigo-300" />,      bg: 'bg-indigo-500/15 border-indigo-500/25', label: 'Site web' },
                ].filter(s => s.url)
                const hasAddress = profile?.address || profile?.postalCode || profile?.city
                if (socials.length === 0 && !hasAddress) {
                  return (
                    <p className="text-xs text-neutral-500">
                      Aucune coordonnée renseignée.{' '}
                      <button onClick={() => setEditingContact(true)} className="text-indigo-400 hover:underline">Ajouter</button>
                    </p>
                  )
                }
                return (
                  <div className="space-y-3">
                    {socials.length > 0 && (
                      <div className="space-y-2">
                        {socials.map(({ url, icon, bg, label }) => (
                          <a key={label} href={url!} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2.5 text-sm text-neutral-300 hover:text-white transition group">
                            <span className={`flex items-center justify-center w-7 h-7 rounded-lg border ${bg} group-hover:opacity-80 transition`}>
                              {icon}
                            </span>
                            <span className="truncate text-xs">{label}</span>
                          </a>
                        ))}
                      </div>
                    )}
                    {hasAddress && (
                      <div className={`${socials.length > 0 ? 'pt-2 border-t border-white/5' : ''} space-y-1`}>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1.5">
                          <Building2 size={11} /> Adresse
                        </div>
                        {profile?.address && <p className="text-xs text-neutral-300">{profile.address}</p>}
                        {(profile?.postalCode || profile?.city) && (
                          <p className="text-xs text-neutral-300">{[profile.postalCode, profile.city].filter(Boolean).join(' ')}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()
            )}
          </section>

        </aside>
      </div>

      {/* ── CropModal avatar / bannière ── */}
      {cropModal && (
        <CropModal
          src={cropModal.src}
          aspectRatio={cropModal.type === 'banner' ? 16 / 5 : 1}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropModal(null)}
        />
      )}

      {/* ── Modal : publier une offre */}
      {showOfferModal && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowOfferModal(false)}
        >
          <div
            className="max-w-lg w-full bg-neutral-950 border border-white/10 rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Publier une offre</h3>
              <button onClick={() => setShowOfferModal(false)} className="text-neutral-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                required
                value={offerForm.title}
                onChange={e => setOfferForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Titre de l'offre *"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-pink-500/40"
              />
              <textarea
                required
                rows={3}
                value={offerForm.description}
                onChange={e => setOfferForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Description *"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-pink-500/40 resize-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={offerForm.type}
                  onChange={e => setOfferForm(p => ({ ...p, type: e.target.value as OfferForm['type'], specialty: '' }))}
                  className="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white outline-none focus:ring-1 focus:ring-pink-500/40"
                >
                  <option value="ARTIST">Artiste</option>
                  <option value="PROVIDER">Prestataire</option>
                  <option value="ALL">Tous profils</option>
                </select>
                <select
                  value={offerForm.specialty}
                  onChange={e => setOfferForm(p => ({ ...p, specialty: e.target.value }))}
                  className="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white outline-none focus:ring-1 focus:ring-pink-500/40"
                >
                  <option value="">Spécialité *</option>
                  {getSpecialtiesForOfferType(offerForm.type).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    required type="date" value={offerForm.date}
                    onChange={e => setOfferForm(p => ({ ...p, date: e.target.value }))}
                    className="h-10 w-full bg-black/30 border border-white/10 rounded-xl pl-8 pr-3 text-sm text-white outline-none focus:ring-1 focus:ring-pink-500/40"
                  />
                </div>
                <input
                  type="time" value={offerForm.time}
                  onChange={e => setOfferForm(p => ({ ...p, time: e.target.value }))}
                  className="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white outline-none focus:ring-1 focus:ring-pink-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <CityAutocomplete
                  value={offerForm.location}
                  onChange={v => setOfferForm(p => ({ ...p, location: v }))}
                  placeholder="Ville *"
                  inputClassName="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-pink-500/40"
                />
                <input
                  required value={offerForm.country}
                  onChange={e => setOfferForm(p => ({ ...p, country: e.target.value }))}
                  placeholder="Pays *"
                  className="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-pink-500/40"
                />
              </div>

              <div className="relative">
                <Euro size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="number" min="0" step="0.01" value={offerForm.fee}
                  onChange={e => setOfferForm(p => ({ ...p, fee: e.target.value }))}
                  placeholder="Tarif proposé (optionnel)"
                  className="h-10 w-full bg-black/30 border border-white/10 rounded-xl pl-8 pr-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-pink-500/40"
                />
              </div>

              {offerError && <p className="text-xs text-red-400">{offerError}</p>}

              <button
                onClick={submitOffer}
                disabled={offerSubmitting}
                className="w-full text-sm px-3 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 font-semibold transition"
              >
                {offerSubmitting ? 'Publication…' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : ajouter une publication */}
      {showAddPub && profile && (
        <AddPublicationModal
          profileId={profile.id}
          token={getAuthToken() ?? ''}
          accent="violet"
          onClose={() => setShowAddPub(false)}
          onPublished={(pub) => setPublications(prev => [pub, ...prev])}
        />
      )}
    </div>
  )
}
