'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  Heart, Star, Users, ChevronLeft, ChevronRight,
  Briefcase, Loader2, UserPlus, Flame, MessageCircle, ChevronDown,
  Volume2, VolumeX, Images, Share2,
} from 'lucide-react'
import PublicationModal from '@/components/PublicationModal'
import AddPublicationModal from '@/components/AddPublicationModal'
import OfferModal, { type OfferDetail } from '@/components/OfferModal'
import { getAuthToken } from '@/utils/auth'
import CityAutocomplete from '@/components/CityAutocomplete'

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type FeaturedProfile = {
  id: number
  name: string
  avatar: string | null
  banner: string | null
  profession: string | null
  location: string | null
  role: string
  isPremium: boolean
  profileUrl: string
}

type PostMedia = { id?: number; url: string; mediaType: string; order?: number }

type Post = {
  id: number
  media: string
  mediaType: string
  caption: string | null
  title: string
  createdAt: string
  likesCount: number
  commentsCount: number
  likedByMe: boolean
  isFromFollow: boolean
  feedType?: 'followed' | 'trending' | 'suggestion'
  additionalMedia?: PostMedia[]
  author: {
    profileId: number
    userId: number | null
    name: string
    avatar: string | null
    role: string | null
    profession: string | null
    profileUrl: string
  }
}

type TopProfile = {
  id: number
  name: string
  avatar: string | null
  profession: string | null
  location: string | null
  followersCount: number
  avgRating: number
  reviewsCount: number
  profileUrl: string
}

type SuggestedProfile = {
  id: number
  name: string
  avatar: string | null
  profession: string | null
  location: string | null
  followersCount: number
  role: string
  profileUrl: string
}

type AdminPost = {
  id: number
  title: string | null
  content: string | null
  mediaUrl: string | null
  mediaType: string | null
  pinned: boolean
  createdAt: string
}

type Offer = OfferDetail & { endDate?: string | null }


/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  return `Il y a ${d}j`
}

function roleLabel(role: string | null): string {
  if (role === 'ARTIST')    return 'Artiste'
  if (role === 'ORGANIZER') return 'Organisateur'
  if (role === 'PROVIDER')  return 'Prestataire'
  return ''
}

