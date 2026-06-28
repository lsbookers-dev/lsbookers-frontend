'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  Heart, Star, MapPin, Users, ChevronLeft, ChevronRight,
  Briefcase, Loader2, UserPlus, Flame
} from 'lucide-react'

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

type Post = {
  id: number
  media: string
  mediaType: string
  caption: string | null
  title: string
  createdAt: string
  likesCount: number
  likedByMe: boolean
  isFromFollow: boolean
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

type Offer = {
  id: number
  title: string
  description: string
  type: 'ARTIST' | 'PROVIDER' | 'ALL'
  specialty: string | null
  location: string
  country: string
  date: string
  createdAt: string
  organizer: { user: { name: string } | null } | null
}

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

function offerTypeLabel(type: string): string {
  if (type === 'ARTIST')   return 'Artiste'
  if (type === 'PROVIDER') return 'Prestataire'
  return 'Tous profils'
}

/* ─────────────────────────────────────────────────────────────
   CAROUSEL (profils mis en avant)
───────────────────────────────────────────────────────────── */
function FeaturedCarousel({ items }: { items: FeaturedProfile[] }) {
  const [idx, setIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIdx(prev => (prev + 1) % Math.ceil(items.length / 2))
    }, 4000)
  }, [items.length])

  useEffect(() => {
    startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [startTimer])

  const slidesCount = Math.ceil(items.length / 2)
  const prev = () => { setIdx(p => (p - 1 + slidesCount) % slidesCount); startTimer() }
  const next = () => { setIdx(p => (p + 1) % slidesCount); startTimer() }

  if (items.length === 0) return null

  const pair = items.slice(idx * 2, idx * 2 + 2)

  return (
    <div className="relative mb-8">
      {/* Label */}
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        <span className="text-xs font-semibold uppercase tracking-widest text-yellow-400/80">
          Profils mis en avant
        </span>
      </div>

      {/* Slides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pair.map(p => (
          <Link key={p.id} href={p.profileUrl} className="group relative h-44 md:h-52 rounded-2xl overflow-hidden block border border-white/10">
            {/* Background : bannière ou dégradé */}
            {p.banner ? (
              <Image src={p.banner} alt={p.name} fill className="object-cover opacity-60 group-hover:opacity-70 transition-opacity" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-[#0a0a0f] to-pink-900/40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Badge premium */}
            {p.isPremium && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                <Star className="w-3 h-3 fill-yellow-300" /> Premium
              </div>
            )}

            {/* Contenu */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0 bg-zinc-800">
                {p.avatar ? (
                  <Image src={p.avatar} alt={p.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-lg font-bold">
                    {p.name[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{p.name}</p>
                <p className="text-xs text-white/70">
                  {p.profession || roleLabel(p.role)}
                  {p.location && ` · ${p.location}`}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Flèches */}
      {slidesCount > 1 && (
        <>
          <button onClick={prev} className="absolute -left-3 top-1/2 translate-y-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-full p-1.5 transition-colors">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button onClick={next} className="absolute -right-3 top-1/2 translate-y-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-full p-1.5 transition-colors">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {slidesCount > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: slidesCount }).map((_, i) => (
            <button key={i} onClick={() => { setIdx(i); startTimer() }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-purple-400 w-4' : 'bg-white/20'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   CARTE PUBLICATION
───────────────────────────────────────────────────────────── */
function PostCard({ post, onLike }: { post: Post; onLike: (id: number) => void }) {
  return (
    <article className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
      {/* Header auteur */}
      <div className="flex items-center gap-3 p-3">
        <Link href={post.author.profileUrl} className="relative w-9 h-9 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 block">
          {post.author.avatar ? (
            <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-sm font-bold">
              {post.author.name[0]}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={post.author.profileUrl} className="text-sm font-semibold text-white hover:text-purple-300 transition-colors truncate block">
            {post.author.name}
          </Link>
          <p className="text-xs text-white/40">
            {post.author.profession || roleLabel(post.author.role)} · {timeAgo(post.createdAt)}
          </p>
        </div>
        {post.isFromFollow && (
          <span className="text-xs text-purple-400/60 flex-shrink-0">Suivi</span>
        )}
      </div>

      {/* Média */}
      <div className="relative w-full aspect-[4/3] bg-zinc-900">
        {post.mediaType === 'VIDEO' ? (
          <video src={post.media} controls className="w-full h-full object-cover" />
        ) : (
          <Image src={post.media} alt={post.caption || post.title} fill className="object-cover" />
        )}
      </div>

      {/* Footer */}
      <div className="p-3 space-y-2">
        <button
          onClick={() => onLike(post.id)}
          className="flex items-center gap-1.5 text-sm transition-colors"
        >
          <Heart
            className={`w-4 h-4 transition-all ${post.likedByMe ? 'fill-pink-500 text-pink-500 scale-110' : 'text-white/40 hover:text-pink-400'}`}
          />
          <span className={post.likedByMe ? 'text-pink-400' : 'text-white/40'}>
            {post.likesCount}
          </span>
        </button>
        {post.caption && (
          <p className="text-sm text-white/70 leading-relaxed line-clamp-2">{post.caption}</p>
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
      if (loc) {
        params.append('country', loc)
        params.append('city', loc)
      }
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

  // Debounce filter
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
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Ville ou pays…"
          className="bg-white/5 border border-white/10 text-white/70 text-xs rounded-lg px-2 py-1 w-28 placeholder:text-white/25 focus:outline-none focus:border-purple-500/40"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-4 h-4 text-white/20 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-xs text-white/25 py-6">Aucun résultat</p>
      ) : (
        <ul className="py-2">
          {items.map((it, i) => (
            <li key={it.id}>
              <Link href={it.profileUrl}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/4 transition-colors">
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
                  <p className="text-xs text-white/40 truncate">
                    {it.profession}{it.location ? ` · ${it.location}` : ''}
                  </p>
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
    const token = localStorage.getItem('token')
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
                <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-bold">
                  {p.name[0]}
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={p.profileUrl} className="text-sm text-white hover:text-purple-300 transition-colors truncate block">
                {p.name}
              </Link>
              <p className="text-xs text-white/40 truncate">
                {p.profession || roleLabel(p.role)}{p.location ? ` · ${p.location}` : ''}
              </p>
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
   SECTION OFFRES
───────────────────────────────────────────────────────────── */
function OffersSection({ apiBase }: { apiBase: string }) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(false)

  const loadOffers = useCallback(async (loc: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (loc) { params.append('country', loc); params.append('location', loc) }
      const r = await fetch(`${apiBase}/api/offers?${params}`)
      if (r.ok) {
        const d = await r.json()
        setOffers(Array.isArray(d) ? d.slice(0, 6) : [])
      }
    } finally {
      setLoading(false)
    }
  }, [apiBase])

  useEffect(() => { loadOffers('') }, [loadOffers])

  useEffect(() => {
    const t = setTimeout(() => loadOffers(filter), 500)
    return () => clearTimeout(t)
  }, [filter, loadOffers])

  return (
    <section className="mt-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue-400" />
          <h2 className="text-base font-bold text-white">Dernières offres</h2>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Ville ou pays…"
            className="bg-white/5 border border-white/10 text-white/70 text-xs rounded-lg px-3 py-1.5 placeholder:text-white/25 focus:outline-none focus:border-purple-500/40 w-36"
          />
          <Link href="/offers"
            className="text-xs font-medium bg-white/8 hover:bg-white/12 border border-white/10 rounded-lg px-3 py-1.5 text-white/70 transition-colors">
            Voir tout
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-10 text-white/25 text-sm border border-white/5 rounded-2xl">
          Aucune offre disponible
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {offers.map(o => (
            <div key={o.id} className="rounded-2xl border border-white/8 bg-white/3 p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2">{o.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  o.type === 'ARTIST'   ? 'bg-pink-500/15 text-pink-300 border border-pink-500/20' :
                  o.type === 'PROVIDER' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20' :
                                          'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                }`}>
                  {offerTypeLabel(o.type)}
                </span>
              </div>
              <p className="text-xs text-white/50 line-clamp-2">{o.description}</p>
              <div className="flex items-center gap-3 text-xs text-white/40 mt-auto">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {o.location}, {o.country}
                </span>
                <span>📅 {new Date(o.date).toLocaleDateString('fr-FR')}</span>
              </div>
              <Link href={`/offers`}
                className="mt-1 w-full text-center text-xs font-medium bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-purple-300 rounded-lg py-2 transition-colors">
                Voir l'offre
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────────────────── */
export default function HomePage() {
  const { user } = useAuth() as { user: { id: number } | null }
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

  const [featured, setFeatured]   = useState<FeaturedProfile[]>([])
  const [posts, setPosts]         = useState<Post[]>([])
  const [suggested, setSuggested] = useState<SuggestedProfile[]>([])
  const [loadingFeed, setLoadingFeed] = useState(true)

  // Tab mobile : 'feed' | 'top' | 'offers'
  const [mobileTab, setMobileTab] = useState<'feed' | 'top' | 'offers'>('feed')

  // ── Chargement initial ──────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`

    // Carousel (public)
    fetch(`${API_BASE}/api/home/carousel`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setFeatured(d.featured || []) })
      .catch(() => {})

    // Feed + suggestions (auth)
    if (user) {
      setLoadingFeed(true)
      fetch(`${API_BASE}/api/home/feed`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setPosts(d.posts || []) })
        .catch(() => {})
        .finally(() => setLoadingFeed(false))

      fetch(`${API_BASE}/api/home/suggested`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setSuggested(d.suggested || []) })
        .catch(() => {})
    } else {
      setLoadingFeed(false)
    }
  }, [user, API_BASE])

  // ── Toggle like ─────────────────────────────────────────
  const handleLike = async (postId: number) => {
    if (!user) return
    const token = localStorage.getItem('token')

    // Optimistic
    setPosts(prev => prev.map(p =>
      p.id !== postId ? p : {
        ...p,
        likedByMe: !p.likedByMe,
        likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1,
      }
    ))

    try {
      await fetch(`${API_BASE}/api/publications/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // Rollback
      setPosts(prev => prev.map(p =>
        p.id !== postId ? p : {
          ...p,
          likedByMe: !p.likedByMe,
          likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1,
        }
      ))
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 text-white">

      {/* ── Carousel ───────────────────────────────────────── */}
      <FeaturedCarousel items={featured} />

      {/* ── Tabs mobile ────────────────────────────────────── */}
      <div className="flex lg:hidden gap-1 mb-6 bg-white/4 rounded-xl p-1 border border-white/8">
        {(['feed', 'top', 'offers'] as const).map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mobileTab === tab
                ? 'bg-purple-600 text-white'
                : 'text-white/40 hover:text-white/70'
            }`}>
            {tab === 'feed' ? 'Publications' : tab === 'top' ? 'Top' : 'Offres'}
          </button>
        ))}
      </div>

      {/* ── Layout principal ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ════ COLONNE FEED (2/3) ════════════════════════════ */}
        <div className={`lg:col-span-2 ${mobileTab !== 'feed' ? 'hidden lg:block' : ''}`}>
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            Publications
            {posts.length > 0 && (
              <span className="text-xs text-white/30 font-normal">· défiler pour en voir plus</span>
            )}
          </h2>

          {/* Zone scrollable — ~3 posts visibles */}
          <div className="h-[900px] overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {loadingFeed ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
                <p className="text-sm text-white/30">Chargement du feed…</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-3xl">
                  📸
                </div>
                <div>
                  <p className="text-white/60 font-medium">Aucune publication pour l'instant</p>
                  <p className="text-white/30 text-sm mt-1">
                    Suis des artistes et prestataires pour voir leurs publications ici.
                  </p>
                </div>
                <Link href="/search"
                  className="bg-purple-600/80 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded-xl transition-colors">
                  Découvrir des profils
                </Link>
              </div>
            ) : (
              posts.map(p => (
                <PostCard key={p.id} post={p} onLike={handleLike} />
              ))
            )}
          </div>
        </div>

        {/* ════ SIDEBAR (1/3) ═════════════════════════════════ */}
        <aside className={`space-y-5 ${mobileTab === 'feed' ? 'hidden lg:block' : mobileTab !== 'top' ? 'hidden lg:block' : ''}`}>
          <TopList title="Top Artistes"     role="ARTIST"   apiBase={API_BASE} />
          <TopList title="Top Prestataires" role="PROVIDER" apiBase={API_BASE} />
          <SuggestedProfiles items={suggested} />
        </aside>
      </div>

      {/* ── Section Offres ─────────────────────────────────── */}
      <div className={mobileTab !== 'offers' ? 'hidden lg:block' : ''}>
        <OffersSection apiBase={API_BASE} />
      </div>
    </main>
  )
}
