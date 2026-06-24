'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  Settings2, MessageCircle, Star, Trash2, Plus, MapPin,
} from 'lucide-react'

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

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
  mediaType: 'image' | 'video'
  caption?: string
  createdAt?: string
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
  // Pour un prestataire : toujours afficher le pseudo (nom de la société / marque)
  return u.pseudo || u.email || '—'
}

function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return t ? { Authorization: `Bearer ${t}`, ...extra } : { ...extra }
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function ProviderProfilePage() {
  const router = useRouter()
  const { user } = useAuth()

  const [profile, setProfile] = useState<ApiProfile | null>(null)
  const [publications, setPublications] = useState<Publication[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  // Publication modal
  const [showAddPub, setShowAddPub] = useState(false)
  const [pubTitle, setPubTitle] = useState('')
  const [pubCaption, setPubCaption] = useState('')
  const [pubFile, setPubFile] = useState<File | null>(null)
  const [pubUploading, setPubUploading] = useState(false)
  const pubInputRef = useRef<HTMLInputElement>(null)
  const [showAllPubs, setShowAllPubs] = useState(false)

  // ── Chargement du profil
  useEffect(() => {
    if (!user) return
    const userId = typeof user.id === 'string' ? parseInt(user.id) : Number(user.id)

    fetch(`${API}/api/profile/user/${userId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(({ profile: p }) => {
        if (!p) return
        setProfile(p)

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
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  // ── Ajouter une publication
  const addPublication = async () => {
    if (!pubTitle.trim() || !pubFile || !profile) return

    try {
      setPubUploading(true)

      const fd = new FormData()
      fd.append('file', pubFile)
      fd.append('folder', 'media')
      fd.append('type', pubFile.type.startsWith('video/') ? 'video' : 'image')

      const uploadRes = await fetch(`${API}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      if (!uploadRes.ok) throw new Error('Upload échoué')
      const { url } = await uploadRes.json()

      const mediaType = pubFile.type.startsWith('video/') ? 'video' : 'image'

      const pubRes = await fetch(`${API}/api/publications`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          title: pubTitle,
          media: url,
          mediaType,
          caption: pubCaption.trim() || undefined,
          profileId: profile.id,
        }),
      })
      if (!pubRes.ok) throw new Error('Publication échouée')

      const saved = await pubRes.json()
      setPublications(prev => [saved, ...prev])
      setPubTitle('')
      setPubCaption('')
      setPubFile(null)
      setShowAddPub(false)
    } catch (err) {
      console.error(err)
      alert("Échec de l'ajout de la publication.")
    } finally {
      setPubUploading(false)
      if (pubInputRef.current) pubInputRef.current.value = ''
    }
  }

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

  // ── Publications triées
  const sorted = [...publications].sort((a, b) => b.id - a.id)
  const heroPub = sorted[0]
  const restPubs = sorted.slice(1, 4)

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
      <div className="relative h-56 sm:h-64 md:h-72 lg:h-80">
        {profile?.banner ? (
          <Image src={profile.banner} alt="Bannière" fill priority className="object-cover opacity-90" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/60 to-black" />
        )}

        <button
          onClick={() => router.push('/settings/profile')}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl flex items-center gap-2 backdrop-blur"
        >
          <Settings2 size={18} />
          Paramètres
        </button>
      </div>

      {/* ── En-tête sous bannière */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-full overflow-hidden ring-4 ring-black flex-shrink-0">
            {profile?.avatar ? (
              <Image src={profile.avatar} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-violet-800 flex items-center justify-center text-2xl font-bold">
                {displayName(profile).charAt(0).toUpperCase()}
              </div>
            )}
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
                  <span key={s} className="text-xs px-2 py-1 rounded-full bg-violet-600/20 border border-violet-600/40">
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
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 pb-12">

        {/* Colonne gauche */}
        <div className="space-y-6">

          {/* Bio */}
          {profile?.bio && (
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <h2 className="text-lg font-semibold mb-2">À propos</h2>
              <p className="text-neutral-200 leading-relaxed">{profile.bio}</p>
            </section>
          )}

          {/* Publications */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Publications</h2>
              <div className="flex items-center gap-2">
                {sorted.length > 4 && (
                  <button
                    onClick={() => setShowAllPubs(true)}
                    className="text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20"
                  >
                    Voir tout
                  </button>
                )}
                <button
                  onClick={() => setShowAddPub(true)}
                  className="text-sm px-3 py-1 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center gap-1"
                >
                  <Plus size={16} /> Ajouter
                </button>
              </div>
            </div>

            {sorted.length === 0 ? (
              <p className="text-sm text-neutral-500">Aucune publication pour l&apos;instant.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
                {heroPub && (
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                    <div className="relative w-full h-64">
                      {heroPub.mediaType === 'image' ? (
                        <Image src={heroPub.media} alt={heroPub.title} fill className="object-cover" />
                      ) : (
                        <video src={heroPub.media} controls className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => deletePublication(heroPub.id)}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="font-medium">{heroPub.title}</p>
                      {heroPub.caption && <p className="text-sm text-neutral-300 mt-1">{heroPub.caption}</p>}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {restPubs.map(p => (
                    <div key={p.id} className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                      <div className="relative w-full h-28">
                        {p.mediaType === 'image' ? (
                          <Image src={p.media} alt={p.title} fill className="object-cover" />
                        ) : (
                          <video src={p.media} controls className="w-full h-full object-cover" />
                        )}
                        <button
                          onClick={() => deletePublication(p.id)}
                          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="p-2">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Colonne droite */}
        <aside className="space-y-6">

          {/* Avis */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <h2 className="text-lg font-semibold mb-3">Avis</h2>

            {reviews.length === 0 ? (
              <p className="text-sm text-neutral-500">Aucun avis pour l&apos;instant.</p>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 5).map(r => {
                  const rName = r.author?.user
                    ? (r.author.user.pseudo || [r.author.user.firstName, r.author.user.lastName].filter(Boolean).join(' ') || 'Anonyme')
                    : 'Anonyme'
                  return (
                    <div key={r.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="relative h-8 w-8 rounded-full overflow-hidden bg-neutral-700 flex-shrink-0">
                          {r.author?.avatar ? (
                            <Image src={r.author.avatar} alt={rName} fill className="object-cover" />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                              {rName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{rName}</p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-600'}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-neutral-200 leading-relaxed">{r.comment}</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Disponibilité */}
          {profile?.availableForBooking !== undefined && (
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <h2 className="text-lg font-semibold mb-2">Disponibilité</h2>
              <span className={`inline-block text-sm px-3 py-1 rounded-full font-medium ${
                profile.availableForBooking
                  ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                  : 'bg-neutral-700/40 text-neutral-400 border border-white/10'
              }`}>
                {profile.availableForBooking ? '✓ Disponible pour réservation' : 'Non disponible'}
              </span>
            </section>
          )}
        </aside>
      </div>

      {/* ── Modal : toutes les publications */}
      {showAllPubs && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAllPubs(false)}
        >
          <div
            className="max-w-5xl w-full bg-neutral-950 border border-white/10 rounded-2xl p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Toutes les publications</h3>
              <button onClick={() => setShowAllPubs(false)} className="text-sm px-3 py-1 rounded bg-white/10 hover:bg-white/20">
                Fermer
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
              {sorted.map(p => (
                <div key={p.id} className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                  <div className="relative w-full h-40">
                    {p.mediaType === 'image' ? (
                      <Image src={p.media} alt={p.title} fill className="object-cover" />
                    ) : (
                      <video src={p.media} controls className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => deletePublication(p.id)}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium">{p.title}</p>
                    {p.caption && <p className="text-xs text-neutral-400 mt-1">{p.caption}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : ajouter une publication */}
      {showAddPub && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddPub(false)}
        >
          <div
            className="max-w-md w-full bg-neutral-950 border border-white/10 rounded-2xl p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nouvelle publication</h3>
              <button onClick={() => setShowAddPub(false)} className="text-sm px-3 py-1 rounded bg-white/10 hover:bg-white/20">
                Fermer
              </button>
            </div>

            <div className="space-y-3">
              <input
                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Titre"
                value={pubTitle}
                onChange={e => setPubTitle(e.target.value)}
              />
              <textarea
                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Légende (optionnel)"
                rows={3}
                value={pubCaption}
                onChange={e => setPubCaption(e.target.value)}
              />
              <input
                ref={pubInputRef}
                type="file"
                accept="image/*,video/*"
                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                onChange={e => setPubFile(e.target.files?.[0] || null)}
              />
              <button
                onClick={addPublication}
                disabled={pubUploading || !pubTitle.trim() || !pubFile}
                className="w-full text-sm px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
              >
                {pubUploading ? 'Envoi…' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
