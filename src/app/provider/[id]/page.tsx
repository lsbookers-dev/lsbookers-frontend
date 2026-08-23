'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MessageCircle, Instagram, Facebook, Globe, Music, Youtube } from 'lucide-react'
import SafeImage from '@/components/SafeImage'
import FollowButton from '@/components/FollowButton'
import AgendaCalendar from '@/components/AgendaCalendar'
import PublicationsSection from '@/components/PublicationsSection'
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
  cvText?: string | null
  feeInfo?: string | null
  youtubeUrl?: string | null
  showYoutubeUrl?: boolean
  instagramUrl?: string | null
  facebookUrl?: string | null
  tiktokUrl?: string | null
  twitterUrl?: string | null
  linkedinUrl?: string | null
  websiteUrl?: string | null
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
  _count?: { likes: number; comments: number }
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
  const isOwner = viewer && userId ? Number(viewer.id) === Number(userId) : false

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [abonnesCount, setAbonnesCount] = useState(0)

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [publications, setPublications] = useState<Publication[]>([])

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

  return (

    <main className="min-h-screen bg-black text-white">

      {/* ===== Bannière ===== */}

      <div className="relative h-48 sm:h-56 md:h-64 lg:h-72">
        <SafeImage type="banner" src={bannerUrl} alt="Bannière" priority className="opacity-90" />
      </div>

      <div className="max-w-6xl mx-auto px-4">

        {/* ===== Header ===== */}

        <section className="relative -mt-10 rounded-2xl border border-white/10 bg-neutral-900/60 p-4 md:p-5 backdrop-blur">

          {/* Ligne 1 : avatar + nom + boutons (responsive) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <SafeImage type="avatar" src={avatarUrl} name={name} size={80} className="ring-2 ring-white/10 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold truncate">{name}</h1>
                <p className="text-sm text-white/60">{role}{etab ? ` • ${etab}` : ''}</p>
                <p className="text-xs text-white/50 mt-1">
                  {location}{country ? `, ${country}` : ''}{radius ? ` • Rayon ${radius} km` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col sm:items-end items-center gap-2 sm:ml-auto flex-wrap">
              <div className="flex items-center gap-2">
                {!isOwner && (
                  <FollowButton
                    targetUserId={profile.userId}
                    onFollowChange={isFollowing => setAbonnesCount(c => isFollowing ? c + 1 : Math.max(0, c - 1))}
                  />
                )}
                {!isOwner && (
                  <button
                    onClick={() => router.push(`/messages?to=${profile.userId}`)}
                    className="bg-white text-black rounded-full px-4 py-2 flex items-center gap-2 hover:bg-neutral-200 text-sm whitespace-nowrap"
                  >
                    <MessageCircle size={16} />
                    Contacter
                  </button>
                )}
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
            <PublicationsSection publications={publications} title="Réalisations" />

            {/* Agenda */}
            {profile && (
              <AgendaCalendar
                profileId={profile.id}
                isOwner={false}
                showAvailability={true}
                viewerRole={viewer?.role ?? null}
                viewerProfileId={viewer?.profile?.id ?? null}
              />
            )}

            {/* CV */}
            {profile.cvText && (
              <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                <h2 className="text-lg font-semibold">CV / Expérience</h2>
                <p className="text-neutral-200 mt-3 leading-relaxed whitespace-pre-line text-sm">{profile.cvText}</p>
              </section>
            )}

          </div>

          {/* ===== Colonne droite ===== */}

          {(() => {
            const youtubeEmbed = profile.youtubeUrl?.trim()
              ? (() => {
                  const match = profile.youtubeUrl!.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
                  return match ? `https://www.youtube.com/embed/${match[1]}` : profile.youtubeUrl!
                })()
              : ''

            const socialLinks = [
              { url: profile.instagramUrl, icon: Instagram, label: 'Instagram',  color: 'hover:text-pink-400' },
              { url: profile.facebookUrl,  icon: Facebook,  label: 'Facebook',   color: 'hover:text-blue-400' },
              { url: profile.tiktokUrl,    icon: Music,      label: 'TikTok',     color: 'hover:text-white' },
              { url: profile.twitterUrl,   icon: Globe,      label: 'Twitter/X',  color: 'hover:text-sky-400' },
              { url: profile.linkedinUrl,  icon: Globe,      label: 'LinkedIn',   color: 'hover:text-blue-300' },
              { url: profile.websiteUrl,   icon: Globe,      label: 'Site web',   color: 'hover:text-violet-400' },
            ].filter(s => s.url?.trim())

            return (
              <aside className="space-y-6">

                {/* Avis */}
                <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                  <h2 className="text-lg font-semibold">Avis</h2>
                  <p className="text-neutral-400 text-sm mt-3">Les avis seront ajoutés prochainement.</p>
                </section>

                {/* Prestations & Tarifs */}
                {profile.feeInfo && (
                  <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                    <h2 className="text-lg font-semibold">Prestations &amp; Tarifs</h2>
                    <p className="text-neutral-200 mt-3 leading-relaxed whitespace-pre-line text-sm">{profile.feeInfo}</p>
                  </section>
                )}

                {/* Vidéo de présentation */}
                {profile.showYoutubeUrl !== false && youtubeEmbed && (
                  <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-red-400" />
                      Vidéo de présentation
                    </h2>
                    <div className="rounded-xl overflow-hidden aspect-video">
                      <iframe
                        title="YouTube"
                        width="100%"
                        height="100%"
                        src={youtubeEmbed}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  </section>
                )}

                {/* Réseaux sociaux */}
                {socialLinks.length > 0 && (
                  <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                    <h2 className="text-lg font-semibold">Réseaux sociaux</h2>
                    <div className="mt-3 flex flex-wrap gap-4">
                      {socialLinks.map(({ url, icon: Icon, label, color }) => (
                        <a
                          key={label}
                          href={url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={label}
                          className={`flex items-center gap-2 text-white/40 ${color} transition-colors`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs">{label}</span>
                        </a>
                      ))}
                    </div>
                  </section>
                )}

              </aside>
            )
          })()}

        </div>

      </div>

    </main>

  )

}