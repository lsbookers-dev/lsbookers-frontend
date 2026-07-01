'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import FollowButton from '@/components/FollowButton'
import AgendaCalendar from '@/components/AgendaCalendar'
import { useAuth } from '@/context/AuthContext'

/* ================= Types ================= */

type PublicUser = {
  id: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  role?: string | null
}

type PublicProfile = {
  id: number
  userId: number
  bio?: string | null
  typeEtablissement?: string | null
  specialties?: string[] | null
  location?: string | null
  country?: string | null
  radiusKm?: number | null
  avatar?: string | null
  banner?: string | null
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
}

/* ================= Helpers ================= */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

const toAbs = (u?: string | null) => {
  if (!u) return ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('//')) return `https:${u}`
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

/* ================= Page ================= */

export default function ProviderPublicProfilePage() {

  const params = useParams<{ id: string }>()
  const router = useRouter()
  const userId = params?.id
  const { user: viewer } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [abonnesCount, setAbonnesCount] = useState(0)

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [publications, setPublications] = useState<Publication[]>([])
  const [showAllPubs, setShowAllPubs] = useState(false)

  const defaults = useMemo(() => ({
    banner: '/banners/artist_banner.jpg',
    avatar: '/default-avatar.png',
  }), [])

  useEffect(() => {

    const load = async () => {

      if (!userId) return

      try {

        setLoading(true)
        setError(null)

        const profileRes = await fetch(`${API_BASE}/api/profile/user/${userId}`, { cache: 'no-store' })

        if (!profileRes.ok) throw new Error(`HTTP ${profileRes.status}`)

        const profileData = await profileRes.json()

        const loadedProfile = profileData?.profile ?? null

        setProfile(loadedProfile)
        setAbonnesCount(loadedProfile?.followingCount ?? 0)

        if (loadedProfile?.id) {

          const pubsRes = await fetch(`${API_BASE}/api/publications/profile/${loadedProfile.id}`, { cache: 'no-store' })

          if (pubsRes.ok) {

            const pubsData = await pubsRes.json()

            setPublications(pubsData.publications || [])

          } else {

            setPublications([])

          }

        }

      } catch (err) {

        console.error('Erreur profil public prestataire:', err)

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

  /* ===== Données ===== */

  const name =
    profile.user?.pseudo ||
    [profile.user?.firstName, profile.user?.lastName].filter(Boolean).join(' ') ||
    'Prestataire'
  const role = profile.user?.role || 'PROVIDER'

  const bannerUrl = toAbs(profile.banner) || defaults.banner
  const avatarUrl = toAbs(profile.avatar) || defaults.avatar

  const location = profile.location || '—'
  const country = profile.country || ''
  const radius = profile.radiusKm ?? null

  const specialties = Array.isArray(profile.specialties) ? profile.specialties : []

  const etab = profile.typeEtablissement || ''

  const bio = profile.bio || "Ce prestataire n’a pas encore rédigé de description."

  const sortedPublications = [...publications].sort((a,b)=>b.id-a.id)

  const heroPub = sortedPublications[0]
  const restPubs = sortedPublications.slice(1,4)

  return (

    <main className="min-h-screen bg-black text-white">

      {/* ===== Bannière ===== */}

      <div className="relative h-48 sm:h-56 md:h-64 lg:h-72">

        <Image
          src={bannerUrl}
          alt="Bannière"
          fill
          priority
          className="object-cover opacity-90"
        />

      </div>

      <div className="max-w-6xl mx-auto px-4">

        {/* ===== Header ===== */}

        <section className="relative -mt-10 rounded-2xl border border-white/10 bg-neutral-900/60 p-4 md:p-5 backdrop-blur">

          <div className="flex items-center gap-4">

            <div className="relative h-20 w-20 rounded-full overflow-hidden ring-2 ring-white/10 shrink-0">

              <Image src={avatarUrl} alt={name} fill className="object-cover" />

            </div>

            <div className="min-w-0">

              <h1 className="text-xl md:text-2xl font-bold truncate">

                {name}

              </h1>

              <p className="text-sm text-white/60">

                {role}{etab ? ` • ${etab}` : ''}

              </p>

              <p className="text-xs text-white/50 mt-1">

                {location}{country ? `, ${country}` : ''}{radius ? ` • Rayon ${radius} km` : ''}

              </p>

            </div>

            <div className="ml-auto flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <FollowButton
                  targetUserId={profile.userId}
                  onFollowChange={isFollowing => setAbonnesCount(c => isFollowing ? c + 1 : Math.max(0, c - 1))}
                />
                <button
                  onClick={() => router.push(`/messages/new?to=${profile.userId}`)}
                  className="bg-white text-black rounded-full px-4 py-2 flex items-center gap-2 hover:bg-neutral-200 text-sm"
                >
                  <MessageCircle size={16} />
                  Contacter
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/50">
                <span><strong className="text-white">{abonnesCount}</strong> abonnés</span>
                <span><strong className="text-white">{profile.followersCount ?? 0}</strong> abonnements</span>
              </div>
            </div>

          </div>

          {specialties.length > 0 && (

            <div className="mt-4 flex flex-wrap gap-2">

              {specialties.map((s) => (

                <span
                  key={s}
                  className="text-xs px-2 py-1 rounded-full bg-violet-600/20 border border-violet-600/30"
                >
                  {s}
                </span>

              ))}

            </div>

          )}

        </section>

        {/* ===== Deux colonnes ===== */}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mt-6 pb-12">

          {/* ===== Colonne gauche ===== */}

          <div className="space-y-6">

            {/* Description */}

            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">

              <h2 className="text-lg font-semibold">Description</h2>

              <p className="text-neutral-200 mt-3 leading-relaxed">

                {bio}

              </p>

            </section>

            {/* Publications */}

            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Réalisations</h2>
                {sortedPublications.length > 4 && (
                  <button
                    onClick={() => setShowAllPubs(true)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
                  >
                    Voir toutes ({sortedPublications.length})
                  </button>
                )}
              </div>

              {sortedPublications.length ? (

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">

                  {heroPub && (

                    <div className="md:col-span-2 rounded-xl overflow-hidden border border-white/10 bg-black/30">

                      <div className="relative w-full h-64">

                        {heroPub.mediaType === 'image' ? (

                          <Image src={heroPub.media} alt={heroPub.title} fill className="object-cover" />

                        ) : (

                          <video src={heroPub.media} controls className="w-full h-full object-cover" />

                        )}

                      </div>

                      <div className="p-3">

                        <p className="font-medium">{heroPub.title}</p>

                        {heroPub.caption && (

                          <p className="text-sm text-neutral-300 mt-1">

                            {heroPub.caption}

                          </p>

                        )}

                      </div>

                    </div>

                  )}

                  <div className="grid grid-cols-2 md:grid-cols-1 gap-4">

                    {restPubs.map((p) => (

                      <div key={p.id} className="rounded-xl overflow-hidden border border-white/10 bg-black/30">

                        <div className="relative w-full h-28">

                          {p.mediaType === 'image' ? (

                            <Image src={p.media} alt={p.title} fill className="object-cover" />

                          ) : (

                            <video src={p.media} controls className="w-full h-full object-cover" />

                          )}

                        </div>

                        <div className="p-3">

                          <p className="text-sm font-medium truncate">{p.title}</p>

                        </div>

                      </div>

                    ))}

                  </div>

                </div>

              ) : (

                <p className="text-neutral-400 text-sm mt-3">

                  Aucune réalisation pour le moment.

                </p>

              )}

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

          {/* ===== Colonne droite ===== */}

          <aside className="space-y-6">

            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">

              <h2 className="text-lg font-semibold">Informations</h2>

              <ul className="mt-3 space-y-2 text-sm text-white/80">

                <li><span className="text-white/50">Établissement :</span> {etab || '—'}</li>

                <li><span className="text-white/50">Localisation :</span> {location}</li>

                <li><span className="text-white/50">Pays :</span> {country || '—'}</li>

                <li><span className="text-white/50">Rayon :</span> {radius ?? '—'} {radius ? 'km' : ''}</li>

              </ul>

            </section>

            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">

              <h2 className="text-lg font-semibold">Avis</h2>

              <p className="text-neutral-400 text-sm mt-3">

                Les avis seront ajoutés prochainement.

              </p>

            </section>

          </aside>

        </div>

      </div>

      {/* ── Modal galerie toutes les réalisations ── */}
      {showAllPubs && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAllPubs(false)}
        >
          <div
            className="max-w-4xl w-full max-h-[85vh] overflow-y-auto bg-neutral-950 border border-white/10 rounded-2xl p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Toutes les réalisations ({sortedPublications.length})</h3>
              <button
                onClick={() => setShowAllPubs(false)}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                Fermer
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sortedPublications.map(p => (
                <div key={p.id} className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                  <div className="relative w-full h-40">
                    {p.mediaType === 'image'
                      ? <Image src={p.media} alt={p.title} fill className="object-cover" />
                      : <video src={p.media} controls className="w-full h-full object-cover" />
                    }
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{p.title}</p>
                    {p.caption && <p className="text-xs text-white/40 truncate mt-0.5">{p.caption}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </main>

  )

}