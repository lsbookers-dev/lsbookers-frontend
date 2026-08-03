'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MessageCircle, Plus, X, Calendar, MapPin, Euro, Briefcase } from 'lucide-react'
import SafeImage from '@/components/SafeImage'
import FollowButton from '@/components/FollowButton'
import PublicationsSection from '@/components/PublicationsSection'
import { useAuth } from '@/context/AuthContext'
import { getAuthToken } from '@/utils/auth'

/* =============== Types =============== */
type PublicUser = {
  id: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  role?: string | null
  email?: string | null
}

type Socials = {
  instagram?: string
  facebook?: string
  tiktok?: string
  website?: string
  phone?: string
  email?: string
} | null

type PublicProfile = {
  id: number
  userId: number
  avatar?: string | null
  banner?: string | null
  bio?: string | null
  location?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  radiusKm?: number | null
  specialties?: string[] | null
  socials?: Socials
  followersCount?: number
  followingCount?: number
  user?: PublicUser
}

type Publication = {
  id: number
  title: string
  media: string
  mediaType: 'image' | 'video'
  caption?: string
  createdAt?: string
  _count?: { likes: number; comments: number }
}

type Offer = {
  id: number
  title: string
  description: string
  type: 'ARTIST' | 'PROVIDER' | 'ALL'
  specialty?: string | null
  location: string
  country: string
  date: string
  fee?: number | null
  createdAt?: string
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

/* =============== Helpers =============== */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

const toAbs = (u?: string | null) => {
  if (!u) return ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('//')) return `https:${u}`
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

/* =============== Page publique =============== */
export default function OrganizerPublicProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const userId = params?.id
  const { user: viewer } = useAuth() as { user: { id: number; role: string } | null }

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [abonnesCount, setAbonnesCount] = useState(0)
  const [publications, setPublications] = useState<Publication[]>([])
  const [offers, setOffers] = useState<Offer[]>([])

  // Formulaire publication offre
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState<OfferForm>({
    title: '', description: '', type: 'ARTIST',
    specialty: '', date: '', time: '20:00',
    location: '', country: '', fee: '',
  })

  const isOwner = viewer?.id === Number(userId)

  const defaults = useMemo(
    () => ({
      banner: '/banners/organizer_default.jpg',
      avatar: '/avatars/default_org.png',
    }),
    []
  )

  useEffect(() => {
    const load = async () => {
      if (!userId) return

      try {
        setLoading(true)
        setError(null)

        const profileRes = await fetch(`${API_BASE}/api/profile/user/${userId}`, {
          cache: 'no-store',
        })
        if (!profileRes.ok) throw new Error(`HTTP ${profileRes.status}`)

        const profileData = (await profileRes.json()) as { profile?: PublicProfile }
        const loadedProfile = profileData?.profile ?? null
        setProfile(loadedProfile)
        setAbonnesCount(loadedProfile?.followingCount ?? 0)

        if (!loadedProfile) throw new Error('Profil introuvable')

        if (loadedProfile.id) {
          const pubsRes = await fetch(`${API_BASE}/api/publications/profile/${loadedProfile.id}`, {
            cache: 'no-store',
          })
          if (pubsRes.ok) {
            const pubsData = await pubsRes.json()
            setPublications(pubsData.publications || [])
          } else {
            setPublications([])
          }

          const offersRes = await fetch(`${API_BASE}/api/offers?organizerId=${loadedProfile.id}`, {
            cache: 'no-store',
          })
          if (offersRes.ok) {
            const offersData = await offersRes.json()
            setOffers(offersData || [])
          } else {
            setOffers([])
          }
        }
      } catch (err) {
        console.error('Erreur profil public organisateur:', err)
        setError("Impossible de charger ce profil.")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white grid place-items-center">
        <p className="text-white/70">Chargement du profil…</p>
      </main>
    )
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-black text-white grid place-items-center">
        <p className="text-red-400">{error ?? 'Profil introuvable.'}</p>
      </main>
    )
  }

  const name =
    profile.user?.pseudo ||
    [profile.user?.firstName, profile.user?.lastName].filter(Boolean).join(' ') ||
    'Organisateur'
  const role = profile.user?.role || 'ORGANIZER'
  const bannerUrl = toAbs(profile.banner) || defaults.banner
  const avatarUrl = toAbs(profile.avatar) || defaults.avatar

  const location = profile.location || ''
  const country = profile.country || ''
  const radius = profile.radiusKm ?? null
  const specs = Array.isArray(profile.specialties) ? profile.specialties : []
  const description = profile.bio || 'Aucune description pour le moment.'

  const lat = profile.latitude ?? null
  const lng = profile.longitude ?? null

  const mapSrc = (() => {
    const hasCoords = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)
    const bbox = hasCoords
      ? `${(lng as number) - 0.02},${(lat as number) - 0.02},${(lng as number) + 0.02},${(lat as number) + 0.02}`
      : `-1.7,46.7,8.3,49.7`
    const marker = hasCoords ? `&marker=${lat},${lng}` : ''
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`
  })()

  const sortedOffers = [...offers].sort((a, b) => b.id - a.id)

  const handlePublishOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!form.title || !form.description || !form.date || !form.location || !form.country) {
      setFormError('Tous les champs obligatoires doivent être remplis.')
      return
    }
    setSubmitting(true)
    try {
      const token = getAuthToken()
      const datetime = `${form.date}T${form.time || '00:00'}:00`
      const res = await fetch(`${API_BASE}/api/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title:       form.title,
          description: form.description,
          type:        form.type,
          specialty:   form.specialty || null,
          date:        datetime,
          location:    form.location,
          country:     form.country,
          fee:         form.fee ? parseFloat(form.fee) : null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erreur')
      }
      const newOffer: Offer = await res.json()
      setOffers(prev => [newOffer, ...prev])
      setShowForm(false)
      setForm({ title: '', description: '', type: 'ARTIST', specialty: '', date: '', time: '20:00', location: '', country: '', fee: '' })
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la publication')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteOffer = async (offerId: number) => {
    if (!confirm('Supprimer cette offre ?')) return
    try {
      const token = getAuthToken()
      await fetch(`${API_BASE}/api/offers/${offerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setOffers(prev => prev.filter(o => o.id !== offerId))
    } catch (err) {
      console.error('Erreur suppression offre:', err)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="relative h-48 sm:h-56 md:h-64 lg:h-72">
        <SafeImage type="banner" src={bannerUrl} alt="Bannière" priority className="opacity-90" />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <section className="relative -mt-10 rounded-2xl border border-white/10 bg-neutral-900/60 p-4 md:p-5 backdrop-blur">
          {/* Ligne 1 : avatar + nom + boutons (responsive) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <SafeImage type="avatar" src={avatarUrl} name={name} size={80} className="ring-2 ring-white/10 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold truncate">{name}</h1>
                <p className="text-sm text-white/60">{role}</p>
                <p className="text-xs text-white/50 mt-1">
                  {location ? `${location}${country ? `, ${country}` : ''}` : country}
                  {radius ? ` • Rayon ${radius} km` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col sm:items-end items-center gap-2 sm:ml-auto flex-wrap">
              <div className="flex items-center gap-2">
                <FollowButton
                  targetUserId={profile.userId}
                  onFollowChange={isFollowing => setAbonnesCount(c => isFollowing ? c + 1 : Math.max(0, c - 1))}
                />
                {!isOwner && (
                  <button
                    onClick={() => router.push(`/messages/new?to=${profile.userId}`)}
                    className="bg-white text-black rounded-full px-4 py-2 flex items-center gap-2 hover:bg-neutral-200 text-sm whitespace-nowrap"
                  >
                    <MessageCircle size={16} />
                    Contacter
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-white/50">
                <span><strong className="text-white">{abonnesCount}</strong> abonnés</span>
                <span><strong className="text-white">{profile.followersCount ?? 0}</strong> abonnements</span>
              </div>
            </div>
          </div>

          {specs.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {specs.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2 py-1 rounded-full bg-pink-600/20 border border-pink-600/40"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mt-6 pb-12">
          <div className="space-y-6">
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <h2 className="text-lg font-semibold">Description</h2>
              <p className="text-neutral-200 mt-3 leading-relaxed">{description}</p>
            </section>

            <section className="rounded-2xl overflow-hidden border border-white/10 bg-black/30">
              <div className="flex items-center justify-between p-3">
                <h2 className="text-lg font-semibold">Localisation</h2>
              </div>
              <div className="relative w-full h-72">
                <iframe
                  title="map"
                  src={mapSrc}
                  className="absolute inset-0 w-full h-full"
                  loading="lazy"
                />
              </div>
              <div className="p-3 text-xs text-neutral-400">
                {location ? `${location}${country ? `, ${country}` : ''}` : (lat != null && lng != null ? 'Localisation disponible' : 'Localisation non renseignée.')}
              </div>
            </section>

            <PublicationsSection publications={publications} title="Publications" />

            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-400" />
                  <h2 className="text-lg font-semibold">Offres d&apos;emploi</h2>
                </div>
                {isOwner && (
                  <button
                    onClick={() => {
                      setShowForm(v => {
                        if (!v && profile) {
                          setForm(f => ({
                            ...f,
                            location: f.location || profile.location || '',
                            country: f.country || profile.country || '',
                          }))
                        }
                        return !v
                      })
                    }}
                    className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Publier une offre
                  </button>
                )}
              </div>

              {/* Formulaire de publication (owner uniquement) */}
              {isOwner && showForm && (
                <form onSubmit={handlePublishOffer} className="mb-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-purple-300">Nouvelle offre</p>
                    <button type="button" onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/60">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    required
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Titre de l'offre *"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                  />

                  <textarea
                    required
                    rows={3}
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Description détaillée *"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 resize-none"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={form.type}
                      onChange={e => setForm(p => ({ ...p, type: e.target.value as OfferForm['type'] }))}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="ARTIST">Artiste</option>
                      <option value="PROVIDER">Prestataire</option>
                      <option value="ALL">Tous profils</option>
                    </select>
                    <input
                      value={form.specialty}
                      onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))}
                      placeholder="Spécialité (DJ, Photo…)"
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                      <input
                        required
                        type="date"
                        value={form.date}
                        onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <input
                      type="time"
                      value={form.time}
                      onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                      <input
                        required
                        value={form.location}
                        onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                        placeholder="Ville *"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <input
                      required
                      value={form.country}
                      onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                      placeholder="Pays *"
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.fee}
                      onChange={e => setForm(p => ({ ...p, fee: e.target.value }))}
                      placeholder="Tarif proposé (optionnel)"
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  {formError && <p className="text-xs text-red-400">{formError}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    {submitting ? 'Publication…' : 'Publier l\'offre'}
                  </button>
                </form>
              )}

              {/* Liste des offres */}
              {sortedOffers.length ? (
                <div className="space-y-3">
                  {sortedOffers.map((offer) => {
                    const date = new Date(offer.date)
                    const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <div key={offer.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="text-sm font-semibold text-white">{offer.title}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_COLORS[offer.type]}`}>
                                {TYPE_LABELS[offer.type]}
                              </span>
                            </div>
                            {offer.specialty && (
                              <span className="text-xs text-white/50 mr-2">{offer.specialty}</span>
                            )}
                            <p className="text-xs text-neutral-400 mt-1 flex flex-wrap gap-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />{dateStr} à {timeStr}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />{offer.location}, {offer.country}
                              </span>
                              {offer.fee != null && (
                                <span className="flex items-center gap-1 text-green-400/80">
                                  <Euro className="w-3 h-3" />{offer.fee.toLocaleString('fr-FR')} €
                                </span>
                              )}
                            </p>
                          </div>
                          {isOwner && (
                            <button
                              onClick={() => handleDeleteOffer(offer.id)}
                              className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
                              title="Supprimer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-neutral-300 mt-3 leading-relaxed">{offer.description}</p>
                        {!isOwner && (viewer?.role === 'ARTIST' || viewer?.role === 'PROVIDER') && (
                          <div className="mt-3 pt-3 border-t border-white/5">
                            <button
                              onClick={() => router.push(`/messages/new?to=${profile?.userId}&subject=${encodeURIComponent(`Candidature : ${offer.title}`)}`)}
                              className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-full transition-colors font-medium"
                            >
                              Postuler
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-neutral-400">Aucune offre en ligne pour le moment.</p>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <h2 className="text-lg font-semibold">Avis</h2>
              <p className="text-neutral-400 text-sm mt-3">Aucun avis pour le moment.</p>
            </section>

            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <h2 className="text-lg font-semibold">Tarifs</h2>
              <p className="text-neutral-400 text-sm mt-3">Tarifs non renseignés.</p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
