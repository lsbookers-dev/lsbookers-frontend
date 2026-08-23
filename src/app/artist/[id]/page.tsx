'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MessageCircle, Instagram, Facebook, Globe, Music, Youtube } from 'lucide-react'
import SafeImage from '@/components/SafeImage'
import FollowButton from '@/components/FollowButton'
import AgendaCalendar from '@/components/AgendaCalendar'
import PublicationsSection from '@/components/PublicationsSection'
import { useAuth } from '@/context/AuthContext'

/* ================== Types ================== */
type ApiUser = {
  id: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  role?: string
}

type ApiProfile = {
  id: number
  userId: number
  bio?: string | null
  profession?: string | null
  location?: string | null
  country?: string | null
  radiusKm?: number | null
  specialties?: string[] | null
  styles?: string[] | null
  avatar?: string | null
  banner?: string | null
  soundcloudUrl?: string | null
  showSoundcloud?: boolean | null
  showStyles?: boolean | null
  showYoutubeUrl?: boolean | null
  youtubeUrl?: string | null
  cvText?: string | null
  feeInfo?: string | null
  instagramUrl?: string | null
  facebookUrl?: string | null
  tiktokUrl?: string | null
  twitterUrl?: string | null
  linkedinUrl?: string | null
  websiteUrl?: string | null
  followersCount?: number
  followingCount?: number
  user?: ApiUser
}

type Publication = {
  id: number
  title: string
  media: string
  mediaType: 'image' | 'video'
  caption?: string
  createdAt?: string
  _count?: { likes: number; comments: number }
}

/* ================== Helpers ================== */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

const toAbs = (u?: string | null) => {
  if (!u) return ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('//')) return `https:${u}`
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

const buildSoundcloudEmbedUrl = (url: string) => {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (trimmed.includes('w.soundcloud.com/player/')) return trimmed
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(trimmed)}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true`
}

const buildYoutubeEmbedUrl = (url: string) => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (match) return `https://www.youtube.com/embed/${match[1]}`
  return url
}

