'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

/** Petite constante pour forcer TS à traiter le fichier comme "module" */
export const __ensureModule = true

// --- Types ---
interface PublicUser {
  id: number
  name: string
  email?: string
  role?: string
}

interface PublicProfile {
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
  user: PublicUser
}

// --- Helpers ---
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

const toAbs = (u?: string | null) => {
  if (!u) return ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('//')) return `https:${u}`
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

export default function ProviderPublicProfilePage() {
  const params = useParams<{ id: string }>()
  const userId = params?.id

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !API_BASE) return
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE}/api/profile/user/${userId}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as { profile?: PublicProfile }
        if (!data?.profile) throw new Error('Profil introuvable')
        setProfile(data.profile)
      } catch (e) {
        console.error('Erreur chargement profil prestataire :', e)
        setError("Impossible de charger ce profil.")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [userId])

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-6 text-white">
        <p className="text-white/70">Chargement du profil…</p>
      </main>
    )
  }

  if (error || !profile) {
    return (
      <main className="max-w-4xl mx-auto p-6 text-white">
        <p className="text-red-400">{error || 'Profil introuvable.'}</p>
      </main>
    )
  }

  const {
    user,
    bio,
    profession,
    location,
    country,
    radiusKm,
    specialties,
    typeEtablissement,
    avatar,
    banner,
  } = profile

  const avatarSrc = toAbs(avatar) || '/default-avatar.png'
  const bannerSrc = toAbs(banner) || '/banners/placeholder.jpg'

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Bandeau */}
      <div className="relative h-48 sm:h-56 md:h-64">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bannerSrc} alt="Bannière" className="w-full h-full object-cover opacity-90" />
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-10">
        <div className="flex items-end gap-4">
          <div className="relative w-24 h-24 rounded-full ring-4 ring-black overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarSrc} alt={user?.name || 'avatar'} className="w-full h-full object-cover" />
          </div>
          <div className="pb-2">
            <h1 className="text-2xl md:text-3xl font-bold">{user?.name || 'Prestataire'}</h1>
            <p className="text-white/70 text-sm">
              {(location || 'Localisation inconnue')}{country ? `, ${country}` : ''}
            </p>
          </div>
        </div>

        {/* Infos */}
        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
            <h2 className="text-lg font-semibold mb-3">Informations</h2>
            <ul className="space-y-2 text-sm">
              <li><span className="text-white/60">Rôle&nbsp;:</span> {user?.role || '—'}</li>
              <li><span className="text-white/60">Type d’établissement&nbsp;:</span> {typeEtablissement || '—'}</li>
              <li><span className="text-white/60">Profession&nbsp;:</span> {profession || '—'}</li>
              <li><span className="text-white/60">E-mail&nbsp;:</span> {user?.email || '—'}</li>
              <li><span className="text-white/60">Rayon d’intervention&nbsp;:</span> {radiusKm ? `${radiusKm} km` : '—'}</li>
            </ul>
            {Array.isArray(specialties) && specialties.length > 0 && (
              <div className="mt-3">
                <p className="text-white/60 text-sm mb-2">Spécialités</p>
                <div className="flex flex-wrap gap-2">
                  {specialties.map(sp => (
                    <span
                      key={sp}
                      className="text-xs px-2 py-1 rounded-full bg-violet-600/20 border border-violet-500/30"
                    >
                      {sp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
            <h2 className="text-lg font-semibold mb-3">À propos</h2>
            <p className="text-sm text-white/90 leading-relaxed">
              {bio || 'Aucune description pour le moment.'}
            </p>
          </div>
        </section>

        {/* Placeholders pour sections futures (galerie, calendrier…) */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
          <h2 className="text-lg font-semibold mb-2">Galerie / Médias</h2>
          <p className="text-sm text-white/70">
            (À intégrer plus tard comme sur la page publique Artiste.)
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-neutral-900/60 p-4 mb-10">
          <h2 className="text-lg font-semibold mb-2">Calendrier</h2>
          <p className="text-sm text-white/70">
            (À intégrer plus tard si nécessaire pour les prestataires.)
          </p>
        </section>
      </div>
    </main>
  )
}