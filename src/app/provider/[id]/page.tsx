// src/app/provider/[id]/page.tsx
'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'

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

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

const toAbs = (u?: string | null) => {
  if (!u) return ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('//')) return `https:${u}`
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

export default function ProviderPublicProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [profile, setProfile] = React.useState<PublicProfile | null>(null)

  React.useEffect(() => {
    let alive = true
    async function run() {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/api/profile/user/${id}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const p: PublicProfile | undefined = data?.profile
        if (alive) setProfile(p ?? null)
      } catch (e) {
        if (alive) setError("Impossible de charger le profil.")
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => { alive = false }
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <p className="text-white/70">Chargement…</p>
      </main>
    )
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <p className="text-red-400">{error ?? 'Profil introuvable.'}</p>
      </main>
    )
  }

  const avatar = toAbs(profile.avatar) || '/default-avatar.png'
  const banner = toAbs(profile.banner) || '/default-banner.jpg'
  const name = profile.user?.name ?? 'Prestataire'
  const role = profile.user?.role ?? 'PROVIDER'

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Bandeau */}
      <div className="relative h-48 md:h-56 lg:h-64">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={banner} alt="Bannière" className="w-full h-full object-cover opacity-90" />
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Header carte */}
        <section className="relative -mt-10 rounded-2xl border border-white/10 bg-neutral-900/60 p-4 md:p-5">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatar}
              alt={name}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-white/10"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-avatar.png' }}
            />
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold truncate">{name}</h1>
              <p className="text-sm text-white/60">
                {role} {profile.typeEtablissement ? `• ${profile.typeEtablissement}` : ''}
              </p>
              <p className="text-xs text-white/50 mt-1">
                {profile.location ? `${profile.location}${profile.country ? `, ${profile.country}` : ''}` : (profile.country ?? '')}
                {profile.radiusKm ? ` • Rayon ${profile.radiusKm} km` : ''}
              </p>
            </div>
          </div>

          {Array.isArray(profile.specialties) && profile.specialties.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.specialties.map((s) => (
                <span key={s} className="text-xs px-2 py-1 rounded-full bg-violet-600/20 border border-violet-600/30">
                  {s}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Contenu simple (public) */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-neutral-900/60 p-4 md:p-5">
          <h2 className="text-lg font-semibold mb-3">À propos</h2>
          <ul className="space-y-2 text-sm text-white/80">
            <li><span className="text-white/50">Email :</span> {profile.user?.email ?? '—'}</li>
            <li><span className="text-white/50">Localisation :</span> {profile.location ?? '—'}</li>
            <li><span className="text-white/50">Pays :</span> {profile.country ?? '—'}</li>
            <li><span className="text-white/50">Rayon de déplacement :</span> {profile.radiusKm ?? '—'} km</li>
          </ul>
        </section>
      </div>
    </main>
  )
}