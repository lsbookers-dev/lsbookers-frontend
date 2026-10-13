'use client'

/**
 * Lien de booking partagé (bio Instagram, signature e-mail…) : visible sans compte.
 * Montre l'essentiel du profil et mène à la demande de date (agenda du profil).
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import SafeImage from '@/components/SafeImage'
import PublicBrand from '@/components/PublicBrand'
import LsIcon, { LsBullet } from '@/components/ui/LsIcon'
import { Stars } from '@/components/ReviewsPanel'
import { profileActivity, profileName, publicProfileHref } from '@/components/profile/utils'
import type { ProfileData } from '@/components/profile/types'
import { radiusLabel } from '@/utils/radius'

export default function BookingLinkPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading')

  useEffect(() => {
    apiFetch(apiUrl(`profile/user/${id}`), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => { setProfile(d.profile); setStatus('ready') })
      .catch(() => setStatus('missing'))
  }, [id])

  const profileHref = profile ? publicProfileHref(profile.user?.role, profile.userId) : null
  const name = profileName(profile)
  const place = [profile?.location, profile?.country].filter(Boolean).join(', ')

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-white">
      <div className="mx-auto grid max-w-md gap-6">
        <div className="flex justify-center"><PublicBrand /></div>

        {status === 'loading' && <div className="h-96 animate-pulse rounded-3xl bg-white/[0.04]" />}

        {status === 'missing' && (
          <div className="grid justify-items-center gap-3 rounded-3xl border border-line bg-surface p-8 text-center">
            <LsIcon name="user" size={30} tone="muted" />
            <h1 className="text-lg font-semibold">Ce lien n’est plus valable</h1>
            <p className="text-sm text-muted">Le profil n’existe pas ou n’est plus disponible.</p>
            <Link href="/" className="mt-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Découvrir LS Bookers</Link>
          </div>
        )}

        {status === 'ready' && profile && (
          <article className="overflow-hidden rounded-3xl border border-line bg-surface">
            <div className="relative h-36">
              <SafeImage type="banner" src={profile.banner} alt="" className="opacity-75" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface" />
            </div>
            <div className="relative z-10 -mt-12 grid justify-items-center gap-3 px-6 pb-7 text-center">
              <SafeImage type="avatar" src={profile.avatar} name={name} size={96} className="rounded-2xl ring-2 ring-gold/40" />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
                <p className="mt-1 text-sm text-muted">{[profileActivity(profile), place, radiusLabel(profile.radiusKm)].filter(Boolean).join(' · ')}</p>
              </div>
              {(profile.reviewsCount ?? 0) > 0 && profile.reviewsAvg != null && (
                <div className="flex items-center gap-2 text-sm">
                  <Stars value={profile.reviewsAvg} size={14} />
                  <span className="font-semibold text-gold">{profile.reviewsAvg.toFixed(1)}</span>
                  <span className="text-muted">· {profile.reviewsCount} avis</span>
                </div>
              )}
              {(profile.specialties?.length ?? 0) > 0 && (
                <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-xs text-white/75">
                  {profile.specialties!.slice(0, 5).map(s => <li key={s} className="inline-flex items-center gap-1.5"><LsBullet size={11} />{s}</li>)}
                </ul>
              )}
              {profile.bio && <p className="line-clamp-4 text-sm leading-relaxed text-white/70">{profile.bio}</p>}

              <div className="mt-2 grid w-full gap-2">
                {user ? (
                  <Link href={`${profileHref}#agenda`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong">
                    <LsIcon name="booking" size={18} tone="inherit" />Voir les disponibilités et demander une date
                  </Link>
                ) : (
                  <>
                    <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong">
                      <LsIcon name="booking" size={18} tone="inherit" />Créer un compte gratuit pour demander une date
                    </Link>
                    <Link href="/login" className="rounded-xl border border-line px-4 py-3 text-sm text-white/80 transition hover:text-white">
                      J’ai déjà un compte
                    </Link>
                  </>
                )}
              </div>
            </div>
          </article>
        )}
        <p className="text-center text-xs text-white/35">LS Bookers met en relation artistes, organisateurs et prestataires de l’événementiel.</p>
      </div>
    </main>
  )
}
