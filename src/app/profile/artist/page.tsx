'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ChevronDown, Settings2, Plus, MessageCircle, UserPlus, X } from 'lucide-react'

// ---------- Types ----------
type RoleTag = { label: string }
type Publication = { id: number; image: string; caption?: string }
type Review = { id: number; author: string; text: string }
type PriceLine = { label: string; price: string }
type SocialLink = { label: string; href: string }

// ---------- Page ----------
export default function ArtistProfilePage() {
  const router = useRouter()

  // ----- Mock data (remplaçable par l’API ensuite) -----
  const artist = useMemo(
    () => ({
      id: 1,
      banner: '/banners/artist_banner.jpg',     // place l’image ici: public/banners/artist_banner.jpg
      avatar: '/avatars/a1.png',                // public/avatars/a1.png
      name: 'Test Artist',
      location: 'Marseille',
      country: 'France',
      roles: [{ label: 'DJ' }, { label: 'Saxophoniste' }] as RoleTag[],
      description:
        "L’artiste écrit ici sa description, en expliquant sa carrière, son parcours etc...",
      soundcloudEmbedUrl:
        'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/209262931&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&visual=true',
      showSoundcloud: true, // optionnel, contrôlé plus tard via réglages
    }),
    []
  )

  const publications = useMemo<Publication[]>(
    () => [
      { id: 1, image: '/media/pub1.jpg', caption: 'Live au Studio 88' }, // public/media/pub1.jpg
      { id: 2, image: '/media/pub2.jpg', caption: 'Merci Marseille !' },
      { id: 3, image: '/media/pub3.jpg', caption: 'Backstage 🎧' },
      { id: 4, image: '/media/pub4.jpg', caption: 'Summer vibes' },
      { id: 5, image: '/media/pub5.jpg', caption: 'Night session' },
    ],
    []
  )

  const reviews = useMemo<Review[]>(
    () => [
      { id: 1, author: 'Studio 88', text: 'Très bonne prestation et très professionnel.' },
      { id: 2, author: 'Studio 88', text: 'Merci pour cette prestation, ravis, je recommande !' },
    ],
    []
  )

  const prices = useMemo<PriceLine[]>(
    () => [
      { label: 'Mix de 2h · Région PACA', price: 'à partir de 400 €' },
      { label: 'Mix de 4h · Région PACA', price: 'à partir de 700 €' },
    ],
    []
  )

  const social: SocialLink[] = [
    { label: 'Instagram', href: '#' },
    { label: 'Facebook', href: '#' },
    { label: 'TikTok', href: '#' },
    { label: 'Site web', href: '#' },
  ]

  const styleTags = ['R&B', 'Latino', 'Rap US', 'Rap FR', 'Deep/House', 'Electro']

  // ----- UI state -----
  const [rolesOpen, setRolesOpen] = useState(false)
  const [showAllPubs, setShowAllPubs] = useState(false)

  // ----- Actions (stub) -----
  const onContact = () => router.push(`/messages/new?to=${artist.id}`)
  const onFollow = () => alert('Follow enregistré (à brancher)')
  const onOpenSettings = () => router.push('/settings/profile') // route à créer
  const onAddPublication = () => alert('Ajouter une publication (à brancher)')

  // ----- Layout -----
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Banner */}
      <section className="relative w-full h-64 md:h-80 lg:h-96">
        <Image
          src={artist.banner}
          alt="Bannière"
          fill
          className="object-cover opacity-90"
          priority
        />

        {/* Bouton réglages */}
        <button
          onClick={onOpenSettings}
          className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur hover:bg-white/20 transition"
        >
          <Settings2 size={18} />
          <span className="text-sm font-medium">Réglages</span>
        </button>

        {/* Avatar + header infos (chevauche la bannière) */}
        <div className="absolute -bottom-10 left-4 right-4 md:left-8 md:right-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-full overflow-hidden ring-4 ring-black/60">
              <Image src={artist.avatar} alt="Avatar" fill className="object-cover" />
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 md:gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{artist.name}</h1>
                <p className="text-sm text-white/70">
                  {artist.location}, {artist.country}
                </p>
                {/* Rôles + menu */}
                <div className="mt-2 relative inline-block">
                  <button
                    onClick={() => setRolesOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20 transition"
                  >
                    {artist.roles.map((r) => r.label).join(' - ')}
                    <ChevronDown size={16} />
                  </button>
                  {rolesOpen && (
                    <div
                      className="absolute z-20 mt-2 w-56 rounded-lg border border-white/10 bg-neutral-900 p-2 shadow-xl"
                      onMouseLeave={() => setRolesOpen(false)}
                    >
                      <p className="px-2 py-1 text-xs text-white/60">
                        Ajouter / supprimer (stub)
                      </p>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        {['DJ', 'Saxophoniste', 'Chanteur', 'Danseur', 'Guitariste'].map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white/10 px-2 py-1 text-xs text-center"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 md:justify-end">
                <button
                  onClick={onContact}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90 transition"
                >
                  <MessageCircle size={16} />
                  Contacter
                </button>
                <button
                  onClick={onFollow}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition"
                >
                  <UserPlus size={16} />
                  Suivre
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer sous la bannière (pour l’avatar chevauchant) */}
      <div className="h-14 md:h-16" />

      {/* Corps */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche : Publications + Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Publications */}
            <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Publications</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAllPubs(true)}
                    className="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20 transition"
                    aria-label="Voir toutes les publications"
                  >
                    Voir tout
                  </button>
                  <button
                    onClick={onAddPublication}
                    className="inline-flex items-center gap-2 rounded-full bg-white text-black px-3 py-1 text-sm font-semibold hover:bg-white/90 transition"
                  >
                    <Plus size={16} /> Ajouter
                  </button>
                </div>
              </div>

              {/* Aperçu (max 3) */}
              <div className="grid grid-cols-3 gap-3">
                {publications.slice(0, 3).map((p) => (
                  <figure key={p.id} className="relative h-40 w-full overflow-hidden rounded-xl">
                    <Image src={p.image} alt={p.caption || 'publication'} fill className="object-cover" />
                  </figure>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Description</h2>
                <button className="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20 transition">
                  Modifier
                </button>
              </div>
              <p className="whitespace-pre-wrap text-white/85">{artist.description}</p>
            </div>
          </div>

          {/* Colonne droite : SoundCloud (optionnel) + Avis + Tarifs + Réseaux + Styles */}
          <div className="space-y-6">
            {/* SoundCloud (optionnel) */}
            {artist.showSoundcloud && (
              <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-2">
                <iframe
                  title="SoundCloud"
                  width="100%"
                  height="240"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  src={artist.soundcloudEmbedUrl}
                  className="rounded-xl"
                />
              </div>
            )}

            {/* Avis */}
            <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
              <h2 className="mb-3 text-lg font-semibold">Avis</h2>
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-xl bg-white/5 p-3">
                    <p className="text-sm font-semibold">{r.author}</p>
                    <p className="text-sm text-white/85">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tarifs */}
            <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
              <h2 className="mb-3 text-lg font-semibold">Tarifs</h2>
              <ul className="space-y-2">
                {prices.map((l, idx) => (
                  <li key={idx} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-sm">{l.label}</span>
                    <span className="text-sm font-semibold">{l.price}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Réseaux sociaux */}
            <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
              <h2 className="mb-3 text-lg font-semibold">Réseaux sociaux</h2>
              <ul className="flex flex-wrap gap-2">
                {social.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      className="inline-block rounded-full bg-white text-black px-3 py-1 text-sm font-semibold hover:bg-white/90 transition"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Styles */}
            <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
              <h2 className="mb-3 text-lg font-semibold">Styles</h2>
              <div className="flex flex-wrap gap-2">
                {styleTags.map((t) => (
                  <span key={t} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Agenda (placeholder propre → on branchera FullCalendar ensuite) */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mon Agenda</h2>
            <button className="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20 transition">
              Gérer
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg border border-white/10 bg-white/5 p-2 text-xs">
                <p className="text-white/60">JJ/MM</p>
                <p className="mt-2 truncate">—</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-white/60">
            (Agenda interactif à venir — intégration FullCalendar une fois le backend prêt)
          </p>
        </div>
      </section>

      {/* Modale “voir toutes les publications” */}
      {showAllPubs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="relative max-h-[85vh] w-full max-w-5xl overflow-auto rounded-2xl border border-white/10 bg-neutral-950 p-4">
            <button
              onClick={() => setShowAllPubs(false)}
              className="absolute right-3 top-3 rounded-full bg-white/10 p-2 hover:bg-white/20 transition"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
            <h3 className="mb-4 text-lg font-semibold">Toutes les publications</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {publications.map((p) => (
                <figure key={p.id} className="relative aspect-square overflow-hidden rounded-xl">
                  <Image src={p.image} alt={p.caption || 'publication'} fill className="object-cover" />
                </figure>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}