/* ================== Page ================== */
export default function ArtistPublicProfilePage() {
  const params  = useParams<{ id: string }>()
  const router  = useRouter()
  const userId  = params?.id
  const { user: viewer } = useAuth()
  const isOwner = viewer && userId ? Number(viewer.id) === Number(userId) : false

  const [profile, setProfile]           = useState<ApiProfile | null>(null)
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [abonnesCount, setAbonnesCount] = useState(0)

  const defaults = useMemo(() => ({
    banner: '/banners/artist_banner.jpg',
    avatar: '/avatars/a1.png',
  }), [])

  useEffect(() => {
    const load = async () => {
      if (!userId) return
      try {
        setLoading(true)
        setError(null)
        const profileRes = await fetch(`${API_BASE}/api/profile/user/${userId}`, { cache: 'no-store' })
        if (!profileRes.ok) throw new Error(`HTTP ${profileRes.status}`)
        const profileData = (await profileRes.json()) as { profile: ApiProfile }
        const p = profileData.profile
        setProfile(p)
        setAbonnesCount(p?.followingCount ?? 0)
        if (p?.id) {
          const pubsRes = await fetch(`${API_BASE}/api/publications/profile/${p.id}`, { cache: 'no-store' })
          if (pubsRes.ok) {
            const pubsData = await pubsRes.json()
            setPublications(pubsData.publications || [])
          }
        }
      } catch (err) {
        console.error('Erreur profil public artiste:', err)
        setError("Impossible de charger ce profil.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  if (loading) return (
    <div className="min-h-screen bg-black text-white grid place-items-center">
      <p className="text-white/70">Chargement du profil…</p>
    </div>
  )

  if (error || !profile) return (
    <div className="min-h-screen bg-black text-white grid place-items-center">
      <p className="text-red-400">{error ?? 'Profil introuvable.'}</p>
    </div>
  )

  const name       = profile.user?.pseudo || [profile.user?.firstName, profile.user?.lastName].filter(Boolean).join(' ') || 'Artiste'
  const location   = profile.location || ''
  const country    = profile.country || ''
  const specialties = Array.isArray(profile.specialties) ? profile.specialties : []
  const styles      = Array.isArray(profile.styles) ? profile.styles : []
  const bannerUrl  = toAbs(profile.banner) || defaults.banner
  const avatarUrl  = toAbs(profile.avatar) || defaults.avatar
  const bio        = profile.bio || "Cet artiste n'a pas encore rédigé de description."

  const soundcloudEmbed = profile.showSoundcloud && profile.soundcloudUrl?.trim()
    ? buildSoundcloudEmbedUrl(profile.soundcloudUrl)
    : ''

  const youtubeEmbed = profile.youtubeUrl?.trim()
    ? buildYoutubeEmbedUrl(profile.youtubeUrl)
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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Bannière */}
      <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 overflow-hidden">
        <SafeImage type="banner" src={bannerUrl} alt="Bannière" priority className="opacity-90" />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Header overlay card */}
        <section className="relative -mt-10 rounded-2xl border border-white/10 bg-neutral-900/60 p-4 md:p-5 backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <SafeImage type="avatar" src={avatarUrl} name={name} size={80} className="ring-2 ring-white/10 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold truncate">{name}</h1>
                <p className="text-sm text-white/60">{profile.user?.role || 'ARTIST'}</p>
                <p className="text-xs text-white/50 mt-1">
                  {location ? `${location}${country ? `, ${country}` : ''}` : country}
                  {profile.radiusKm ? ` • Rayon ${profile.radiusKm} km` : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-row sm:flex-col sm:items-end items-center gap-2 sm:ml-auto flex-wrap">
              <div className="flex items-center gap-2">
                <FollowButton targetUserId={profile.userId} onFollowChange={isFollowing => setAbonnesCount(c => isFollowing ? c + 1 : Math.max(0, c - 1))} />
                {!isOwner && (
                  <button onClick={() => router.push(`/messages?to=${profile.userId}`)} className="bg-white text-black rounded-full px-4 py-2 flex items-center gap-2 hover:bg-neutral-200 text-sm whitespace-nowrap">
                    <MessageCircle size={16} />Contacter
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
                <span key={s} className="text-xs px-2 py-1 rounded-full bg-pink-600/20 border border-pink-600/40">{s}</span>
              ))}
            </div>
          )}
        </section>

        {/* Corps */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mt-6 pb-12">
          <div className="space-y-6">
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <h2 className="text-lg font-semibold">À propos</h2>
              <p className="text-neutral-200 mt-3 leading-relaxed">{bio}</p>
            </section>
            {profile && (
              <AgendaCalendar profileId={profile.id} isOwner={false} showAvailability={true} viewerRole={viewer?.role ?? null} viewerProfileId={viewer?.profile?.id ?? null} />
            )}
            <PublicationsSection publications={publications} title="Publications" />
            {profile.cvText && (
              <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                <h2 className="text-lg font-semibold">CV / Expérience</h2>
                <p className="text-neutral-200 mt-3 leading-relaxed whitespace-pre-line text-sm">{profile.cvText}</p>
              </section>
            )}
          </div>
          <aside className="space-y-6">
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
              <h2 className="text-lg font-semibold">Avis</h2>
              <p className="text-neutral-400 text-sm mt-3">Les avis seront ajoutés prochainement.</p>
            </section>
            {profile.showStyles !== false && styles.length > 0 && (
              <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                <h2 className="text-lg font-semibold">Styles musicaux</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {styles.map(s => (
                    <span key={s} className="text-xs px-2 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300">{s}</span>
                  ))}
                </div>
              </section>
            )}
            {soundcloudEmbed && (
              <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-3">
                <div className="rounded-lg overflow-hidden">
                  <iframe title="Soundcloud" width="100%" height="180" scrolling="no" frameBorder="no" allow="autoplay" src={soundcloudEmbed} />
                </div>
              </section>
            )}
            {profile.showYoutubeUrl !== false && youtubeEmbed && (
              <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-400" />Vidéo de présentation
                </h2>
                <div className="rounded-xl overflow-hidden aspect-video">
                  <iframe title="YouTube" width="100%" height="100%" src={youtubeEmbed} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
                </div>
              </section>
            )}
            {profile.feeInfo && (
              <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                <h2 className="text-lg font-semibold">Tarifs</h2>
                <p className="text-neutral-200 mt-3 leading-relaxed whitespace-pre-line text-sm">{profile.feeInfo}</p>
              </section>
            )}
            {socialLinks.length > 0 && (
              <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                <h2 className="text-lg font-semibold">Réseaux sociaux</h2>
                <div className="mt-3 flex flex-wrap gap-4">
                  {socialLinks.map(({ url, icon: Icon, label, color }) => (
                    <a key={label} href={url!} target="_blank" rel="noopener noreferrer" title={label} className={`flex items-center gap-2 text-white/40 ${color} transition-colors`}>
                      <Icon className="w-5 h-5" /><span className="text-xs">{label}</span>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}