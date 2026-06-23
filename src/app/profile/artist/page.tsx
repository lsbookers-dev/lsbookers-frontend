'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  Settings2, MessageCircle, UserPlus, Star, Trash2, Plus, MapPin, Music,
} from 'lucide-react'

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

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function ArtistProfilePage() {
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

        // Publications
        if (p.id) {
          fetch(`${API}/api/publications/profile/${p.id}`)
            .then(r => r.json())
            .then(d => setPublications(d.publications || []))
            .catch(() => {})
        }

        // Avis
        if (p.id) {
          fetch(`${API}/api/reviews/profile/${p.id}`)
            .then(r => r.json())
            .then(d => setReviews(d.reviews || []))
            .catch(() => {})
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  // ── Ajouter une publication
  const handleAddPublication = async () => {
    if (!pubTitle.trim() || !pubFile || !profile) return
    setPubUploading(true)

    try {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pubTitle,
          media: url,
          mediaType,
          caption: pubCaption.trim() || undefined,
          profileId: profile.id,
        }),
      })
      if (!pubRes.ok) throw new Error('Sauvegarde échouée')

      const saved = await pubRes.json()
      setPublications(prev => [saved, ...prev])
      setPubTitle('')
      setPubCaption('')
      setPubFile(null)
      setShowAddPub(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur lors de l\'ajout')
    } finally {
      setPubUploading(false)
      if (pubInputRef.current) pubInputRef.current.value = ''
    }
  }

  // ── Supprimer une publication
  const handleDeletePub = async (id: number) => {
    if (!confirm('Supprimer cette publication ?')) return
    try {
      const res = await fetch(`${API}/api/publications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Échec')
      setPublications(prev => prev.filter(p => p.id !== id))
    } catch {
      alert('Impossible de supprimer la publication')
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

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── Bannière ── */}
      <div className="relative h-56 sm:h-64 md:h-72">
        {profile?.banner
          ? <Image src={profile.banner} alt="Bannière" fill priority className="object-cover opacity-90" />
          : <div className="w-full h-full bg-gradient-to-br from-pink-900/40 to-black" />
        }
        {/* Bouton paramètres */}
        <button
          onClick={() => router.push('/settings/profile')}
          className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur border border-white/20 text-white px-3 py-2 rounded-xl flex items-center gap-2 text-sm transition"
        >
          <Settings2 size={16} />
          Paramètres
        </button>
      </div>

      {/* ── En-tête profil ── */}
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative -mt-12 h-24 w-24 rounded-2xl overflow-hidden ring-4 ring-black flex-shrink-0">
            {profile?.avatar
              ? <Image src={profile.avatar} alt="Avatar" fill className="object-cover" />
              : <div className="w-full h-full bg-white/10 flex items-center justify-center text-3xl font-black text-white/30">
                  {user?.email?.[0]?.toUpperCase() || '?'}
                </div>
            }
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{displayName(profile)}</h1>

            {/* Localisation */}
            {(profile?.location || profile?.country) && (
              <p className="flex items-center gap-1 text-sm text-white/50 mt-0.5">
                <MapPin size={13} />
                {[profile.location, profile.country].filter(Boolean).join(', ')}
              </p>
            )}

            {/* Spécialités */}
            {profile?.specialties && profile.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {profile.specialties.map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-pink-600/20 border border-pink-600/40 text-pink-300">
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Stats followers / avis */}
            <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
              {(profile?.followersCount ?? 0) > 0 && (
                <span><strong className="text-white">{profile?.followersCount}</strong> abonné{(profile?.followersCount ?? 0) > 1 ? 's' : ''}</span>
              )}
              {(profile?.reviewsCount ?? 0) > 0 && (
                <span>
                  <strong className="text-white">{profile?.reviewsAvg?.toFixed(1)}</strong>★ · {profile?.reviewsCount} avis
                </span>
              )}
              {profile?.availableForBooking && (
                <span className="text-emerald-400 font-medium">● Disponible pour booking</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions (visible par d'autres utilisateurs → ici c'est son propre profil) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/messages')}
            className="bg-white text-black rounded-full px-4 py-2 flex items-center gap-2 hover:bg-neutral-200 text-sm font-medium"
          >
            <MessageCircle size={16} /> Messages
          </button>
          <button
            className="bg-pink-600 rounded-full px-4 py-2 flex items-center gap-2 hover:bg-pink-500 text-sm font-medium"
            disabled
          >
            <UserPlus size={16} /> Vous
          </button>
        </div>
      </div>

      {/* ── Corps principal ── */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 pb-16">

        {/* Colonne gauche */}
        <div className="space-y-6">

          {/* Bio */}
          {profile?.bio && (
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
              <h2 className="text-base font-semibold mb-2">À propos</h2>
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </section>
          )}

          {/* Publications */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Publications</h2>
              <div className="flex gap-2">
                {publications.length > 3 && (
                  <button
                    onClick={() => setShowAllPubs(true)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
                  >
                    Voir tout ({publications.length})
                  </button>
                )}
                <button
                  onClick={() => setShowAddPub(true)}
                  className="text-xs px-3 py-1.5 rounded-full bg-pink-600 hover:bg-pink-500 flex items-center gap-1 transition"
                >
                  <Plus size={13} /> Ajouter
                </button>
              </div>
            </div>

            {publications.length === 0 && (
              <p className="text-sm text-white/30 text-center py-8">Aucune publication pour l&apos;instant</p>
            )}

            {publications.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3">
                {/* Principale */}
                {publications[0] && (
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30 relative group">
                    <div className="relative w-full h-64">
                      {publications[0].mediaType === 'image'
                        ? <Image src={publications[0].media} alt={publications[0].title} fill className="object-cover" />
                        : <video src={publications[0].media} controls className="w-full h-full object-cover" />
                      }
                      <button
                        onClick={() => handleDeletePub(publications[0].id)}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium">{publications[0].title}</p>
                      {publications[0].caption && <p className="text-xs text-white/45 mt-1">{publications[0].caption}</p>}
                    </div>
                  </div>
                )}

                {/* Secondaires */}
                <div className="flex flex-col gap-3">
                  {publications.slice(1, 4).map(p => (
                    <div key={p.id} className="rounded-xl overflow-hidden border border-white/10 bg-black/30 relative group h-28">
                      <div className="relative w-full h-full">
                        {p.mediaType === 'image'
                          ? <Image src={p.media} alt={p.title} fill className="object-cover" />
                          : <video src={p.media} controls className="w-full h-full object-cover" />
                        }
                        <button
                          onClick={() => handleDeletePub(p.id)}
                          className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="px-2 py-1.5">
                        <p className="text-xs font-medium truncate">{p.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Agenda (placeholder pour la prochaine phase) */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
            <h2 className="text-base font-semibold mb-3">Mon agenda</h2>
            <div className="h-72 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center">
              <p className="text-sm text-white/30">Agenda — bientôt disponible</p>
            </div>
          </section>
        </div>

        {/* Colonne droite */}
        <aside className="space-y-5">

          {/* SoundCloud */}
          {profile?.showSoundcloud && soundcloudEmbed && (
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <div className="rounded-lg overflow-hidden">
                <iframe
                  title="SoundCloud"
                  width="100%"
                  height="180"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  src={soundcloudEmbed}
                />
              </div>
            </section>
          )}

          {/* Styles musicaux */}
          {profile?.styles && profile.styles.length > 0 && (
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Music size={15} className="text-pink-400" />
                <h2 className="text-sm font-semibold">Styles musicaux</h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.styles.map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-white/8 border border-white/10 text-white/70">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Avis */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Avis reçus</h2>
              {(profile?.reviewsAvg ?? 0) > 0 && (
                <span className="text-xs text-white/50">
                  {profile?.reviewsAvg?.toFixed(1)} / 5 · {profile?.reviewsCount} avis
                </span>
              )}
            </div>

            {reviews.length === 0 && (
              <p className="text-xs text-white/30 text-center py-4">Aucun avis pour l&apos;instant</p>
            )}

            <div className="space-y-3">
              {reviews.slice(0, 5).map(r => (
                <div key={r.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    {r.author?.avatar
                      ? <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                          <Image src={r.author.avatar} alt="" fill className="object-cover" />
                        </div>
                      : <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/40 flex-shrink-0">
                          {r.author?.user?.pseudo?.[0]?.toUpperCase() || '?'}
                        </div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {r.author?.user?.pseudo || r.author?.user?.firstName || 'Anonyme'}
                      </p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={11} className={i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/15'} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-white/60 leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* Vidéo YouTube */}
          {profile?.youtubeUrl && (
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <h2 className="text-sm font-semibold mb-3">Vidéo de prestation</h2>
              <div className="rounded-xl overflow-hidden aspect-video">
                <iframe
                  width="100%"
                  height="100%"
                  src={profile.youtubeUrl.replace('watch?v=', 'embed/')}
                  title="Vidéo de prestation"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}
        </aside>
      </div>

      {/* ── Modal : toutes les publications ── */}
      {showAllPubs && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAllPubs(false)}
        >
          <div
            className="max-w-4xl w-full max-h-[85vh] overflow-y-auto bg-neutral-950 border border-white/10 rounded-2xl p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Toutes les publications</h3>
              <button onClick={() => setShowAllPubs(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">Fermer</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {publications.map(p => (
                <div key={p.id} className="rounded-xl overflow-hidden border border-white/10 bg-black/30 relative group">
                  <div className="relative w-full h-36">
                    {p.mediaType === 'image'
                      ? <Image src={p.media} alt={p.title} fill className="object-cover" />
                      : <video src={p.media} controls className="w-full h-full object-cover" />
                    }
                    <button
                      onClick={() => handleDeletePub(p.id)}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{p.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : ajouter une publication ── */}
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
              <h3 className="text-base font-semibold">Nouvelle publication</h3>
              <button onClick={() => setShowAddPub(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">Fermer</button>
            </div>
            <div className="space-y-3">
              <input
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-pink-500/60"
                placeholder="Titre"
                value={pubTitle}
                onChange={e => setPubTitle(e.target.value)}
              />
              <textarea
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-pink-500/60 resize-none"
                placeholder="Légende (optionnel)"
                rows={3}
                value={pubCaption}
                onChange={e => setPubCaption(e.target.value)}
              />
              <input
                ref={pubInputRef}
                type="file"
                accept="image/*,video/*"
                className="w-full text-sm text-white/50 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20"
                onChange={e => setPubFile(e.target.files?.[0] || null)}
              />
              <button
                onClick={handleAddPublication}
                disabled={pubUploading || !pubTitle.trim() || !pubFile}
                className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-sm font-semibold transition"
              >
                {pubUploading ? 'Envoi en cours…' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
