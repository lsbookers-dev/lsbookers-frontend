'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'

/* =============== Types =============== */
type PublicUser = { id: number; name: string; role?: string | null; email?: string | null }

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
  name?: string | null
  description?: string | null
  location?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  radiusKm?: number | null
  specialties?: string[] | null
  socials?: Socials
  user?: PublicUser
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
  const userId = params?.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<PublicProfile | null>(null)

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
        const res = await fetch(`${API_BASE}/api/profile/user/${userId}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as { profile?: PublicProfile }
        setProfile(data?.profile ?? null)
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

  /* ===== Données prêtes à afficher ===== */
  const name = profile.name || profile.user?.name || 'Organisateur'
  const role = profile.user?.role || 'ORGANIZER'
  const bannerUrl = toAbs(profile.banner) || defaults.banner
  const avatarUrl = toAbs(profile.avatar) || defaults.avatar

  const location = profile.location || ''
  const country = profile.country || ''
  const radius = profile.radiusKm ?? null
  const specs = Array.isArray(profile.specialties) ? profile.specialties : []
  const description = profile.description || ''

  const lat = profile.latitude ?? null
  const lng = profile.longitude ?? null
  const mapSrc = (() => {
    const hasCoords = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)
    const bbox = hasCoords
      ? `${(lng as number) - 0.02},${(lat as number) - 0.02},${(lng as number) + 0.02},${(lat as number) + 0.02}`
      : `-1.7,46.7,8.3,49.7` // bbox approx France
    const marker = hasCoords ? `&marker=${lat},${lng}` : ''
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`
  })()

  const socials = profile.socials || {}

  return (
    <main className="min-h-screen bg-black text-white">
      {/* ===== Bannière (lecture seule) ===== */}
      <div className="relative h-48 sm:h-56 md:h-64 lg:h-72">
        <Image src={bannerUrl} alt="Bannière" fill priority className="object-cover opacity-90" />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* ===== En-tête lecture seule ===== */}
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
            <div className="hidden md:block ml-auto text-xs text-white/40">Consultation publique</div>
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

        {/* ===== Deux colonnes ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mt-6 pb-12">
          {/* ==== Colonne gauche ==== */}
          <div className="space-y-6">
            {/* Description */}
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <h2 className="text-lg font-semibold">Description</h2>
              <p className="text-neutral-200 mt-3 leading-relaxed">
                {description || 'Aucune description pour le moment.'}
              </p>
            </section>

            {/* Localisation / Carte */}
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

            {/* Publications (placeholder en lecture seule) */}
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Publications</h2>
                <span className="text-xs text-white/40">À venir</span>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                    <div className="relative w-full h-32">
                      <Image src={`/media/pub${i}.jpg`} alt={`Publication ${i}`} fill className="object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">Publication {i}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ==== Colonne droite ==== */}
          <aside className="space-y-6">
            {/* Réseaux & contacts */}
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <h2 className="text-lg font-semibold">Réseaux & contacts</h2>
              <ul className="mt-3 space-y-2 text-sm text-white/80">
                <li>
                  <span className="text-white/50">Email :</span>{' '}
                  {socials?.email || profile.user?.email || '—'}
                </li>
                <li>
                  <span className="text-white/50">Téléphone :</span>{' '}
                  {socials?.phone || '—'}
                </li>
                <li>
                  <span className="text-white/50">Site web :</span>{' '}
                  {socials?.website ? <a href={socials.website} className="underline" target="_blank" rel="noreferrer">{socials.website}</a> : '—'}
                </li>
                <li>
                  <span className="text-white/50">Instagram :</span>{' '}
                  {socials?.instagram ? <a href={socials.instagram} className="underline" target="_blank" rel="noreferrer">{socials.instagram}</a> : '—'}
                </li>
                <li>
                  <span className="text-white/50">Facebook :</span>{' '}
                  {socials?.facebook ? <a href={socials.facebook} className="underline" target="_blank" rel="noreferrer">{socials.facebook}</a> : '—'}
                </li>
                <li>
                  <span className="text-white/50">TikTok :</span>{' '}
                  {socials?.tiktok ? <a href={socials.tiktok} className="underline" target="_blank" rel="noreferrer">{socials.tiktok}</a> : '—'}
                </li>
              </ul>
            </section>

            {/* Avis — placeholder */}
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Avis</h2>
                <span className="text-xs text-white/40">À venir</span>
              </div>
              <div className="mt-3 space-y-3">
                {[{ id: 1, author: 'Agence Eventa', avatar: '/avatars/pro2.png', rating: 4, text: 'Très pro.' }].map(r => (
                  <div key={r.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-9 w-9 rounded-full overflow-hidden">
                        <Image src={r.avatar} alt={r.author} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{r.author}</p>
                        <div className="flex items-center gap-1 text-yellow-400 text-sm" aria-hidden>
                          {'★'.repeat(r.rating)}<span className="text-neutral-600">{'★'.repeat(5 - r.rating)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-200 mt-2 leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Tarifs — placeholder */}
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Tarifs</h2>
                <span className="text-xs text-white/40">À venir</span>
              </div>
              <ul className="mt-3 space-y-2">
                {[
                  { id: 1, label: 'Privatisation — semaine', price: 'Sur devis' },
                  { id: 2, label: 'Privatisation — week-end', price: 'Sur devis' },
                ].map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-neutral-300">{p.price}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}