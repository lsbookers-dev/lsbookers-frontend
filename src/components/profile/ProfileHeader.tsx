'use client'

/** En-tête d'un profil : bannière, photo, nom, activité, statistiques, spécialités. */

import Link from 'next/link'
import { ProBadge } from '@/components/plan/UpgradePrompt'
import { Camera, Pencil } from 'lucide-react'
import SafeImage from '@/components/SafeImage'
import { radiusLabel } from '@/utils/radius'
import type { ProfileData, ProfileMode } from './types'
import { profileActivity, profileName, publicProfileHref } from './utils'

type Props = {
  profile: ProfileData
  mode: ProfileMode
  followersCount: number
  publicationsCount: number
  actions: React.ReactNode
  /** Studio : clic sur la bannière / la photo pour la changer */
  onPickBanner?: () => void
  onPickAvatar?: () => void
  uploading?: 'avatar' | 'banner' | null
}

const Spinner = ({ size = 'h-6 w-6' }: { size?: string }) => (
  <div className={`${size} animate-spin rounded-full border-2 border-white/40 border-t-white`} />
)

export default function ProfileHeader({ profile, mode, followersCount, publicationsCount, actions, onPickBanner, onPickAvatar, uploading }: Props) {
  const name = profileName(profile)
  const activity = profileActivity(profile)
  const place = [profile.location, profile.country].filter(Boolean).join(', ')
  const details = [activity, place, radiusLabel(profile.radiusKm)].filter(Boolean)
  const editable = mode === 'studio'

  return (
    <>
      <div className={`group relative h-48 overflow-hidden sm:h-56 md:h-64 lg:h-72 ${editable ? 'cursor-pointer' : ''}`} onClick={onPickBanner}>
        <SafeImage type="banner" src={profile.banner} alt="Bannière" priority className="opacity-75" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#13131e]/20 to-[#13131e]/70" />
        {editable && (
          <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${uploading === 'banner' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {uploading === 'banner' ? <Spinner /> : <span className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs"><Camera size={14} /> Changer la bannière</span>}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <section className="relative -mt-12 overflow-hidden rounded-2xl border border-white/[0.12] bg-[rgba(255,255,255,0.06)] backdrop-blur-2xl">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                disabled={!editable}
                onClick={onPickAvatar}
                aria-label={editable ? 'Changer la photo de profil' : undefined}
                className="group/avatar relative shrink-0 rounded-xl disabled:cursor-default"
              >
                <SafeImage type="avatar" src={profile.avatar} name={name} size={82} priority className="rounded-xl ring-2 ring-gold/40" />
                {editable && (
                  <span className={`absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 transition-opacity ${uploading === 'avatar' ? 'opacity-100' : 'opacity-0 group-hover/avatar:opacity-100'}`}>
                    {uploading === 'avatar' ? <Spinner size="h-4 w-4" /> : <Pencil size={16} />}
                  </span>
                )}
              </button>
              <div className="min-w-0">
                <h1 className="flex items-center gap-2 text-2xl font-semibold md:text-3xl">
                  <span className="truncate">{name}</span>
                  {profile.user?.isPro && <ProBadge className="shrink-0" />}
                </h1>
                {details.length > 0 && <p className="mt-1 text-xs text-white/45">{details.join(' · ')}</p>}
                {profile.managedBy && publicProfileHref(profile.managedBy.role, profile.managedBy.userId) && (
                  <p className="mt-1 text-xs text-white/55">
                    Géré par <Link href={publicProfileHref(profile.managedBy.role, profile.managedBy.userId)!} className="font-semibold text-accent-light hover:underline">{profile.managedBy.name}</Link>
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{actions}</div>
          </div>

          <div className="flex border-t border-white/[0.07]">
            {[
              { value: followersCount, label: 'abonnés' },
              { value: profile.followingCount ?? 0, label: 'abonnements' },
              { value: publicationsCount, label: 'publications' },
            ].map((stat, index) => (
              <div key={stat.label} className={`flex-1 py-3 text-center ${index < 2 ? 'border-r border-white/[0.07]' : ''}`}>
                <p className="text-base font-semibold text-white">{stat.value}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/35">{stat.label}</p>
              </div>
            ))}
          </div>

          {(profile.specialties?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-white/[0.07] px-5 py-3">
              {profile.specialties!.map(item => (
                <span key={item} className="rounded-full border border-white/[0.1] bg-white/[0.06] px-3 py-1 text-xs text-white/55">{item}</span>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
