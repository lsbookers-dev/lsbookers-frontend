'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

/* -------------------------------------------------------
   Types
------------------------------------------------------- */
type Featured = {
  id: number
  name: string
  city: string
  country: string
  image: string // chemin public/
}

type Post = {
  id: number
  author: { name: string; avatar: string; roleLabel: string }
  image: string
  caption: string
  likes: number
  time: string
}

type RankedItem = {
  id: number
  name: string
  role: string
  city: string
  avatar: string
}

type AdCard = {
  id: number
  organizer: { name: string; city: string; avatar: string }
  venue: string
  city: string
  eventName: string
  date: string
  lookingFor: string
}

/* -------------------------------------------------------
   Données de test (à remplacer par l’API plus tard)
   ➜ Mets tes images dans /public/...
------------------------------------------------------- */
const featuredSeed: Featured[] = [
  { id: 1, name: 'Mike', city: 'Marseille', country: 'France', image: '/carousel/mike.jpg' },
  { id: 2, name: 'Manon', city: 'Marseille', country: 'France', image: '/carousel/manon.jpg' },
  { id: 3, name: 'Nicolas', city: 'Paris', country: 'France', image: '/carousel/nicolas.jpg' },
  { id: 4, name: 'Emilie', city: 'Lyon', country: 'France', image: '/carousel/emilie.jpg' },
]

const postsSeed: Post[] = [
  {
    id: 1,
    author: { name: 'Studio 88', avatar: '/avatars/org1.png', roleLabel: 'Club - Marseille' },
    image: '/media/mix1.jpg',
    caption: 'Mix hier soir à Marseille 🎧🔥',
    likes: 39,
    time: 'Il y a 6h',
  },
  {
    id: 2,
    author: { name: 'Mike', avatar: '/avatars/a1.png', roleLabel: 'DJ - Marseille' },
    image: '/media/mix2.jpg',
    caption: 'Quelle énergie !',
    likes: 21,
    time: 'Il y a 9h',
  },
]

const topArtistsSeed: RankedItem[] = [
  { id: 1, name: 'Mike Mike', role: 'DJ', city: 'Marseille', avatar: '/avatars/a1.png' },
  { id: 2, name: 'Emilie', role: 'Chanteuse', city: 'Lyon', avatar: '/avatars/a2.png' },
  { id: 3, name: 'Nicolas', role: 'DJ', city: 'Marseille', avatar: '/avatars/a3.png' },
  { id: 4, name: 'Coralie', role: 'Danseuse', city: 'Lille', avatar: '/avatars/a4.png' },
  { id: 5, name: 'Lena', role: 'Chanteuse', city: 'Paris', avatar: '/avatars/a5.png' },
]

const topVendorsSeed: RankedItem[] = [
  { id: 1, name: 'Le Buffet', role: 'Traiteur', city: 'Aubagne', avatar: '/avatars/p1.png' },
  { id: 2, name: 'La Sicile Authentique', role: 'Traiteur', city: 'Marseille', avatar: '/avatars/p2.png' },
  { id: 3, name: 'Photobooth Pro', role: 'Photobooth', city: 'Avignon', avatar: '/avatars/p3.png' },
  { id: 4, name: 'Wedding Planing', role: 'Wedding Planner', city: 'Toulon', avatar: '/avatars/p4.png' },
  { id: 5, name: 'Décoratrice Marie', role: 'Décoratrice', city: 'Marseille', avatar: '/avatars/p5.png' },
]

const adsSeed: AdCard[] = [
  {
    id: 1,
    organizer: { name: 'Studio 88', city: 'Marseille', avatar: '/avatars/org1.png' },
    venue: 'Studio 88',
    city: 'Marseille',
    eventName: 'Soirée R&B',
    date: '25/10/2025',
    lookingFor: 'DJ',
  },
  {
    id: 2,
    organizer: { name: 'Concert', city: 'Marseille', avatar: '/avatars/org2.png' },
    venue: 'Concert',
    city: 'Marseille',
    eventName: 'Fête de la Musique',
    date: '21/06/2025',
    lookingFor: 'Chanteur',
  },
  {
    id: 3,
    organizer: { name: 'Rooftop', city: 'La Ciotat', avatar: '/avatars/org3.png' },
    venue: 'Rooftop',
    city: 'La Ciotat',
    eventName: 'Soirée Disco',
    date: '25/08/2025',
    lookingFor: 'Danseur',
  },
  {
    id: 4,
    organizer: { name: 'Société', city: 'Avignon', avatar: '/avatars/org4.png' },
    venue: 'Société',
    city: 'Avignon',
    eventName: 'Séminaire',
    date: '25/11/2025',
    lookingFor: 'Traiteur',
  },
  {
    id: 5,
    organizer: { name: 'Chez Mario', city: 'Cassis', avatar: '/avatars/org5.png' },
    venue: 'Chez Mario',
    city: 'Cassis',
    eventName: 'Soirée Italienne',
    date: '08/10/2025',
    lookingFor: 'Chanteur',
  },
  {
    id: 6,
    organizer: { name: 'Wedding Planing', city: 'Aubagne', avatar: '/avatars/org6.png' },
    venue: 'Wedding Planing',
    city: 'Aubagne',
    eventName: 'Soirée R&B',
    date: '25/10/2025',
    lookingFor: 'DJ',
  },
]

