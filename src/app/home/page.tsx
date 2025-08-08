'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'

type PromotedProfile = {
  id: number
  name: string
  role: 'ARTIST' | 'PROVIDER'
  city: string
  avatar: string
  banner: string
}

type Post = {
  id: number
  user: { name: string; avatar: string; role: string }
  createdAt: string
  mediaType: 'image' | 'video'
  mediaUrl: string
  caption: string
  likes: number
  comments: number
}

type RankingItem = {
  id: number
  name: string
  tagline: string
  avatar: string
  city: string
}

type Offer = {
  id: number
  place: string
  city: string
  title: string
  date: string
  search: string
}

// ---------- MOCK DATA (remplace par les vrais appels plus tard) ----------
const promotedMock: PromotedProfile[] = [
  { id: 1, name: 'Mike', role: 'ARTIST', city: 'Marseille', avatar: '/default-avatar.png', banner: '/default-banner.jpg' },
  { id: 2, name: 'Manon', role: 'PROVIDER', city: 'Toulon', avatar: '/default-avatar.png', banner: '/default-banner.jpg' },
  { id: 3, name: 'Lena', role: 'PROVIDER', city: 'Marseille', avatar: '/default-avatar.png', banner: '/default-banner.jpg' },
  { id: 4, name: 'Yoann', role: 'ARTIST', city: 'Lille', avatar: '/default-avatar.png', banner: '/default-banner.jpg' },
  { id: 5, name: 'Théo', role: 'ARTIST', city: 'Lyon', avatar: '/default-avatar.png', banner: '/default-banner.jpg' },
  { id: 6, name: 'Jérôme', role: 'PROVIDER', city: 'Paris', avatar: '/default-avatar.png', banner: '/default-banner.jpg' },
]

const postsMock: Post[] = [
  {
    id: 1,
    user: { name: 'Studio 88', avatar: '/default-avatar.png', role: 'DJ - Marseille' },
    createdAt: 'Il y a 3 h',
    mediaType: 'image',
    mediaUrl: '/default-banner.jpg',
    caption: 'Mix hier soir à Marseille 🎧🔥',
    likes: 39,
    comments: 6,
  },
  {
    id: 2,
    user: { name: 'La Sicile Authentique', avatar: '/default-avatar.png', role: 'Traiteur - Aubagne' },
    createdAt: 'Il y a 1 j',
    mediaType: 'image',
    mediaUrl: '/default-banner.jpg',
    caption: 'Prestation traiteur à Aubagne 🍝',
    likes: 63,
    comments: 9,
  },
]

const topArtistsMock: RankingItem[] = [
  { id: 1, name: 'Mike', tagline: 'DJ', avatar: '/default-avatar.png', city: 'Marseille' },
  { id: 2, name: 'Emilie', tagline: 'Chanteuse', avatar: '/default-avatar.png', city: 'Lyon' },
  { id: 3, name: 'Nicolas', tagline: 'DJ', avatar: '/default-avatar.png', city: 'Marseille' },
  { id: 4, name: 'Coralie', tagline: 'Danseuse', avatar: '/default-avatar.png', city: 'Lille' },
  { id: 5, name: 'Lena', tagline: 'Chanteuse', avatar: '/default-avatar.png', city: 'Nice' },
]

const topProvidersMock: RankingItem[] = [
  { id: 1, name: 'La Sicile Authentique', tagline: 'Traiteur', avatar: '/default-avatar.png', city: 'Aubagne' },
  { id: 2, name: 'Studio Flash', tagline: 'Photographe', avatar: '/default-avatar.png', city: 'Marseille' },
  { id: 3, name: 'Neon Booth', tagline: 'Photobooth', avatar: '/default-avatar.png', city: 'Avignon' },
  { id: 4, name: 'Wedding Planing', tagline: 'Wedding Planner', avatar: '/default-avatar.png', city: 'Toulon' },
  { id: 5, name: 'ScenoPro', tagline: 'Décorateur', avatar: '/default-avatar.png', city: 'Marseille' },
]

const offersMock: Offer[] = [
  { id: 1, place: 'Studio 88', city: 'Marseille', title: 'Soirée R&B', date: '25/10/2025', search: 'DJ' },
  { id: 2, place: 'Concert', city: 'Marseille', title: 'Fête de la Musique', date: '21/06/2025', search: 'Chanteur' },
  { id: 3, place: 'Rooftop', city: 'La Ciotat', title: 'Soirée Disco', date: '25/08/2025', search: 'Danseur' },
  { id: 4, place: 'Société', city: 'Avignon', title: 'Séminaire', date: '25/11/2025', search: 'Traiteur' },
  { id: 5, place: 'Chez Mario', city: 'Cassis', title: 'Soirée Italienne', date: '08/10/2025', search: 'Chanteur' },
  { id: 6, place: 'Wedding Planing', city: 'Aubagne', title: 'Soirée R&B', date: '25/10/2025', search: 'DJ' },
]

