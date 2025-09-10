'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { Star } from 'lucide-react'

/* ================== Types ================== */
type ApiUser = {
  id: number
  name: string
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
  user?: ApiUser
}

/* ================== Helpers ================== */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

const toAbs = (u?: string | null) => {
  if (!u) return ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('//')) return `https:${u}`
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

/* ================== Page ================== */
export default function ArtistPublicProfilePage() {
  const params = useParams<{ id: string }>()
  const userId = params?.id

  const [profile, setProfile] = useState<ApiProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Données “visuelles” par défaut (mêmes assets que ta page privée)
  const defaults = useMemo(
    () => ({
      banner: '/banners/artist_banner.jpg',
      avatar: '/avatars/a1.png',
      stylesFallback: [] as string[],
      publicationsFallback: [] as {
        id: number
        title: string
        image: string
        caption?: string
        time?: string
      }[],
      reviewsFallback: [
        {
          id: 1,
          author: 'Studio 88',
          authorAvatar: '/avatars/pro1.png',
          rating: 5,
          text: 'Merci pour cette prestation, ravis — je recommande !',
        },
        {
          id: 2,
          author: 'Wedding Planning',
          authorAvatar: '/avatars/pro2.png',
          rating: 4,
          text: 'Très bonne prestation et très professionnel.',
        },
      ],
    }),
    []
  )

  useEffect(() => {
    const load = async () => {
      if (!userId) return
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE}/api/profile/user/${userId}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as { profile: ApiProfile }
        setProfile(data.profile)
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

  /* ===== Données ===== */
  const name = profile.user?.name || 'Artiste'
  const location = profile.location || '—'
  const country = profile.country || ''
  const specialties = Array.isArray(profile.specialties) ? profile.specialties : []
  const bannerUrl = toAbs(profile.banner) || defaults.banner
  const avatarUrl = toAbs(profile.avatar) || defaults.avatar
  const bio = profile.bio || "Cet artiste n’a pas encore rédigé de description."

  /* ====== Publications (lecture seule ; si tu en as côté API, branche-les ici) ====== */
  const publications = defaults.publicationsFallback
  const heroPub = publications[0]
  const restPubs = publications.slice(1, 4)

  /* ====== Styles (lecture seule à partir des specialties) ====== */
  const styles = specialties.length ? specialties : defaults.stylesFallback

  /* ====== Avis (placeholder lecture seule) ====== */
  const reviews = defaults.reviewsFallback

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ===== Bannière (lecture seule) ===== */}
      <div className="relative h-56 sm:h-64 md:h-72 lg:h-80">
        <Image src={bannerUrl} alt="Bannière" fill priority className="object-cover opacity-90" />
      </div>

      {/* ===== Bloc infos sous la bannière (lecture seule) ===== */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-full overflow-hidden ring-4 ring-black">
            <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{name}</h1>
            <p className="text-sm text-neutral-300">
              {location}{country ? `, ${country}` : ''}
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

        {/* Boutons d’action retirés en public (Consultation uniquement) */}
        <div className="hidden md:block opacity-40 text-xs">
          Consultation publique
        </div>
      </div>

      {/* ===== Corps ===== */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 pb-12">
        {/* Colonne gauche */}
        <div className="space-y-6">
          {/* Publications (lecture seule) */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Publications</h2>
            </div>

            {publications.length ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {heroPub && (
                  <div className="md:col-span-2 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                    <div className="relative w-full h-64">
                      <Image src={heroPub.image} alt={heroPub.title} fill className="object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="font-medium">{heroPub.title}</p>
                      {heroPub.caption && (
                        <p className="text-sm text-neutral-300 mt-1">{heroPub.caption}</p>
                      )}
                      {heroPub.time && (
                        <p className="text-xs text-neutral-400 mt-1">{heroPub.time}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                  {restPubs.map((p) => (
                    <div key={p.id} className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                      <div className="relative w-full h-28">
                        <Image src={p.image} alt={p.title} fill className="object-cover" />
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

          {/* Description (lecture seule) */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Description</h2>
            </div>
            <p className="text-neutral-200 mt-3 leading-relaxed">{bio}</p>
          </section>

          {/* Agenda (placeholder — en lecture seule) */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <h2 className="text-lg font-semibold">Mon agenda</h2>
            <p className="text-neutral-300 mt-2">
              (Aperçu public de l’agenda. À relier plus tard à ton composant calendrier public.)
            </p>
            <div className="mt-3 h-48 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center">
              <span className="text-neutral-500 text-sm">Calendrier à venir</span>
            </div>
          </section>
        </div>

        {/* Colonne droite */}
        <aside className="space-y-6">
          {/* Styles (lecture seule depuis specialties) */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <h2 className="text-lg font-semibold">Styles</h2>
            {styles.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {styles.map((s) => (
                  <span key={s} className="text-xs px-2 py-1 rounded-full bg-white/10">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400 text-sm mt-3">—</p>
            )}
          </section>

          {/* Avis (placeholder lecture seule) */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Avis</h2>
            </div>

            <div className="mt-3 space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 rounded-full overflow-hidden">
                      <Image src={r.authorAvatar} alt={r.author} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{r.author}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-600'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-200 mt-2 leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Tarifs (lecture seule – à connecter plus tard si tu as une source) */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tarifs</h2>
            </div>
            <p className="text-neutral-400 text-sm mt-3">À venir.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}