/* -------------------------------------------------------
   Carrousel 2 par slide (auto + flèches)
------------------------------------------------------- */
function FeaturedCarousel({ items }: { items: Featured[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [index, setIndex] = useState(0)

  // On groupe par 2 éléments par "slide"
  const slides = useMemo(() => {
    const chunked: Featured[][] = []
    for (let i = 0; i < items.length; i += 2) {
      chunked.push(items.slice(i, i + 2))
    }
    return chunked
  }, [items])

  // Auto défilement
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(id)
  }, [slides.length])

  // Scroll vers la slide active
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const slideWidth = el.clientWidth
    el.scrollTo({ left: slideWidth * index, behavior: 'smooth' })
  }, [index])

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="flex overflow-x-hidden scroll-smooth snap-x snap-mandatory rounded-2xl border border-white/10"
      >
        {slides.map((pair, sIdx) => (
          <div key={sIdx} className="shrink-0 w-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4 snap-start">
            {pair.map((p) => (
              <div
                key={p.id}
                className="relative h-40 md:h-44 lg:h-48 xl:h-56 rounded-xl overflow-hidden bg-zinc-900"
              >
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-cover opacity-90"
                  priority={sIdx === 0}
                />
                {/* Overlay infos */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-white/80">{p.city}, {p.country}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Flèches */}
      <button
        aria-label="Précédent"
        onClick={() => setIndex((prev) => (prev - 1 + slides.length) % slides.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur px-2 py-2 rounded-full hover:bg-white/20"
      >
        ‹
      </button>
      <button
        aria-label="Suivant"
        onClick={() => setIndex((prev) => (prev + 1) % slides.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur px-2 py-2 rounded-full hover:bg-white/20"
      >
        ›
      </button>
    </div>
  )
}

/* -------------------------------------------------------
   Liste classement (Top 5) + lien Voir tout
------------------------------------------------------- */
function TopList({
  title,
  items,
  viewAllHref,
}: {
  title: string
  items: RankedItem[]
  viewAllHref: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-bold tracking-wide text-white">{title}</h3>
        <select className="bg-zinc-800 text-xs rounded px-2 py-1 border border-white/10">
          <option>France</option>
          <option>Région</option>
          <option>Ville</option>
        </select>
      </div>
      <ul className="px-2 pb-2">
        {items.slice(0, 5).map((it, idx) => (
          <li
            key={it.id}
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5"
          >
            <span className="w-6 text-center text-xs font-semibold text-pink-500">{idx + 1}</span>
            <Image src={it.avatar} alt={it.name} width={36} height={36} className="rounded-full" />
            <div className="flex-1">
              <p className="text-sm text-white">{it.name}</p>
              <p className="text-xs text-white/70">{it.role} - {it.city}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="px-4 pb-4">
        <Link
          href={viewAllHref}
          className="block w-full text-center text-xs font-medium bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg py-2"
        >
          Voir tout
        </Link>
      </div>
    </div>
  )
}

/* -------------------------------------------------------
   Carte Annonce (avec avatar organisateur)
------------------------------------------------------- */
function Ad({ ad }: { ad: AdCard }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
      <div className="flex items-center gap-3 mb-3">
        <Image src={ad.organizer.avatar} alt={ad.organizer.name} width={36} height={36} className="rounded-full" />
        <div>
          <p className="text-sm font-semibold text-white">{ad.venue}</p>
          <p className="text-xs text-white/70">{ad.city}</p>
        </div>
      </div>
      <div className="space-y-1 text-sm">
        <p><span className="text-white/70">Événement : </span>{ad.eventName || '—'}</p>
        <p><span className="text-white/70">Date : </span>{ad.date}</p>
        <p><span className="text-white/70">Recherche : </span>{ad.lookingFor}</p>
      </div>
      <button className="mt-4 w-full rounded-lg py-2 text-sm font-medium bg-pink-600 hover:bg-pink-500">
        Contacter
      </button>
    </div>
  )
}

/* -------------------------------------------------------
   Page
------------------------------------------------------- */
export default function HomePage() {
  // (Si tu as un thème global, cette page s’y adapte déjà)
  const [featured] = useState<Featured[]>(featuredSeed)
  const [posts] = useState<Post[]>(postsSeed)
  const [ads] = useState<AdCard[]>(adsSeed)

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 text-white">
      {/* Carrousel */}
      <section className="mb-8">
        <FeaturedCarousel items={featured} />
      </section>

      {/* Publications + Side classements */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne publications (prend la hauteur naturelle → plus de “trou”) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold">Publications</h2>

          {posts.map((p) => (
            <article key={p.id} className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
              <header className="flex items-center gap-3 mb-3">
                <Image src={p.author.avatar} alt={p.author.name} width={40} height={40} className="rounded-full" />
                <div>
                  <p className="text-sm font-semibold">{p.author.name}</p>
                  <p className="text-xs text-white/70">{p.author.roleLabel} • {p.time}</p>
                </div>
              </header>

              <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl">
                <Image src={p.image} alt={p.caption} fill className="object-cover" />
              </div>

              <footer className="mt-3 flex items-center gap-4 text-sm">
                <span>❤️ {p.likes}</span>
                <button className="hover:underline">💬 Commenter</button>
                <button className="hover:underline">📎 Partager</button>
              </footer>

              <p className="mt-2 text-sm">{p.caption}</p>
            </article>
          ))}
        </div>

        {/* Colonne classements (alignée en haut) */}
        <aside className="space-y-6 self-start">
          <TopList title="TOP ARTISTES" items={topArtistsSeed} viewAllHref="/classements/artistes" />
          <TopList title="TOP PRESTATAIRES" items={topVendorsSeed} viewAllHref="/classements/prestataires" />
        </aside>
      </section>

      {/* Annonces */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Annonces</h2>
          <Link
            href="/annonces"
            className="text-xs font-medium bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg px-3 py-2"
          >
            Voir tout
          </Link>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {ads.map((ad) => (
            <Ad key={ad.id} ad={ad} />
          ))}
        </div>
      </section>
    </main>
  )
}