// ---------- CAROUSEL ----------
function PromotedCarousel({ items }: { items: PromotedProfile[] }) {
  const [index, setIndex] = useState(0)
  const visible = 2
  const totalPages = Math.ceil(items.length / visible)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [paused, setPaused] = useState(false)

  const pageItems = useMemo(() => {
    const start = index * visible
    return items.slice(start, start + visible)
  }, [index, items])

  const next = () => setIndex((i) => (i + 1) % totalPages)
  const prev = () => setIndex((i) => (i - 1 + totalPages) % totalPages)

  useEffect(() => {
    if (paused) return
    intervalRef.current = setInterval(next, 4000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [paused, totalPages])

  return (
    <div
      className="relative w-full bg-[#0b0b0b] rounded-2xl p-4 border border-white/10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pageItems.map((p) => (
          <div key={p.id} className="relative overflow-hidden rounded-xl bg-gradient-to-b from-white/5 to-white/0">
            <div className="relative h-40 w-full">
              <Image
                src={p.banner}
                alt={`${p.name} banner`}
                fill
                className="object-cover opacity-80"
                priority
              />
            </div>
            <div className="flex items-center gap-4 p-4">
              <Image
                src={p.avatar}
                alt={`${p.name} avatar`}
                width={64}
                height={64}
                className="rounded-full border-2 border-white/20"
              />
              <div>
                <div className="text-lg font-semibold">{p.name}</div>
                <div className="text-sm text-white/60">
                  {p.role === 'ARTIST' ? 'Artiste' : 'Prestataire'} · {p.city}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <button
        aria-label="Précédent"
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 px-3 py-2"
      >
        ‹
      </button>
      <button
        aria-label="Suivant"
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 px-3 py-2"
      >
        ›
      </button>

      {/* Dots */}
      <div className="mt-3 flex justify-center gap-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  )
}

// ---------- RANKINGS ----------
function Rankings({
  titleLeft,
  titleRight,
  left,
  right,
}: {
  titleLeft: string
  titleRight: string
  left: RankingItem[]
  right: RankingItem[]
}) {
  const [scope, setScope] = useState<'France' | 'Région' | 'Ville'>('France')

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xl font-bold">Classements</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="opacity-70">Zone :</span>
          <select
            className="rounded bg-[#121212] px-3 py-1 border border-white/10"
            value={scope}
            onChange={(e) => setScope(e.target.value as typeof scope)}
          >
            <option>France</option>
            <option>Région</option>
            <option>Ville</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[{ title: titleLeft, data: left }, { title: titleRight, data: right }].map(
          (block) => (
            <div key={block.title} className="rounded-2xl border border-white/10 p-4">
              <div className="mb-3 text-lg font-semibold">{block.title}</div>
              <ul className="space-y-3">
                {block.data.map((item, idx) => (
                  <li key={item.id} className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                    <div className="text-sm w-6 shrink-0 text-center opacity-60">{idx + 1}</div>
                    <Image
                      src={item.avatar}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="rounded-full border border-white/10"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{item.name}</div>
                      <div className="truncate text-sm opacity-70">
                        {item.tagline} · {item.city}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </div>
    </div>
  )
}

// ---------- OFFERS ----------
function Offers({ offers }: { offers: Offer[] }) {
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xl font-bold">Annonces</h3>
        <button className="rounded-lg bg-yellow-500 px-3 py-1.5 text-black font-semibold hover:bg-yellow-400">
          Voir toutes les annonces
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {offers.map((o) => (
          <div key={o.id} className="rounded-2xl border border-white/10 p-4 bg-[#0f0f0f]">
            <div className="mb-2 text-lg font-semibold">{o.place}</div>
            <div className="mb-2 text-sm opacity-70">{o.city}</div>
            <div className="space-y-1 text-sm">
              <div>Évènement : <span className="opacity-90">{o.title}</span></div>
              <div>Date : <span className="opacity-90">{o.date}</span></div>
              <div>Recherche : <span className="opacity-90">{o.search}</span></div>
            </div>
            <div className="mt-3">
              <button className="rounded-lg border border-white/20 px-3 py-1.5 hover:bg-white/10">
                Contacter
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- FEED ----------
function Feed({ posts }: { posts: Post[] }) {
  return (
    <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-1">
      {posts.map((p) => (
        <article key={p.id} className="rounded-2xl border border-white/10 bg-[#0f0f0f]">
          <header className="flex items-center gap-3 p-4">
            <Image
              src={p.user.avatar}
              alt={p.user.name}
              width={40}
              height={40}
              className="rounded-full border border-white/10"
            />
            <div className="min-w-0">
              <div className="truncate font-semibold">{p.user.name}</div>
              <div className="truncate text-sm opacity-60">{p.user.role} • {p.createdAt}</div>
            </div>
          </header>

          <div className="relative w-full">
            {p.mediaType === 'image' ? (
              <Image
                src={p.mediaUrl}
                alt={p.caption}
                width={1200}
                height={800}
                className="h-72 w-full object-cover"
                priority
              />
            ) : (
              <video src={p.mediaUrl} controls className="h-72 w-full object-cover" />
            )}
          </div>

          <div className="space-y-3 p-4">
            <p className="text-sm">{p.caption}</p>
            <div className="flex items-center gap-3 text-sm opacity-80">
              <button className="rounded border border-white/20 px-3 py-1 hover:bg-white/10">👍 {p.likes}</button>
              <button className="rounded border border-white/20 px-3 py-1 hover:bg-white/10">💬 {p.comments}</button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

// ---------- PAGE ----------
export default function HomePage() {
  // rien d’async ici pour éviter les warnings de deps
  const promoted = promotedMock
  const posts = postsMock
  const artists = topArtistsMock
  const providers = topProvidersMock
  const offers = offersMock

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 text-white">
      {/* CAROUSEL */}
      <section className="mb-8">
        <PromotedCarousel items={promoted} />
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* FEED gauche (2 colonnes) */}
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-xl font-bold">Publications</h2>
          <Feed posts={posts} />
        </section>

        {/* DROITE : classements puis annonces */}
        <aside className="space-y-8">
          <Rankings
            titleLeft="TOP ARTISTES"
            titleRight="TOP PRESTATAIRES"
            left={artists}
            right={providers}
          />
          <Offers offers={offers} />
        </aside>
      </div>
    </main>
  )
}