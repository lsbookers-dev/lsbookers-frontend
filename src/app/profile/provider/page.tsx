'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  Settings2, MessageCircle, Star, Plus, MapPin,
  Globe, Youtube, Instagram, Twitter, Facebook, Linkedin, Link,
  Pencil, Check, X, Users, Euro, FileText, Briefcase,
  Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react'
import AgendaCalendar from '@/components/AgendaCalendar'
import PublicationsSection from '@/components/PublicationsSection'
import CropModal from '@/components/CropModal'
import AddPublicationModal from '@/components/AddPublicationModal'
import AlbumsTab from '@/components/AlbumsTab'
import { getAuthToken } from '@/utils/auth'
import { getSpecialtiesForOfferType } from '@/constants/specialties'

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const OFFERS_PER_PAGE = 3

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ApiProfile = {
  id: number
  userId: number
  bio?: string | null
  profession?: string | null
  location?: string | null
  country?: string | null
  radiusKm?: number | null
  specialties?: string[]
  avatar?: string | null
  banner?: string | null
  youtubeUrl?: string | null
  instagramUrl?: string | null
  facebookUrl?: string | null
  tiktokUrl?: string | null
  twitterUrl?: string | null
  linkedinUrl?: string | null
  websiteUrl?: string | null
  cvText?: string | null
  feeInfo?: string | null
  availableForBooking?: boolean
  showRealName?: boolean
  followersCount?: number
  followingCount?: number
  reviewsAvg?: number | null
  reviewsCount?: number
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
  title: string; description: string; type: 'ARTIST' | 'PROVIDER' | 'ALL'
  specialty: string; date: string; time: string; location: string; country: string; fee: string
}

const EMPTY_OFFER_FORM: OfferForm = {
  title: '', description: '', type: 'PROVIDER', specialty: '',
  date: '', time: '', location: '', country: '', fee: '',
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const displayName = (profile: ApiProfile | null): string => {
  if (!profile) return '—'
  const u = profile.user
  if (!u) return '—'
  return u.pseudo || u.email || '—'
}

function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const t = typeof window !== 'undefined' ? getAuthToken() : null
  return t ? { Authorization: `Bearer ${t}`, ...extra } : { ...extra }
}