/* ─────────────────────────────────────────────────────────────
   CAROUSEL (profils mis en avant)
───────────────────────────────────────────────────────────── */
function FeaturedCarousel({ items }: { items: FeaturedProfile[] }) {
  const [idx, setIdx] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => { setIsMobile(e.matches); setIdx(0) }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Desktop : 1 slide par profil, toujours 2 affiches en circulaire
  // Mobile  : 1 seul profil par slide
  const slidesCount = items.length

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIdx(prev => (prev + 1) % slidesCount)
    }, 4000)
  }, [slidesCount])

  useEffect(() => {
    startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [startTimer])

  const prev = () => { setIdx(p => (p - 1 + slidesCount) % slidesCount); startTimer() }
  const next = () => { setIdx(p => (p + 1) % slidesCount); startTimer() }

  if (items.length === 0) return null

  // Sur desktop, toujours 2 profils, avec wrap-around circulaire
  const visibleItems = isMobile
    ? [items[idx % items.length]]
    : [items[idx % items.length], items[(idx + 1) % items.length]]

  return (
    <div className="relative mb-8">
<div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {visibleItems.map(p => (
          <Link key={p.id} href={p.profileUrl} className="group relative h-44 md:h-52 rounded-2xl overflow-hidden block border border-white/10">
            {p.banner ? (
              <Image src={p.banner} alt={p.name} fill className="object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-[#0a0a0f] to-pink-900/40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            {p.isPremium && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                <Star className="w-3 h-3 fill-yellow-300" /> Premium
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0 bg-zinc-800">
                {p.avatar ? (
                  <Image src={p.avatar} alt={p.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-lg font-bold">{p.name[0]}</div>
                )}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{p.name}</p>
                <p className="text-xs text-white/70">
                  {p.profession || roleLabel(p.role)}{p.location && ` · ${p.location}`}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {slidesCount > 1 && (
        <>
          <button onClick={prev} className="absolute -left-3 top-1/2 translate-y-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-full p-1.5 transition-colors">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button onClick={next} className="absolute -right-3 top-1/2 translate-y-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-full p-1.5 transition-colors">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
          <div className="flex justify-center gap-1.5 mt-3">
            {Array.from({ length: slidesCount }).map((_, i) => (
              <button key={i} onClick={() => { setIdx(i); startTimer() }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-purple-400 w-4' : 'bg-white/20'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   CARTE PUBLICATION OFFICIELLE LSBOOKERS
───────────────────────────────────────────────────────────── */
function AdminPostCard({ post }: { post: AdminPost }) {
  const isVideo = post.mediaType === 'VIDEO'

  return (
    <article className="group relative min-h-[24rem] overflow-hidden rounded-[1.4rem] border border-violet-400/20 bg-[#131019] shadow-[0_28px_75px_rgba(0,0,0,.2)] sm:aspect-[16/10] sm:min-h-0">
      {post.mediaUrl && (
        <div className="absolute inset-0 bg-black">
          {isVideo ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={post.mediaUrl}
              className="h-full w-full object-cover"
              controls
              preload="metadata"
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.mediaUrl}
              alt={post.title || 'LS Bookers'}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.015]"
              loading="lazy"
            />
          )}
        </div>
      )}
      {!post.mediaUrl && <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(168,85,247,.32),transparent_38%),linear-gradient(145deg,#1d1428,#0d0b12_70%)]" />}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/5 to-black/95" />

      <header className="absolute inset-x-0 top-0 z-[3] flex items-center gap-3 p-4 sm:p-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-violet-300/35 bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xs font-bold text-white shadow-lg">LS</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-white">LS Bookers <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" /></span>
          <span className="mt-0.5 block text-[10px] text-white/55">{timeAgo(post.createdAt)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-400/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-amber-200 backdrop-blur-md"><Star size={11} className="fill-current" /> Officiel</span>
      </header>

      {(post.title || post.content) && (
        <div className="absolute bottom-6 left-5 right-5 z-[3] max-w-2xl">
          <p className="text-[9px] font-bold uppercase tracking-[.18em] text-violet-300">Actualité LSBookers</p>
          {post.title && <h2 className="mt-2 font-serif text-2xl font-semibold leading-[1.05] text-white drop-shadow sm:text-3xl">{post.title}</h2>}
          {post.content && <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-white/70 sm:text-xs">{post.content}</p>}
        </div>
      )}
    </article>
  )
}

/* ─────────────────────────────────────────────────────────────
   CARTE PUBLICATION
───────────────────────────────────────────────────────────── */
function PostCard({ post, onLike, onOpenModal, currentUserId, isMuted, onToggleMute }: {
  post: Post
  onLike: (id: number) => void
  onOpenModal: (post: Post) => void
  currentUserId?: number
  isMuted: boolean
  onToggleMute: () => void
}) {
  const allMedia = [
    { url: post.media, mediaType: post.mediaType },
    ...(post.additionalMedia ?? []).map(m => ({ url: m.url, mediaType: m.mediaType })),
  ]
  const [mediaIdx, setMediaIdx] = useState(0)
  const current = allMedia[mediaIdx] ?? allMedia[0]
  const isMulti = allMedia.length > 1
  const isVideo = current.mediaType === 'video' || current.mediaType === 'VIDEO'

  const videoRef = useRef<HTMLVideoElement>(null)

  // Met à jour le mute sur l'élément vidéo (React muted prop n'est pas réactif)
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted
  }, [isMuted])

  // Autoplay quand la vidéo entre dans le viewport, pause quand elle sort
  useEffect(() => {
    if (!isVideo) return
    const video = videoRef.current
    if (!video) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            video.play().catch(() => {})
          } else {
            video.pause()
            video.currentTime = 0.1
          }
        })
      },
      { threshold: 0.4 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [current.url, isVideo])

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMediaIdx(i => (i - 1 + allMedia.length) % allMedia.length)
  }
  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMediaIdx(i => (i + 1) % allMedia.length)
  }

  const share = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const shareData = {
      title: post.title,
      text: post.caption || post.title,
      url: window.location.href,
    }
    try {
      if (navigator.share) await navigator.share(shareData)
      else await navigator.clipboard.writeText(window.location.href)
    } catch {
      /* L'utilisateur peut fermer la feuille de partage sans erreur visible. */
    }
  }

  const feedLabel = post.feedType === 'suggestion'
    ? 'À découvrir'
    : post.feedType === 'trending'
      ? 'En tendance'
      : null

  return (
    <article className="group relative overflow-hidden rounded-[1.4rem] border border-white/[0.1] bg-[#111016] shadow-[0_28px_75px_rgba(0,0,0,.2)]">
      {isVideo ? (
        <div className="relative aspect-video bg-black" onClick={() => onOpenModal(post)}>
          <video
            key={current.url}
            ref={videoRef}
            src={current.url}
            className="h-full w-full cursor-pointer object-cover transition duration-700 group-hover:scale-[1.015]"
            muted preload="metadata" playsInline loop
            onLoadedMetadata={(e) => { e.currentTarget.currentTime = 0.1 }}
          />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current.url} alt={post.caption || post.title} className="w-full cursor-pointer block transition duration-700 group-hover:scale-[1.015]" loading="lazy" onClick={() => onOpenModal(post)} />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />

      <header className="absolute inset-x-0 top-0 z-[3] flex items-center gap-3 p-4 sm:p-5">
        <Link href={post.author.profileUrl} className="relative block h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-white/20 bg-zinc-800 shadow-lg">
          {post.author.avatar ? (
            <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-sm font-bold">{post.author.name[0]}</div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={post.author.profileUrl} className="block truncate text-sm font-semibold text-white drop-shadow hover:text-purple-200">
            {post.author.name}
          </Link>
          <p className="mt-0.5 text-[10px] text-white/60">
            {post.author.profession || roleLabel(post.author.role)} · {timeAgo(post.createdAt)}
          </p>
        </div>
        {post.isFromFollow && post.author.userId !== currentUserId && (
          <span className="flex-shrink-0 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[9px] text-violet-200 backdrop-blur-md">Suivi</span>
        )}
      </header>

      <div className="absolute left-4 top-[4.7rem] z-[3] flex gap-2 sm:left-5 sm:top-[5.25rem]">
        {feedLabel && <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-white/75 backdrop-blur-md">{feedLabel}</span>}
        {isMulti && <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[9px] text-white/75 backdrop-blur-md"><Images size={11} /> {mediaIdx + 1} / {allMedia.length}</span>}
      </div>

      {isMulti && (
        <>
          <button type="button" onClick={prev} aria-label="Média précédent" className="absolute left-3 top-1/2 z-[4] grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/45 text-white/70 opacity-100 backdrop-blur-md transition hover:bg-black/75 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"><ChevronLeft size={17} /></button>
          <button type="button" onClick={next} aria-label="Média suivant" className="absolute right-3 top-1/2 z-[4] grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/45 text-white/70 opacity-100 backdrop-blur-md transition hover:bg-black/75 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"><ChevronRight size={17} /></button>
          <div className="absolute bottom-4 left-1/2 z-[4] flex -translate-x-1/2 gap-1" onClick={event => event.stopPropagation()}>
            {allMedia.map((_, index) => <button key={index} type="button" onClick={event => { event.stopPropagation(); setMediaIdx(index) }} aria-label={`Afficher le média ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === mediaIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`} />)}
          </div>
        </>
      )}

      <div className="absolute bottom-5 left-4 right-[4.8rem] z-[3] sm:bottom-6 sm:left-5 sm:right-24">
        <button type="button" onClick={() => onOpenModal(post)} className="block text-left">
          <h2 className="font-serif text-2xl font-semibold leading-[1.05] text-white drop-shadow sm:text-3xl">{post.title}</h2>
          {post.caption && <p className="mt-2 line-clamp-2 max-w-xl text-[11px] leading-relaxed text-white/70 sm:text-xs">{post.caption}</p>}
        </button>
      </div>

      <div className="absolute bottom-5 right-3 z-[5] grid gap-2.5 sm:bottom-6 sm:right-5">
        <span className="grid justify-items-center gap-1">
          <button type="button" onClick={event => { event.stopPropagation(); onLike(post.id) }} aria-label={post.likedByMe ? 'Retirer le J’aime' : 'Aimer'} className={`grid h-11 w-11 place-items-center rounded-full border backdrop-blur-md transition ${post.likedByMe ? 'border-pink-400/45 bg-pink-500/25 text-pink-300' : 'border-white/15 bg-black/50 text-white/80 hover:bg-white/10'}`}><Heart size={17} className={post.likedByMe ? 'fill-current' : ''} /></button>
          <span className="text-[9px] text-white/65">{post.likesCount}</span>
        </span>
        <span className="grid justify-items-center gap-1">
          <button type="button" onClick={event => { event.stopPropagation(); onOpenModal(post) }} aria-label="Voir les commentaires" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur-md transition hover:bg-white/10"><MessageCircle size={17} /></button>
          <span className="text-[9px] text-white/65">{post.commentsCount ?? 0}</span>
        </span>
        <button type="button" onClick={share} aria-label="Partager" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur-md transition hover:bg-white/10"><Share2 size={16} /></button>
        {isVideo && (
          <button type="button" onClick={event => { event.stopPropagation(); onToggleMute() }} aria-label={isMuted ? 'Activer le son' : 'Couper le son'} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur-md transition hover:bg-white/10">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        )}
      </div>
    </article>
  )
}

/* ─────────────────────────────────────────────────────────────
   TOP LISTE (artistes ou prestataires)
───────────────────────────────────────────────────────────── */
function TopList({ title, role, apiBase }: { title: string; role: 'ARTIST' | 'PROVIDER'; apiBase: string }) {
  const [items, setItems] = useState<TopProfile[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(false)

  const fetch_ = useCallback(async (loc: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ role })
      if (loc) params.append('city', loc)
      const r = await fetch(`${apiBase}/api/home/top?${params}`)
      if (r.ok) {
        const d = await r.json()
        setItems(d.top || [])
      }
    } finally {
      setLoading(false)
    }
  }, [role, apiBase])

  useEffect(() => { fetch_('') }, [fetch_])
  useEffect(() => {
    const t = setTimeout(() => fetch_(filter), 500)
    return () => clearTimeout(t)
  }, [filter, fetch_])

  const icon = role === 'ARTIST' ? '🎤' : '🛠️'

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/80">{title}</span>
        </div>
        <CityAutocomplete
          value={filter}
          onChange={v => setFilter(v)}
          placeholder="Ville…"
          showDepartment={false}
          dropdownMinWidth={0}
          inputClassName="bg-white/5 border border-white/10 text-white/70 text-xs rounded-lg px-2 py-1 w-24 placeholder:text-white/25 focus:outline-none focus:border-purple-500/40"
        />
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 text-white/20 animate-spin" /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-xs text-white/25 py-6">Aucun résultat</p>
      ) : (
        <ul className="py-2">
          {items.map((it, i) => (
            <li key={it.id}>
              <Link href={it.profileUrl} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/4 transition-colors">
                <span className="w-5 text-center text-xs font-bold text-pink-500">{i + 1}</span>
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                  {it.avatar ? (
                    <Image src={it.avatar} alt={it.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-bold">{icon}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{it.name}</p>
                  <p className="text-xs text-white/40 truncate">{it.profession}{it.location ? ` · ${it.location}` : ''}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-0.5 text-xs text-white/30">
                    <Users className="w-3 h-3" /> {it.followersCount}
                  </div>
                  {it.reviewsCount > 0 && (
                    <div className="flex items-center gap-0.5 text-xs text-yellow-400/70">
                      <Star className="w-3 h-3 fill-yellow-400/70" /> {it.avgRating}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   SUGGESTIONS DE PROFILS
───────────────────────────────────────────────────────────── */
function SuggestedProfiles({ items }: { items: SuggestedProfile[] }) {
  const [followed, setFollowed] = useState<Set<number>>(new Set())
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

  const follow = async (userId: number) => {
    const token = getAuthToken()
    try {
      await fetch(`${API_BASE}/api/follow/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setFollowed(prev => new Set([...prev, userId]))
    } catch { /* silencieux */ }
  }

  if (items.length === 0) return null

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
        <UserPlus className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-white/80">Suggestions</span>
      </div>
      <ul className="py-2">
        {items.map(p => (
          <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
            <Link href={p.profileUrl} className="relative w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 block">
              {p.avatar ? (
                <Image src={p.avatar} alt={p.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-bold">{p.name[0]}</div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={p.profileUrl} className="text-sm text-white hover:text-purple-300 transition-colors truncate block">{p.name}</Link>
              <p className="text-xs text-white/40 truncate">{p.profession || roleLabel(p.role)}{p.location ? ` · ${p.location}` : ''}</p>
            </div>
            <button
              onClick={() => follow(p.id)}
              disabled={followed.has(p.id)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all flex-shrink-0 ${
                followed.has(p.id)
                  ? 'bg-white/5 text-white/30 border border-white/10'
                  : 'bg-purple-600/80 hover:bg-purple-500 text-white border border-purple-500/40'
              }`}
            >
              {followed.has(p.id) ? 'Suivi ✓' : 'Suivre'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   SIDEBAR OFFRES (colonne droite, compact)
───────────────────────────────────────────────────────────── */
const OFFER_TYPE_STYLE: Record<string, { label: string; accent: string }> = {
  ARTIST:   { label: 'ARTISTE RECHERCHÉ', accent: 'text-pink-300' },
  PROVIDER: { label: 'PRESTATAIRE RECHERCHÉ', accent: 'text-purple-300' },
  ALL:      { label: 'PROFIL RECHERCHÉ', accent: 'text-violet-300' },
}

function OffersSidebar({ apiBase, onSelectOffer }: {
  apiBase: string
  onSelectOffer: (offer: Offer) => void
}) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`${apiBase}/api/offers`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setOffers(Array.isArray(d) ? d.slice(0, 6) : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [apiBase])

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
        <Briefcase className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-white/80">Dernières offres</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 text-white/20 animate-spin" /></div>
      ) : offers.length === 0 ? (
        <p className="text-center text-xs text-white/25 py-6">Aucune offre</p>
      ) : (
        <div className="p-3 flex flex-col gap-2">
          {offers.map(o => {
            const typeStyle = OFFER_TYPE_STYLE[o.type] ?? OFFER_TYPE_STYLE.ALL
            const start = new Date(o.date)
            const end = o.endDate ? new Date(o.endDate) : null
            const dateLabel = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '')
            const startTime = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            const endTime = end?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            const avatarUrl = o.organizer.avatar
              ? (o.organizer.avatar.startsWith('http') ? o.organizer.avatar : `${apiBase}${o.organizer.avatar}`)
              : null

            return (
              <button
                key={o.id}
                onClick={() => onSelectOffer(o)}
                className="group relative h-[92px] w-full overflow-hidden rounded-xl border border-white/8 bg-[linear-gradient(115deg,#121019_0%,#1d1230_72%,#29113c_100%)] px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-purple-300/30"
              >
                <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-purple-500 to-pink-400" />
                <span className={`block truncate text-[9px] font-semibold tracking-[0.11em] ${typeStyle.accent}`}>
                  {typeStyle.label}
                </span>
                <strong className="mt-1 block truncate text-[15px] font-semibold leading-tight text-white transition-colors group-hover:text-purple-100">
                  {o.specialty || o.title}
                </strong>
                <span className="mt-2 grid min-w-0 grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2">
                  <span className="relative h-6 w-6 overflow-hidden rounded-lg bg-gradient-to-br from-purple-700 to-pink-600">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="" fill sizes="24px" className="object-cover" unoptimized />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-[8px] font-semibold text-white">
                        {o.organizer.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[10px] font-medium leading-none text-white/90">{o.organizer.name}</span>
                    <span className="mt-1 block truncate text-[9px] leading-none text-white/45">
                      {o.location} · {dateLabel} · {startTime}{endTime ? `–${endTime}` : ''}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[8px] uppercase tracking-[0.08em] text-white/35">Tarif</span>
                    <strong className="mt-0.5 block whitespace-nowrap text-[10px] font-semibold leading-none text-white/90">
                      {o.fee != null ? `${o.fee} €` : 'À définir'}
                    </strong>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="px-4 py-3 border-t border-white/8">
        <Link href="/offers" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
          Voir toutes les offres →
        </Link>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────────────────── */
export default function HomePage() {
  const { user } = useAuth() as { user: { id: number; avatarUrl?: string | null; name?: string; role: string; profile?: { id: number } } | null }
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

  const [featured, setFeatured]           = useState<FeaturedProfile[]>([])
  const [posts, setPosts]                 = useState<Post[]>([])
  const [selectedPost, setSelectedPost]   = useState<Post | null>(null)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [suggested, setSuggested]         = useState<SuggestedProfile[]>([])
  const [adminPosts, setAdminPosts]       = useState<AdminPost[]>([])
  const [loadingFeed, setLoadingFeed]     = useState(true)
  const [loadingMore, setLoadingMore]     = useState(false)
  const [feedCursor, setFeedCursor]       = useState<string | null>(null)
  const [hasMore, setHasMore]             = useState(true)
  const [isMuted, setIsMuted]             = useState(true)
  const toggleMute = () => setIsMuted(m => !m)
  const [activeTab, setActiveTab]         = useState<'forYou' | 'network' | 'nearby'>('forYou')
  const [showAddPubModal, setShowAddPubModal] = useState(false)

  // ── Fetch feed — pagination par curseur (stable, évite le décalage de skip) ──
  const fetchFeed = useCallback(async (cursor: string | null, replace: boolean) => {
    if (!user) return
    const token = getAuthToken()
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    if (replace) setLoadingFeed(true)
    else setLoadingMore(true)
    try {
      const url = cursor
        ? `${API_BASE}/api/home/feed?after=${encodeURIComponent(cursor)}`
        : `${API_BASE}/api/home/feed`
      const r = await fetch(url, { headers })
      const d = r.ok ? await r.json() : null
      if (!d) return
      const newPosts: typeof posts = d.posts || []
      if (replace) {
        setPosts(newPosts)
        setAdminPosts(d.adminPosts || [])
      } else {
        setPosts(prev => [...prev, ...newPosts])
      }
      // Le curseur pointe sur le createdAt du dernier post reçu
      if (newPosts.length > 0) {
        setFeedCursor(newPosts[newPosts.length - 1].createdAt)
      }
      setHasMore(d.hasMore ?? false)
    } catch {
      /* silencieux */
    } finally {
      if (replace) setLoadingFeed(false)
      else setLoadingMore(false)
    }
  }, [user, API_BASE])

  // ── Chargement initial ──────────────────────────────────
  useEffect(() => {
    const token = getAuthToken()
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`

    fetch(`${API_BASE}/api/home/carousel`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setFeatured(d.featured || []) })
      .catch(() => {})

    if (user) {
      fetchFeed(null, true)

      fetch(`${API_BASE}/api/home/suggested`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setSuggested(d.suggested || []) })
        .catch(() => {})
    } else {
      setLoadingFeed(false)
    }
  }, [user, API_BASE, fetchFeed])

  // ── Toggle like (avec rollback correct en cas d'erreur) ──
  const handleLike = async (postId: number) => {
    if (!user) return
    const token = getAuthToken()
    // Capturer l'état original avant la mise à jour optimiste
    const original = posts.find(p => p.id === postId)
    if (!original) return
    const wasLiked = original.likedByMe
    const prevCount = original.likesCount
    // Mise à jour optimiste
    setPosts(prev => prev.map(p =>
      p.id !== postId ? p : { ...p, likedByMe: !wasLiked, likesCount: wasLiked ? prevCount - 1 : prevCount + 1 }
    ))
    try {
      const response = await fetch(`${API_BASE}/api/publications/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Like refusé')
    } catch {
      // Rollback vers l'état original (pas un double-toggle)
      setPosts(prev => prev.map(p =>
        p.id !== postId ? p : { ...p, likedByMe: wasLiked, likesCount: prevCount }
      ))
    }
  }

  // Posts épinglés en tête, les autres mélangés chronologiquement
  type FeedItem = { kind: 'post'; data: Post } | { kind: 'admin'; data: AdminPost }

  const pinnedItems: FeedItem[] = adminPosts
    .filter(p => p.pinned)
    .map(p => ({ kind: 'admin' as const, data: p }))

  const mixedItems: FeedItem[] = [
    ...adminPosts.filter(p => !p.pinned).map(p => ({ kind: 'admin' as const, data: p })),
    ...posts.map(p => ({ kind: 'post' as const, data: p })),
  ].sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime())

  const combinedFeed: FeedItem[] = [...pinnedItems, ...mixedItems]

  // Filtrage selon l'onglet actif
  const filteredFeed: FeedItem[] = activeTab === 'network'
    ? combinedFeed.filter(item => item.kind === 'admin' || (item.kind === 'post' && item.data.isFromFollow))
    : activeTab === 'nearby'
    ? combinedFeed.filter(item => item.kind === 'admin')
    : combinedFeed

  return (
    <main className="lsb-page lsb-home-page text-white">

      {featured.length > 0 && <FeaturedCarousel items={featured} />}

      <div className="lsb-home-grid">
        <div className="lsb-feed-column">

          <header className="lsb-page-heading lsb-home-heading">
            <div><span>VOTRE RÉSEAU</span><h1>La scène bouge<em>.</em></h1><p>Les nouveautés de votre univers professionnel.</p></div>
          </header>

          <section className="lsb-composer" style={{ cursor: 'pointer' }} onClick={() => setShowAddPubModal(true)}>
            <div className="lsb-composer-avatar overflow-hidden">
              {user?.avatarUrl ? (
                <Image src={user.avatarUrl} alt="" width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} unoptimized />
              ) : (
                user?.name ? user.name[0].toUpperCase() : 'LS'
              )}
            </div>
            <span className="flex-1 text-white/40">Ajouter une Publication</span>
          </section>

          <div className="lsb-feed-tabs" role="tablist" aria-label="Fil d'actualité">
            <button className={activeTab === 'forYou' ? 'is-active' : ''} onClick={() => setActiveTab('forYou')}>Pour vous</button>
            <button className={activeTab === 'network' ? 'is-active' : ''} onClick={() => setActiveTab('network')}>Mon réseau</button>
            <button className={activeTab === 'nearby' ? 'is-active' : ''} onClick={() => setActiveTab('nearby')}>À proximité</button>
          </div>

          {loadingFeed ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
              <p className="text-sm text-white/30">Chargement du feed…</p>
            </div>
          ) : activeTab === 'nearby' ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-3xl">📍</div>
              <div>
                <p className="text-white/60 font-medium">Bientôt disponible</p>
                <p className="text-white/30 text-sm mt-1">Les publications à proximité seront disponibles prochainement.</p>
              </div>
            </div>
          ) : filteredFeed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-3xl">📸</div>
              <div>
                <p className="text-white/60 font-medium">Aucune publication pour l&apos;instant</p>
                <p className="text-white/30 text-sm mt-1">{activeTab === 'network' ? 'Suis des artistes et prestataires pour voir leurs publications ici.' : 'Aucune publication pour l\'instant.'}</p>
              </div>
              <Link href="/discover" className="bg-purple-600/80 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded-xl transition-colors">
                Découvrir des profils
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFeed.map(item =>
                item.kind === 'admin'
                  ? <AdminPostCard key={`admin-${item.data.id}`} post={item.data} />
                  : <PostCard key={item.data.id} post={item.data} onLike={handleLike} onOpenModal={setSelectedPost} currentUserId={user?.id} isMuted={isMuted} onToggleMute={toggleMute} />
              )}

              {/* Bouton Charger plus (pagination serveur) */}
              {hasMore && (
                <button
                  onClick={() => fetchFeed(feedCursor, false)}
                  disabled={loadingMore}
                  className="w-full py-3 rounded-2xl border border-white/10 bg-white/3 hover:bg-white/6 text-sm text-white/50 hover:text-white/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadingMore
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <ChevronDown className="w-4 h-4" />
                  }
                  {loadingMore ? 'Chargement…' : 'Charger plus de publications'}
                </button>
              )}

              {/* Fin du feed */}
              {!hasMore && filteredFeed.length > 0 && (
                <p className="text-center text-xs text-white/20 py-6">— Vous avez tout vu —</p>
              )}
            </div>
          )}
        </div>

        <aside className="lsb-home-rail">
          <TopList title="Artistes en tendance" role="ARTIST" apiBase={API_BASE} />
          <TopList title="Prestataires en tendance" role="PROVIDER" apiBase={API_BASE} />
          <OffersSidebar apiBase={API_BASE} onSelectOffer={setSelectedOffer} />
        </aside>
      </div>

      {/* ── Modale ajouter publication ─────────────────────── */}
      {showAddPubModal && user && (
        <AddPublicationModal
          profileId={user.profile?.id ?? 0}
          token={getAuthToken() ?? ''}
          accent="violet"
          onClose={() => setShowAddPubModal(false)}
          onPublished={(pub) => {
            setPosts(prev => [{
              id: pub.id,
              media: pub.media,
              mediaType: pub.mediaType.toUpperCase(),
              caption: pub.caption ?? null,
              title: pub.title ?? '',
              createdAt: new Date().toISOString(),
              likesCount: 0,
              commentsCount: 0,
              likedByMe: false,
              isFromFollow: false,
              additionalMedia: pub.additionalMedia ?? [],
              author: {
                profileId: user.profile?.id ?? 0,
                userId: Number(user.id),
                name: user.name ?? '',
                avatar: user.avatarUrl ?? null,
                role: user.role,
                profession: null,
                profileUrl: '/studio-profile',
              },
            }, ...prev])
            setShowAddPubModal(false)
          }}
        />
      )}

      {/* ── Modale offre ───────────────────────────────────── */}
      {selectedOffer && (
        <OfferModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          isLoggedIn={!!user}
        />
      )}

      {/* ── Modale publication ─────────────────────────────── */}
      {selectedPost && (
        <PublicationModal
          pub={{
            id: selectedPost.id,
            title: selectedPost.title,
            media: selectedPost.media,
            mediaType: selectedPost.mediaType.toLowerCase() as 'image' | 'video',
            caption: selectedPost.caption ?? undefined,
            createdAt: selectedPost.createdAt,
            additionalMedia: selectedPost.additionalMedia ?? [],
            _count: { likes: selectedPost.likesCount, comments: selectedPost.commentsCount ?? 0 },
          }}
          onClose={() => setSelectedPost(null)}
          ownerUserId={selectedPost.author.userId ?? undefined}
          onCountChange={(pubId, likes, comments) => {
            setPosts(prev => prev.map(p =>
              p.id === pubId ? { ...p, likesCount: likes, commentsCount: comments } : p
            ))
          }}
          initialLiked={selectedPost.likedByMe}
        />
      )}
    </main>
  )
}
