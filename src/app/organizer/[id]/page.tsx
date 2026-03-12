'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'

/* =============== Types =============== */
type PublicUser = {
  id: number
  name: string
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
  user?: PublicUser
}

type Publication = {
  id: number
  title: string
  media: string
  mediaType: 'image' | 'video'
  caption?: string
  createdAt?: string
}

type Offer = {
  id: number
  title: string
  description: string
  type: 'ARTIST' | 'PROVIDER' | 'ALL'
  specialty?: string
  location: string
  country: string
  date: string
  createdAt?: string
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

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [publications, setPublications] = useState<Publication[]>([])
  const [offers, setOffers] = useState<Offer[]>([])

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

        if (!loadedProfile) {
          throw new Error('Profil introuvable')
        }

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

  const name = profile.user?.name || 'Organisateur'
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

  const sortedPublications = [...publications].sort((a, b) => b.id - a.id)
  const heroPub = sortedPublications[0]
  const restPubs = sortedPublications.slice(1, 4)

  const sortedOffers = [...offers].sort((a, b) => b.id - a.id)

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="relative h-48 sm:h-56 md:h-64 lg:h-72">
        <Image src={bannerUrl} alt="Bannière" fill priority className="object-cover opacity-90" />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <section className="relative -mt-10 rounded-2xl border border-white/10 bg-neutral-900/60 p-4 md:p-5 backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 rounded-full overflow-hidden ring-2 ring-white/10 shrink-0">
              <Image src={avatarUrl} alt={name} fill className="object-cover" />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold truncate">{name}</h1>
              <p className="text-sm text-white/60">{role}</p>
              <p className="text-xs text-white/50 mt-1">
                {location ? `${location}${country ? `, ${country}` : ''}` : country}
                {radius ? ` • Rayon ${radius} km` : ''}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => router.push(`/messages/new?to=${profile.userId}`)}
                className="bg-white text-black rounded-full px-4 py-2 flex items-center gap-2 hover:bg-neutral-200 text-sm"
              >
                <MessageCircle size={16} />
                Contacter
              </button>
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
                {lat != null && lng != null ? `Lat ${lat} · Lng ${lng}` : 'Localisation approximative.'}
              </div>
            </section>

            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Publications</h2>
              </div>

              {sortedPublications.length ? (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {heroPub && (
                    <div className="md:col-span-2 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                      <div className="relative w-full h-64">
                        {heroPub.mediaType === 'image' ? (
                          <Image
                            src={heroPub.media}
                            alt={heroPub.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <video src={heroPub.media} controls className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-medium">{heroPub.title}</p>
                        {heroPub.caption && (
                          <p className="text-sm text-neutral-300 mt-1">{heroPub.caption}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                    {restPubs.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl overflow-hidden border border-white/10 bg-black/30"
                      >
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
                <p className="text-sm text-neutral-400 mt-3">Aucune publication pour le moment.</p>
              )}
            </section>

            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Offres d’emploi</h2>
              </div>

              {sortedOffers.length ? (
                <ul className="mt-4 space-y-3">
                  {sortedOffers.map((offer) => (
                    <li
                      key={offer.id}
                      className="rounded-xl border border-white/10 bg-black/30 p-3"
                    >
                      <p className="text-sm font-medium">{offer.title}</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {offer.date?.split('T')[0]} · {offer.location}, {offer.country}
                      </p>
                      <p className="text-sm text-neutral-200 mt-2">{offer.description}</p>
                      <p className="text-xs text-neutral-400 mt-2">
                        Type: {offer.type}
                        {offer.specialty ? ` · Spécialité: ${offer.specialty}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-400 mt-3">Aucune offre en ligne pour le moment.</p>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <h2 className="text-lg font-semibold">Réseaux & contacts</h2>
              <p className="text-neutral-400 text-sm mt-3">
                Cette section sera branchée une fois la V2 backend des réseaux finalisée.
              </p>
            </section>

            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Avis</h2>
                <span className="text-xs text-white/40">À venir</span>
              </div>
              <p className="text-neutral-400 text-sm mt-3">Les avis réels seront ajoutés plus tard.</p>
            </section>

            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Tarifs</h2>
                <span className="text-xs text-white/40">À venir</span>
              </div>
              <p className="text-neutral-400 text-sm mt-3">Les tarifs réels seront ajoutés plus tard.</p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}