function EditBar({ saving, onSave, onCancel }: { saving: boolean; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onCancel} className="text-xs text-neutral-500 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/5">Annuler</button>
      <button onClick={onSave} disabled={saving} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition">
        <Check size={12} /> {saving ? 'Sauvegarde…' : 'Enregistrer'}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function ProviderProfilePage() {
  const router = useRouter()
  const { user } = useAuth()

  const [profile, setProfile]           = useState<ApiProfile | null>(null)
  const [publications, setPublications] = useState<Publication[]>([])
  const [reviews, setReviews]           = useState<Review[]>([])
  const [loading, setLoading]           = useState(true)

  // Offres
  const [myOffers, setMyOffers]             = useState<Offer[]>([])
  const [offerPage, setOfferPage]           = useState(0)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerForm, setOfferForm]           = useState<OfferForm>(EMPTY_OFFER_FORM)
  const [offerSubmitting, setOfferSubmitting] = useState(false)
  const [offerError, setOfferError]         = useState<string | null>(null)

  // Publication modal
  const [showAddPub, setShowAddPub]   = useState(false)

  // Avatar / Bannière — upload inline
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [cropModal, setCropModal] = useState<{ src: string; type: 'avatar' | 'banner' } | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // CV — édition inline
  const [editingCv, setEditingCv] = useState(false)
  const [cvDraft, setCvDraft]     = useState('')
  const [cvSaving, setCvSaving]   = useState(false)

  // Prestations & Tarifs — édition inline
  const [editingFee, setEditingFee] = useState(false)
  const [feeDraft, setFeeDraft]     = useState('')
  const [feeSaving, setFeeSaving]   = useState(false)

  // Réseaux sociaux — édition inline
  const [editingSocials, setEditingSocials] = useState(false)
  const [socialsForm, setSocialsForm] = useState({
    instagramUrl: '', facebookUrl: '', tiktokUrl: '', twitterUrl: '', linkedinUrl: '', websiteUrl: '',
  })
  const [socialsSaving, setSocialsSaving] = useState(false)

  // ── Chargement
  useEffect(() => {
    if (!user) return
    const userId = typeof user.id === 'string' ? parseInt(user.id) : Number(user.id)

    fetch(`${API}/api/profile/user/${userId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(({ profile: p }) => {
        if (!p) return
        setProfile(p)
        setCvDraft(p.cvText || '')
        setFeeDraft(p.feeInfo || '')
        setSocialsForm({
          instagramUrl: p.instagramUrl || '', facebookUrl: p.facebookUrl || '',
          tiktokUrl: p.tiktokUrl || '',     twitterUrl: p.twitterUrl || '',
          linkedinUrl: p.linkedinUrl || '', websiteUrl: p.websiteUrl || '',
        })

        if (p.id) {
          fetch(`${API}/api/publications/profile/${p.id}`)
            .then(r => r.json()).then(d => setPublications(d.publications || [])).catch(() => {})

          fetch(`${API}/api/reviews/profile/${p.id}`)
            .then(r => r.json()).then(d => setReviews(d.reviews || [])).catch(() => {})

          fetch(`${API}/api/offers?organizerId=${p.id}`)
            .then(r => r.json()).then(d => setMyOffers(Array.isArray(d) ? d : [])).catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  // ── Sauvegarder un champ
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

  const saveCv = async () => {
    setCvSaving(true)
    if (await saveField({ cvText: cvDraft })) setEditingCv(false)
    setCvSaving(false)
  }

  const saveFee = async () => {
    setFeeSaving(true)
    if (await saveField({ feeInfo: feeDraft })) setEditingFee(false)
    setFeeSaving(false)
  }

  const saveSocials = async () => {
    setSocialsSaving(true)
    if (await saveField(socialsForm)) setEditingSocials(false)
    setSocialsSaving(false)
  }

  // ── Offres
  const submitOffer = async () => {
    if (!offerForm.title.trim() || !offerForm.description.trim() || !offerForm.date || !offerForm.location.trim() || !offerForm.country.trim()) {
      setOfferError('Veuillez remplir tous les champs obligatoires.'); return
    }
    if (!offerForm.specialty) { setOfferError('Veuillez sélectionner une spécialité.'); return }
    setOfferError(null); setOfferSubmitting(true)
    try {
      const token = getAuthToken()
      const dateTime = offerForm.time ? `${offerForm.date}T${offerForm.time}:00` : `${offerForm.date}T00:00:00`
      const res = await fetch(`${API}/api/offers`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          title: offerForm.title.trim(), description: offerForm.description.trim(),
          type: offerForm.type, specialty: offerForm.specialty,
          date: dateTime, location: offerForm.location.trim(),
          country: offerForm.country.trim(), fee: offerForm.fee ? parseFloat(offerForm.fee) : null,
        }),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      const saved = await res.json()
      setMyOffers(prev => [saved, ...prev]); setOfferForm(EMPTY_OFFER_FORM)
      setShowOfferModal(false); setOfferPage(0)
    } catch { setOfferError('Échec de la publication. Réessayez.') }
    finally { setOfferSubmitting(false) }
  }

  const deleteOffer = async (id: number) => {
    if (!confirm('Supprimer cette offre ?')) return
    try {
      const token = getAuthToken()
      await fetch(`${API}/api/offers/${id}`, {
        method: 'DELETE', credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setMyOffers(prev => prev.filter(o => o.id !== id))
    } catch { alert('Erreur lors de la suppression.') }
  }

  const deletePublication = async (id: number) => {
    if (!confirm('Supprimer cette publication ?')) return
    try {
      const res = await fetch(`${API}/api/publications/${id}`, {
        method: 'DELETE', credentials: 'include', headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Suppression échouée')
      setPublications(prev => prev.filter(p => p.id !== id))
    } catch { alert('Échec de la suppression.') }
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

  const socialLinks = [
    { url: profile?.instagramUrl, icon: <Instagram size={13} className="text-pink-400" />,  bg: 'bg-pink-500/15 border-pink-500/25',     label: 'Instagram' },
    { url: profile?.tiktokUrl,    icon: <Globe size={13} className="text-white" />,          bg: 'bg-white/10 border-white/15',           label: 'TikTok' },
    { url: profile?.facebookUrl,  icon: <Facebook size={13} className="text-blue-400" />,   bg: 'bg-blue-500/15 border-blue-500/25',     label: 'Facebook' },
    { url: profile?.twitterUrl,   icon: <Twitter size={13} className="text-sky-400" />,     bg: 'bg-sky-500/15 border-sky-500/25',       label: 'X / Twitter' },
    { url: profile?.linkedinUrl,  icon: <Linkedin size={13} className="text-blue-300" />,   bg: 'bg-blue-400/15 border-blue-400/25',     label: 'LinkedIn' },
    { url: profile?.websiteUrl,   icon: <Link size={13} className="text-violet-300" />,     bg: 'bg-violet-500/15 border-violet-500/25', label: 'Site web' },
  ].filter(s => s.url)

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── Bannière */}
      <div
        className="relative h-56 sm:h-64 md:h-72 lg:h-80 group cursor-pointer"
        onClick={() => bannerInputRef.current?.click()}
      >
        {profile?.banner
          ? <Image src={profile.banner} alt="Bannière" fill priority className="object-cover opacity-90" />
          : <div className="absolute inset-0 bg-gradient-to-br from-violet-900/60 to-black" />
        }
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
          <Settings2 size={18} /> Paramètres
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
            {profile?.avatar
              ? <Image src={profile.avatar} alt="Avatar" fill className="object-cover" />
              : <div className="w-full h-full bg-violet-800 flex items-center justify-center text-2xl font-bold">
                  {displayName(profile).charAt(0).toUpperCase()}
                </div>
            }
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
                <MapPin size={14} className="text-violet-400" />
                {[profile?.location, profile?.country].filter(Boolean).join(', ')}
                {profile?.radiusKm ? ` · Rayon ${profile.radiusKm} km` : ''}
              </p>
            )}
            {profile?.specialties && profile.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.specialties.map(s => (
                  <span key={s} className="text-xs px-2 py-1 rounded-full bg-violet-600/20 border border-violet-600/40">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => router.push('/messages')}
          className="bg-white text-black rounded-full px-5 py-2 flex items-center gap-2 hover:bg-neutral-200"
        >
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
              <h2 className="text-base font-semibold mb-2">À propos</h2>
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </section>
          )}

          {/* Agenda */}
          {profile && (
            <AgendaCalendar profileId={profile.id} isOwner={true} showAvailability={true} />
          )}

          {/* Publications */}
          <PublicationsSection
            publications={publications}
            title="Publications"
            isOwner={true}
            onDelete={deletePublication}
            headerAction={
              <button
                onClick={() => setShowAddPub(true)}
                className="text-xs px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center gap-1 transition"
              >
                <Plus size={13} /> Ajouter
              </button>
            }
          />

          {/* Albums */}
          {profile && (
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
              <h2 className="text-base font-semibold mb-4">Albums</h2>
              <AlbumsTab
                profileId={profile.id}
                isOwner={true}
                token={getAuthToken() ?? ''}
                accent="blue"
                publications={publications}
              />
            </section>
          )}

          {/* CV */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-violet-400" />
                <h2 className="text-base font-semibold">CV / Expérience</h2>
              </div>
              {!editingCv
                ? <button onClick={() => setEditingCv(true)} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/5">
                    <Pencil size={12} /> Modifier
                  </button>
                : <EditBar saving={cvSaving} onSave={saveCv} onCancel={() => { setEditingCv(false); setCvDraft(profile?.cvText || '') }} />
              }
            </div>
            {editingCv ? (
              <textarea
                value={cvDraft} onChange={e => setCvDraft(e.target.value)} rows={6}
                placeholder="Décris ton parcours, tes expériences, tes formations…"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-violet-500/40 resize-none"
              />
            ) : profile?.cvText ? (
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{profile.cvText}</p>
            ) : (
              <p className="text-sm text-neutral-500">
                Aucun CV renseigné.{' '}
                <button onClick={() => setEditingCv(true)} className="text-violet-400 hover:underline">Ajouter</button>
              </p>
            )}
          </section>
        </div>

        {/* ── Colonne droite */}
        <aside className="space-y-5">

          {/* Avis */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star size={15} className="text-yellow-400" />
              <h2 className="text-base font-semibold">Avis reçus</h2>
              {(profile?.reviewsAvg ?? 0) > 0 && (
                <span className="ml-auto text-sm font-medium text-yellow-400">
                  {profile?.reviewsAvg?.toFixed(1)}<span className="text-neutral-500 text-xs font-normal"> / 5</span>
                </span>
              )}
            </div>
            {reviews.length === 0
              ? <p className="text-xs text-white/30 text-center py-3">Aucun avis pour l&apos;instant</p>
              : <div className="space-y-3">
                  {reviews.slice(0, 4).map(r => {
                    const rName = r.author?.user
                      ? (r.author.user.pseudo || [r.author.user.firstName, r.author.user.lastName].filter(Boolean).join(' ') || 'Anonyme')
                      : 'Anonyme'
                    return (
                      <div key={r.id} className="rounded-xl border border-white/8 bg-black/20 p-3">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className="relative h-7 w-7 rounded-full overflow-hidden bg-neutral-700 flex-shrink-0">
                            {r.author?.avatar
                              ? <Image src={r.author.avatar} alt={rName} fill className="object-cover" />
                              : <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{rName.charAt(0).toUpperCase()}</span>
                            }
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
            }
          </section>

          {/* Prestations proposées + Tarifs */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Euro size={15} className="text-green-400" />
                <h2 className="text-base font-semibold">Prestations & Tarifs</h2>
              </div>
              {!editingFee
                ? <button onClick={() => setEditingFee(true)} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/5">
                    <Pencil size={12} /> Modifier
                  </button>
                : <EditBar saving={feeSaving} onSave={saveFee} onCancel={() => { setEditingFee(false); setFeeDraft(profile?.feeInfo || '') }} />
              }
            </div>
            {editingFee ? (
              <textarea
                value={feeDraft} onChange={e => setFeeDraft(e.target.value)} rows={5}
                placeholder="Ex : Animation soirée — à partir de 800€&#10;DJ set 4h — 1200€&#10;Devis sur demande pour événements privés…"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-green-500/40 resize-none"
              />
            ) : profile?.feeInfo ? (
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{profile.feeInfo}</p>
            ) : (
              <p className="text-sm text-neutral-500">
                Aucune prestation renseignée.{' '}
                <button onClick={() => setEditingFee(true)} className="text-green-400 hover:underline">Ajouter</button>
              </p>
            )}
          </section>

          {/* Vidéo de présentation */}
          {profile?.youtubeUrl && (
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Youtube size={15} className="text-red-400" />
                <h2 className="text-base font-semibold">Vidéo de présentation</h2>
              </div>
              <div className="rounded-xl overflow-hidden aspect-video">
                <iframe
                  width="100%" height="100%"
                  src={profile.youtubeUrl.replace('watch?v=', 'embed/')}
                  title="Vidéo de présentation" frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {/* Offres */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase size={15} className="text-violet-400" />
                <h2 className="text-base font-semibold">Offres</h2>
                {myOffers.length > 0 && <span className="text-xs text-neutral-500">({myOffers.length})</span>}
              </div>
              <button
                onClick={() => { setOfferForm({ ...EMPTY_OFFER_FORM, location: profile?.location ?? '', country: profile?.country ?? '' }); setOfferError(null); setShowOfferModal(true) }}
                className="text-xs px-2.5 py-1 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center gap-1 transition"
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
                            {o.specialty && <span className="inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10">{o.specialty}</span>}
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

          {/* Partenariats */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users size={15} className="text-blue-400" />
              <h2 className="text-base font-semibold">Partenariats</h2>
            </div>
            <p className="text-sm text-neutral-500">Aucun partenaire ajouté.</p>
          </section>

          {/* Réseaux sociaux */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-indigo-400" />
                <h2 className="text-base font-semibold">Réseaux sociaux</h2>
              </div>
              {!editingSocials
                ? <button onClick={() => setEditingSocials(true)} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/5">
                    <Pencil size={12} /> Modifier
                  </button>
                : <EditBar saving={socialsSaving} onSave={saveSocials} onCancel={() => { setEditingSocials(false); setSocialsForm({ instagramUrl: profile?.instagramUrl || '', facebookUrl: profile?.facebookUrl || '', tiktokUrl: profile?.tiktokUrl || '', twitterUrl: profile?.twitterUrl || '', linkedinUrl: profile?.linkedinUrl || '', websiteUrl: profile?.websiteUrl || '' }) }} />
              }
            </div>
            {editingSocials ? (
              <div className="space-y-2.5">
                {[
                  { key: 'instagramUrl', label: 'Instagram',   placeholder: 'https://instagram.com/...' },
                  { key: 'tiktokUrl',    label: 'TikTok',      placeholder: 'https://tiktok.com/@...' },
                  { key: 'facebookUrl',  label: 'Facebook',    placeholder: 'https://facebook.com/...' },
                  { key: 'twitterUrl',   label: 'X / Twitter', placeholder: 'https://x.com/...' },
                  { key: 'linkedinUrl',  label: 'LinkedIn',    placeholder: 'https://linkedin.com/...' },
                  { key: 'websiteUrl',   label: 'Site web',    placeholder: 'https://monsite.com' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 w-20 flex-shrink-0">{label}</span>
                    <input
                      type="url"
                      value={socialsForm[key as keyof typeof socialsForm]}
                      onChange={e => setSocialsForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-indigo-500/40"
                    />
                  </div>
                ))}
              </div>
            ) : socialLinks.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Aucun réseau renseigné.{' '}
                <button onClick={() => setEditingSocials(true)} className="text-indigo-400 hover:underline">Ajouter</button>
              </p>
            ) : (
              <div className="space-y-2">
                {socialLinks.map(({ url, icon, bg, label }) => (
                  <a key={label} href={url!} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-neutral-300 hover:text-white transition group">
                    <span className={`flex items-center justify-center w-7 h-7 rounded-lg border ${bg} group-hover:opacity-80 transition`}>{icon}</span>
                    <span className="text-xs">{label}</span>
                  </a>
                ))}
              </div>
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
        <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowOfferModal(false)}>
          <div className="max-w-lg w-full bg-neutral-950 border border-white/10 rounded-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Publier une offre</h3>
              <button onClick={() => setShowOfferModal(false)} className="text-neutral-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input required value={offerForm.title} onChange={e => setOfferForm(p => ({ ...p, title: e.target.value }))} placeholder="Titre de l'offre *" className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-violet-500/40" />
              <textarea required rows={3} value={offerForm.description} onChange={e => setOfferForm(p => ({ ...p, description: e.target.value }))} placeholder="Description *" className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-violet-500/40 resize-none" />
              <div className="grid grid-cols-2 gap-2">
                <select value={offerForm.type} onChange={e => setOfferForm(p => ({ ...p, type: e.target.value as OfferForm['type'], specialty: '' }))} className="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white outline-none focus:ring-1 focus:ring-violet-500/40">
                  <option value="ARTIST">Artiste</option>
                  <option value="PROVIDER">Prestataire</option>
                  <option value="ALL">Tous profils</option>
                </select>
                <select value={offerForm.specialty} onChange={e => setOfferForm(p => ({ ...p, specialty: e.target.value }))} className="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white outline-none focus:ring-1 focus:ring-violet-500/40">
                  <option value="">Spécialité *</option>
                  {getSpecialtiesForOfferType(offerForm.type).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input required type="date" value={offerForm.date} onChange={e => setOfferForm(p => ({ ...p, date: e.target.value }))} className="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white outline-none focus:ring-1 focus:ring-violet-500/40" />
                <input type="time" value={offerForm.time} onChange={e => setOfferForm(p => ({ ...p, time: e.target.value }))} className="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white outline-none focus:ring-1 focus:ring-violet-500/40" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input required value={offerForm.location} onChange={e => setOfferForm(p => ({ ...p, location: e.target.value }))} placeholder="Ville *" className="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-violet-500/40" />
                <input required value={offerForm.country} onChange={e => setOfferForm(p => ({ ...p, country: e.target.value }))} placeholder="Pays *" className="h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-violet-500/40" />
              </div>
              <input type="number" min="0" step="0.01" value={offerForm.fee} onChange={e => setOfferForm(p => ({ ...p, fee: e.target.value }))} placeholder="Tarif proposé (optionnel)" className="h-10 w-full bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-violet-500/40" />
              {offerError && <p className="text-xs text-red-400">{offerError}</p>}
              <button onClick={submitOffer} disabled={offerSubmitting} className="w-full text-sm px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 font-semibold transition">
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
          accent="blue"
          onClose={() => setShowAddPub(false)}
          onPublished={(pub) => setPublications(prev => [pub, ...prev])}
        />
      )}

    </div>
  )
}
