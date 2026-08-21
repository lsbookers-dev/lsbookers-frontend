'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  Settings2, MessageCircle, Star, Plus, MapPin, Music,
  Globe, Youtube, Instagram, Twitter, Facebook, Linkedin, Link,
  Pencil, Check, Users, Euro, FileText,
} from 'lucide-react'
import AgendaCalendar from '@/components/AgendaCalendar'
import PublicationsSection from '@/components/PublicationsSection'
import CropModal from '@/components/CropModal'
import AddPublicationModal from '@/components/AddPublicationModal'
import AlbumsTab from '@/components/AlbumsTab'
import { getAuthToken } from '@/utils/auth'

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

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
  styles?: string[]
  avatar?: string | null
  banner?: string | null
  soundcloudUrl?: string | null
  showSoundcloud?: boolean
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

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const displayName = (profile: ApiProfile | null): string => {
  if (!profile) return '—'
  const u = profile.user
  if (!u) return '—'
  if (profile.showRealName && (u.firstName || u.lastName)) {
    return [u.firstName, u.lastName].filter(Boolean).join(' ')
  }
  return u.pseudo || u.email || '—'
}

const buildSoundcloudEmbed = (url: string) => {
  if (!url.trim()) return ''
  if (url.includes('w.soundcloud.com/player/')) return url
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.trim())}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true`
}

function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const t = typeof window !== 'undefined' ? getAuthToken() : null
  return t ? { Authorization: `Bearer ${t}`, ...extra } : { ...extra }
}

// ─────────────────────────────────────────────
// Composant bouton édition inline
// ─────────────────────────────────────────────
function EditBar({ saving, onSave, onCancel }: { saving: boolean; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onCancel} className="text-xs text-neutral-500 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/5">
        Annuler
      </button>
      <button onClick={onSave} disabled={saving} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-50 transition">
        <Check size={12} /> {saving ? 'Sauvegarde…' : 'Enregistrer'}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function ArtistProfilePage() {
  const router = useRouter()
  const { user } = useAuth()

  const [profile, setProfile]           = useState<ApiProfile | null>(null)
  const [publications, setPublications] = useState<Publication[]>([])
  const [reviews, setReviews]           = useState<Review[]>([])
  const [loading, setLoading]           = useState(true)
  const [pubTab, setPubTab]             = useState<'publications' | 'albums'>('publications')

  // Publication modal
  const [showAddPub, setShowAddPub] = useState(false)

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

  // Tarifs — édition inline
  const [editingFee, setEditingFee] = useState(false)
  const [feeDraft, setFeeDraft]     = useState('')
  const [feeSaving, setFeeSaving]   = useState(false)

  // Réseaux sociaux — édition inline
  const [editingSocials, setEditingSocials] = useState(false)
  const [socialsForm, setSocialsForm] = useState({
    instagramUrl: '', facebookUrl: '', tiktokUrl: '', twitterUrl: '',
    linkedinUrl: '', websiteUrl: '',
  })
  const [socialsSaving, setSocialsSaving] = useState(false)

  // ── Chargement du profil
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
          instagramUrl: p.instagramUrl || '',
          facebookUrl:  p.facebookUrl  || '',
          tiktokUrl:    p.tiktokUrl    || '',
          twitterUrl:   p.twitterUrl   || '',
          linkedinUrl:  p.linkedinUrl  || '',
          websiteUrl:   p.websiteUrl   || '',
        })

        if (p.id) {
          fetch(`${API}/api/publications/profile/${p.id}`)
            .then(r => r.json())
            .then(d => setPublications(d.publications || []))
            .catch(() => {})

          fetch(`${API}/api/reviews/profile/${p.id}`)
            .then(r => r.json())
            .then(d => setReviews(d.reviews || []))
            .catch(() => {})
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  // ── Sauvegarder un champ
  const saveField = async (data: Record<string, string | null>) => {
    if (!profile) return false
    const token = getAuthToken()
    const res = await fetch(`${API}/api/profile/${profile.id}`, {
      method: 'PUT',
      credentials: 'include',
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

  const handleDeletePub = async (id: number) => {
    if (!confirm('Supprimer cette publication ?')) return
    try {
      const res = await fetch(`${API}/api/publications/${id}`, {
        method: 'DELETE', credentials: 'include', headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Échec')
      setPublications(prev => prev.filter(p => p.id !== id))
    } catch { alert('Impossible de supprimer') }
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/40 text-sm">Chargement…</div>
      </div>
    )
  }

  const soundcloudEmbed = profile?.soundcloudUrl ? buildSoundcloudEmbed(profile.soundcloudUrl) : ''

  const socialLinks = [
    { url: profile?.instagramUrl, icon: <Instagram size={13} className="text-pink-400" />,   bg: 'bg-pink-500/15 border-pink-500/25',     label: 'Instagram' },
    { url: profile?.tiktokUrl,    icon: <Music size={13} className="text-white" />,           bg: 'bg-white/10 border-white/15',           label: 'TikTok' },
    { url: profile?.facebookUrl,  icon: <Facebook size={13} className="text-blue-400" />,    bg: 'bg-blue-500/15 border-blue-500/25',     label: 'Facebook' },
    { url: profile?.twitterUrl,   icon: <Twitter size={13} className="text-sky-400" />,      bg: 'bg-sky-500/15 border-sky-500/25',       label: 'X / Twitter' },
    { url: profile?.linkedinUrl,  icon: <Linkedin size={13} className="text-blue-300" />,    bg: 'bg-blue-400/15 border-blue-400/25',     label: 'LinkedIn' },
    { url: profile?.websiteUrl,   icon: <Link size={13} className="text-indigo-300" />,      bg: 'bg-indigo-500/15 border-indigo-500/25', label: 'Site web' },
  ].filter(s => s.url)

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── Bannière ── */}
      <div
        className="relative h-56 sm:h-64 md:h-72 group cursor-pointer"
        onClick={() => bannerInputRef.current?.click()}
      >
        {profile?.banner
          ? <Image src={profile.banner} alt="Bannière" fill priority className="object-cover opacity-90" />
          : <div className="w-full h-full bg-gradient-to-br from-pink-900/40 to-black" />
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
          className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur border border-white/20 text-white px-3 py-2 rounded-xl flex items-center gap-2 text-sm transition z-10"
        >
          <Settings2 size={16} /> Paramètres
        </button>
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => openCrop(e, 'banner')} />
      </div>

      {/* ── En-tête profil ── */}
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="relative -mt-12 h-24 w-24 rounded-2xl overflow-hidden ring-4 ring-black flex-shrink-0 group cursor-pointer"
            onClick={() => avatarInputRef.current?.click()}
          >
            {profile?.avatar
              ? <Image src={profile.avatar} alt="Avatar" fill className="object-cover" />
              : <div className="w-full h-full bg-white/10 flex items-center justify-center text-3xl font-black text-white/30">
                  {user?.email?.[0]?.toUpperCase() || '?'}
                </div>
            }
            {/* Overlay hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
              {uploadingAvatar
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Pencil size={16} className="text-white" />
              }
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => openCrop(e, 'avatar')} />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{displayName(profile)}</h1>
            {(profile?.location || profile?.country) && (
              <p className="flex items-center gap-1 text-sm text-white/50 mt-0.5">
                <MapPin size={13} />
                {[profile.location, profile.country].filter(Boolean).join(', ')}
              </p>
            )}
            {profile?.specialties && profile.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {profile.specialties.map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-pink-600/20 border border-pink-600/40 text-pink-300">{s}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
              <span><strong className="text-white">{profile?.followingCount ?? 0}</strong> abonné{(profile?.followingCount ?? 0) > 1 ? 's' : ''}</span>
              <span><strong className="text-white">{profile?.followersCount ?? 0}</strong> abonnement{(profile?.followersCount ?? 0) > 1 ? 's' : ''}</span>
              {(profile?.reviewsCount ?? 0) > 0 && (
                <span><strong className="text-white">{profile?.reviewsAvg?.toFixed(1)}</strong>★ · {profile?.reviewsCount} avis</span>
              )}
              {profile?.availableForBooking && (
                <span className="text-emerald-400 font-medium">● Disponible pour booking</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/messages')}
          className="bg-white text-black rounded-full px-4 py-2 flex items-center gap-2 hover:bg-neutral-200 text-sm font-medium"
        >
          <MessageCircle size={16} /> Messages
        </button>
      </div>

      {/* ── Corps principal ── */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 pb-16">

        {/* ── Colonne gauche ── */}
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
            <AgendaCalendar
              profileId={profile.id}
              isOwner={true}
              showAvailability={true}
            />
          )}

          {/* Publications + Albums (onglets) */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
            {/* Header avec onglets */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1 bg-black/30 rounded-xl p-1">
                <button
                  onClick={() => setPubTab('publications')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${pubTab === 'publications' ? 'bg-pink-600 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  Publications
                </button>
                <button
                  onClick={() => setPubTab('albums')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${pubTab === 'albums' ? 'bg-pink-600 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  Albums
                </button>
              </div>
              {pubTab === 'publications' && (
                <button
                  onClick={() => setShowAddPub(true)}
                  className="text-xs px-3 py-1.5 rounded-full bg-pink-600 hover:bg-pink-500 flex items-center gap-1 transition"
                >
                  <Plus size={13} /> Ajouter
                </button>
              )}
            </div>

            {pubTab === 'publications' ? (
              <PublicationsSection
                publications={publications}
                isOwner={true}
                onDelete={handleDeletePub}
              />
            ) : profile ? (
              <AlbumsTab
                profileId={profile.id}
                isOwner={true}
                token={getAuthToken() ?? ''}
                accent="pink"
                publications={publications}
              />
            ) : null}
          </section>

          {/* CV */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-purple-400" />
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
                value={cvDraft}
                onChange={e => setCvDraft(e.target.value)}
                rows={6}
                placeholder="Décris ton parcours, tes expériences, tes formations…"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-purple-500/40 resize-none"
              />
            ) : profile?.cvText ? (
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{profile.cvText}</p>
            ) : (
              <p className="text-sm text-neutral-500">
                Aucun CV renseigné.{' '}
                <button onClick={() => setEditingCv(true)} className="text-purple-400 hover:underline">Ajouter</button>
              </p>
            )}
          </section>
        </div>

        {/* ── Colonne droite ── */}
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
                  {reviews.slice(0, 4).map(r => (
                    <div key={r.id} className="rounded-xl border border-white/8 bg-black/20 p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        {r.author?.avatar
                          ? <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0"><Image src={r.author.avatar} alt="" fill className="object-cover" /></div>
                          : <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/40 flex-shrink-0">{r.author?.user?.pseudo?.[0]?.toUpperCase() || '?'}</div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{r.author?.user?.pseudo || r.author?.user?.firstName || 'Anonyme'}</p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={10} className={i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/15'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {r.comment && <p className="text-xs text-white/60 leading-relaxed">{r.comment}</p>}
                    </div>
                  ))}
                </div>
            }
          </section>

          {/* SoundCloud */}
          {profile?.showSoundcloud && soundcloudEmbed && (
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Music size={15} className="text-orange-400" />
                <h2 className="text-base font-semibold">SoundCloud</h2>
              </div>
              <div className="rounded-lg overflow-hidden">
                <iframe title="SoundCloud" width="100%" height="180" scrolling="no" frameBorder="no" allow="autoplay" src={soundcloudEmbed} />
              </div>
            </section>
          )}

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
                  title="Vidéo de prestation"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {/* Tarifs */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Euro size={15} className="text-green-400" />
                <h2 className="text-base font-semibold">Tarifs</h2>
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
                value={feeDraft}
                onChange={e => setFeeDraft(e.target.value)}
                rows={4}
                placeholder="Ex : Cachet à partir de 500€ · Devis sur demande · Frais de déplacement en sus…"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-green-500/40 resize-none"
              />
            ) : profile?.feeInfo ? (
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{profile.feeInfo}</p>
            ) : (
              <p className="text-sm text-neutral-500">
                Aucun tarif renseigné.{' '}
                <button onClick={() => setEditingFee(true)} className="text-green-400 hover:underline">Ajouter</button>
              </p>
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
                  { key: 'instagramUrl',  label: 'Instagram',   placeholder: 'https://instagram.com/...' },
                  { key: 'tiktokUrl',     label: 'TikTok',      placeholder: 'https://tiktok.com/@...' },
                  { key: 'facebookUrl',   label: 'Facebook',    placeholder: 'https://facebook.com/...' },
                  { key: 'twitterUrl',    label: 'X / Twitter', placeholder: 'https://x.com/...' },
                  { key: 'linkedinUrl',   label: 'LinkedIn',    placeholder: 'https://linkedin.com/...' },
                  { key: 'websiteUrl',    label: 'Site web',    placeholder: 'https://monsite.com' },
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
                    <span className={`flex items-center justify-center w-7 h-7 rounded-lg border ${bg} group-hover:opacity-80 transition`}>
                      {icon}
                    </span>
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

      {/* ── Modal : ajouter une publication ── */}
      {showAddPub && profile && (
        <AddPublicationModal
          profileId={profile.id}
          token={getAuthToken() ?? ''}
          accent="pink"
          onClose={() => setShowAddPub(false)}
          onPublished={(pub) => setPublications(prev => [pub, ...prev])}
        />
      )}
    </div>
  )
}
