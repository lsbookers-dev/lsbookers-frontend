'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import FollowButton from '@/components/FollowButton'
import AgendaCalendar from '@/components/AgendaCalendar'
import PublicationsSection from '@/components/PublicationsSection'
import { useAuth } from '@/context/AuthContext'

/* ================== Types ================== */
type ApiUser = {
  id: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string
  role?: string
}

type ApiProfile = {
  id: number
  userId: number
  bio?: string | null
  profession?: string | null
  location?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  radiusKm?: number | null
  specialties?: string[] | null
  typeEtablissement?: string | null
  avatar?: string | null
  banner?: string | null
  soundcloudUrl?: string | null
  showSoundcloud?: boolean | null
  followersCount?: number
  followingCount?: number
  user?: ApiUser
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

/* ================== Helpers ================== */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

const toAbs = (u?: string | null) => {
  if (!u) return ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('//')) return `https:${u}`
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

const buildSoundcloudEmbedUrl = (url: string) => {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (trimmed.includes('w.soundcloud.com/player/')) return trimmed

  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(
    trimmed
  )}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true`
}

/* ================== Page ================== */
export default function ArtistPublicProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const userId = params?.id
  const { user: viewer } = useAuth()

  const [profile, setProfile] = useState<ApiProfile | null>(null)
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [abonnesCount, setAbonnesCount] = useState(0)

  const defaults = useMemo(
    () => ({
      banner: '/banners/artist_banner.jpg',
      avatar: '/avatars/a1.png',
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

        const profileData = (await profileRes.json()) as { profile: ApiProfile }
        const loadedProfile = profileData.profile
        setProfile(loadedProfile)
        setAbonnesCount(loadedProfile?.followingCount ?? 0)

        if (loadedProfile?.id) {
          const pubsRes = await fetch(`${API_BASE}/api/publications/profile/${loadedProfile.id}`, {
            cache: 'no-store',
          })

          if (pubsRes.ok) {
            const pubsData = await pubsRes.json()
            setPublications(pubsData.publications || [])
          } else {
            setPublications([])
          }
        } else {
          setPublications([])
        }
      } catch (err) {
        console.error('Erreur profil public artiste:', err)
        setError("Impossible de charger ce profil.")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white grid place-items-center">
        <p className="text-white/70">Chargement du profil…</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black text-white grid place-items-center">
        <p className="text-red-400">{error ?? 'Profil introuvable.'}</p>
      </div>
    )
  }

  const name =
    profile.user?.pseudo ||
    [profile.user?.firstName, profile.user?.lastName].filter(Boolean).join(' ') ||
    'Artiste'
  const location = profile.location || '—'
  const country = profile.country || ''
  const specialties = Array.isArray(profile.specialties) ? profile.specialties : []
  const bannerUrl = toAbs(profile.banner) || defaults.banner
  const avatarUrl = toAbs(profile.avatar) || defaults.avatar
  const bio = profile.bio || "Cet artiste n’a pas encore rédigé de description."

  const soundcloudToDisplay =
    profile.soundcloudUrl && profile.soundcloudUrl.trim().length > 0
      ? buildSoundcloudEmbedUrl(profile.soundcloudUrl)
      : ''

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative h-56 sm:h-64 md:h-72 lg:h-80">
        <Image src={bannerUrl} alt="Bannière" fill priority className="object-cover opacity-90" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-full overflow-hidden ring-4 ring-black">
            <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{name}</h1>
            <p className="text-sm text-neutral-300">
              {location}
              {country ? `, ${country}` : ''}
              {profile.radiusKm ? ` · Rayon ${profile.radiusKm} km` : ''}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {specialties.map((label) => (
                <span
                  key={label}
                  className="text-xs px-2 py-1 rounded-full bg-pink-600/20 border border-pink-600/40"
                >
                  {label}
                </span>
              ))}

              {!specialties.length && (
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/20">
                  Aucune spécialité précisée
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            <FollowButton
              targetUserId={profile.userId}
              onFollowChange={isFollowing => setAbonnesCount(c => isFollowing ? c + 1 : Math.max(0, c - 1))}
            />
            <button
              onClick={() => router.push(`/messages/new?to=${profile.userId}`)}
              className="bg-white text-black rounded-full px-5 py-2 flex items-center gap-2 hover:bg-neutral-200 text-sm"
            >
              <MessageCircle size={16} />
              Contacter
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/50">
            <span><strong className="text-white">{abonnesCount}</strong> abonnés</span>
            <span><strong className="text-white">{profile.followersCount ?? 0}</strong> abonnements</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 pb-12">
        <div className="space-y-6">
          <PublicationsSection publications={publications} title="Publications" />

          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="text-neutral-200 mt-3 leading-relaxed">{bio}</p>
          </section>

          {profile && (
            <AgendaCalendar
              profileId={profile.id}
              isOwner={false}
              showAvailability={true}
              viewerRole={viewer?.role ?? null}
              viewerProfileId={viewer?.profile?.id ?? null}
            />
          )}
        </div>

        <aside className="space-y-6">
          {profile.showSoundcloud && soundcloudToDisplay && (
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-3">
              <div className="rounded-lg overflow-hidden">
                <iframe
                  title="Soundcloud"
                  width="100%"
                  height="180"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  src={soundcloudToDisplay}
                />
              </div>
            </section>
          )}

          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <h2 className="text-lg font-semibold">Styles</h2>
            {specialties.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {specialties.map((s) => (
                  <span key={s} className="text-xs px-2 py-1 rounded-full bg-white/10">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400 text-sm mt-3">—</p>
            )}
          </section>

          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <h2 className="text-lg font-semibold">Avis</h2>
            <p className="text-neutral-400 text-sm mt-3">Les avis seront ajoutés prochainement.</p>
          </section>

          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <h2 className="text-lg font-semibold">Tarifs</h2>
            <p className="text-neutral-400 text-sm mt-3">À venir.</p>
          </section>
        </aside>
      </div>

    </div>
  )
}