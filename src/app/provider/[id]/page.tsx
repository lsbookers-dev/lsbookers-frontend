'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'

/* ================== Types ================== */
type PublicUser = {
  id: number
  name: string
  email?: string | null
  role?: string | null
}

type PublicProfile = {
  id: number
  userId: number
  typeEtablissement?: string | null
  specialties?: string[] | null
  location?: string | null
  country?: string | null
  radiusKm?: number | null
  avatar?: string | null
  banner?: string | null
  user?: PublicUser
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
export default function ProviderPublicProfilePage() {
  const params = useParams<{ id: string }>()
  const userId = params?.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<PublicProfile | null>(null)

  // visuels par défaut
  const defaults = useMemo(
    () => ({
      banner: '/banners/artist_banner.jpg',
      avatar: '/default-avatar.png',
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
  const name = profile.user?.name || 'Prestataire'
  const role = profile.user?.role || 'PROVIDER'
  const bannerUrl = toAbs(profile.banner) || defaults.banner
  const avatarUrl = toAbs(profile.avatar) || defaults.avatar
  const location = profile.location || '—'
  const country = profile.country || ''
  const radius = profile.radiusKm ?? null
  const specialties = Array.isArray(profile.specialties) ? profile.specialties : []
  const etab = profile.typeEtablissement || ''

  return (
    <main className="min-h-screen bg-black text-white">
      {/* ===== Bannière (lecture seule) ===== */}
      <div className="relative h-48 sm:h-56 md:h-64 lg:h-72">
        <Image src={bannerUrl} alt="Bannière" fill priority className="object-cover opacity-90" />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* ===== Entête carte (lecture seule) ===== */}
        <section className="relative -mt-10 rounded-2xl border border-white/10 bg-neutral-900/60 p-4 md:p-5 backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 rounded-full overflow-hidden ring-2 ring-white/10 shrink-0">
              <Image src={avatarUrl} alt={name} fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold truncate">{name}</h1>
              <p className="text-sm text-white/60">
                {role}{etab ? ` • ${etab}` : ''}
              </p>
              <p className="text-xs text-white/50 mt-1">
                {location}{country ? `, ${country}` : ''}{radius ? ` • Rayon ${radius} km` : ''}
              </p>
            </div>
            <div className="hidden md:block ml-auto text-xs text-white/40">Consultation publique</div>
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

        {/* ===== À propos (lecture seule) ===== */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-neutral-900/60 p-4 md:p-5">
          <h2 className="text-lg font-semibold mb-3">À propos</h2>
          <ul className="space-y-2 text-sm text-white/80">
            <li><span className="text-white/50">Email :</span> {profile.user?.email ?? '—'}</li>
            <li><span className="text-white/50">Établissement :</span> {etab || '—'}</li>
            <li><span className="text-white/50">Localisation :</span> {profile.location ?? '—'}</li>
            <li><span className="text-white/50">Pays :</span> {country || '—'}</li>
            <li><span className="text-white/50">Rayon de déplacement :</span> {radius ?? '—'} {radius !== null ? 'km' : ''}</li>
          </ul>
        </section>

        {/* ===== Blocs de remplissage futurs (lecture seule) ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pb-12">
          <section className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4 md:p-5">
            <h2 className="text-lg font-semibold">Galerie</h2>
            <p className="text-sm text-white/60 mt-2">À venir.</p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4 md:p-5">
            <h2 className="text-lg font-semibold">Avis</h2>
            <p className="text-sm text-white/60 mt-2">À venir.</p>
          </section>
        </div>
      </div>
    </main>
  )
}