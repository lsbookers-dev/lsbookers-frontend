'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Settings2,
  ChevronDown,
  Plus,
  MessageCircle,
  UserPlus,
  Star,
} from 'lucide-react'

/* ============================= Types ============================= */

type RoleTag = { label: string }
type Publication = { id: number; title: string; image: string; caption?: string; time?: string }
type Review = { id: number; author: string; authorAvatar: string; rating: number; text: string }
type PriceLine = { id: number; label: string; price: string }

/* ============================= Page ============================= */

export default function ArtistProfilePage() {
  const router = useRouter()

  /* ---------- Mock data (remplaçable par l’API ensuite) ---------- */
  const artist = useMemo(
    () => ({
      id: 1,
      banner: '/banners/artist_banner.jpg',       // public/banners/artist_banner.jpg
      avatar: '/avatars/a1.png',                   // public/avatars/a1.png
      name: 'Test Artist',
      location: 'Marseille',
      country: 'France',
      roles: [{ label: 'DJ' }, { label: 'Saxophoniste' }] as RoleTag[],
      description:
        "L’artiste écris ici sa description, en expliquant sa carrière, son parcours etc...",
      soundcloudEmbedUrl:
        'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/209262932&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true',
      showSoundcloud: true,
    }),
    []
  )

  const [roles, setRoles] = useState<RoleTag[]>(artist.roles)
  const allRoleOptions = useMemo(
    () => ['DJ', 'Chanteur', 'Saxophoniste', 'Danseur', 'Guitariste', 'Violoniste', 'Photographe'],
    []
  )
  const [rolePickerOpen, setRolePickerOpen] = useState(false)

  const [publications, setPublications] = useState<Publication[]>([
    { id: 1, title: 'Live au Studio 88', image: '/media/pub1.jpg', caption: 'Mix hier soir à Marseille 🎧🔥', time: 'Il y a 6h' },
    { id: 2, title: 'Merci Marseille !', image: '/media/pub2.jpg' },
    { id: 3, title: 'Backstage 🎧', image: '/media/pub3.jpg' },
    { id: 4, title: 'Répètes', image: '/media/pub4.jpg' },
  ])
  const [showAllPubs, setShowAllPubs] = useState(false)

  // ✅ plus de setReviews non utilisé
  const reviews = useMemo<Review[]>(
    () => [
      { id: 1, author: 'Studio 88',        authorAvatar: '/avatars/pro1.png', rating: 5, text: 'Merci pour cette prestation, ravis — je recommande !' },
      { id: 2, author: 'Wedding Planning', authorAvatar: '/avatars/pro2.png', rating: 4, text: 'Très bonne prestation et très professionnel.' },
    ],
    []
  )

  const [styles, setStyles] = useState<string[]>(['R&B', 'Latino', 'Rap US', 'Rap FR', 'Deep/House', 'Electro'])
  const [newStyle, setNewStyle] = useState('')

  const [prices, setPrices] = useState<PriceLine[]>([
    { id: 1, label: 'Mix de 2h · Région PACA', price: 'À partir de 400€' },
    { id: 2, label: 'Mix de 4h · Région PACA', price: 'À partir de 700€' },
  ])
  const [newPriceLabel, setNewPriceLabel] = useState('')
  const [newPriceValue, setNewPriceValue] = useState('')

  /* ============================= Actions ============================= */

  const toggleRole = (label: string) => {
    setRoles(prev =>
      prev.some(r => r.label === label)
        ? prev.filter(r => r.label !== label)
        : [...prev, { label }]
    )
  }

  const addPublication = () => {
    const title = window.prompt("Titre de la publication ?")
    if (!title) return
    const image = window.prompt("URL de l'image (ex: /media/pub5.jpg) ?") || '/media/pub_placeholder.jpg'
    setPublications(prev => [{ id: Date.now(), title, image }, ...prev])
  }

  const addStyle = () => {
    const s = newStyle.trim()
    if (!s || styles.includes(s)) return
    setStyles(prev => [...prev, s])
    setNewStyle('')
  }

  const removeStyle = (s: string) => setStyles(prev => prev.filter(x => x !== s))

  const addPrice = () => {
    const lbl = newPriceLabel.trim()
    const val = newPriceValue.trim()
    if (!lbl || !val) return
    setPrices(prev => [...prev, { id: Date.now(), label: lbl, price: val }])
    setNewPriceLabel('')
    setNewPriceValue('')
  }

  const removePrice = (id: number) => setPrices(prev => prev.filter(p => p.id !== id))

  const contact = () => router.push('/messages')
  const follow = () => alert('Vous suivez maintenant cet artiste ✅')

  /* ============================= UI ============================= */

  const heroPub = publications[0]
  const restPubs = publications.slice(1, 7)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ====== Bannière ====== */}
      <div className="relative h-56 sm:h-64 md:h-72 lg:h-80">
        <Image
          src={artist.banner}
          alt="Bannière"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-90"
        />
        <button
          onClick={() => router.push('/settings/profile')}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl flex items-center gap-2 backdrop-blur"
        >
          <Settings2 size={18} />
          Réglages
        </button>
      </div>

      {/* ====== En-tête (sous la bannière) ====== */}
      <div className="max-w-6xl mx-auto px-4 -mt-10 pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 rounded-full overflow-hidden ring-4 ring-black">
              <Image src={artist.avatar} alt="Avatar" fill sizes="80px" className="object-cover" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{artist.name}</h1>
              <p className="text-sm text-neutral-300">
                {artist.location}, {artist.country}
              </p>
              {/* Rôles (tags) */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {roles.map(r => (
                  <span
                    key={r.label}
                    className="text-xs px-2 py-1 rounded-full bg-pink-600/20 border border-pink-600/40"
                  >
                    {r.label}
                  </span>
                ))}
                <div className="relative">
                  <button
                    onClick={() => setRolePickerOpen(v => !v)}
                    className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/20 flex items-center gap-1"
                  >
                    Gérer
                    <ChevronDown size={14} />
                  </button>
                  {rolePickerOpen && (
                    <div className="absolute z-20 mt-2 w-48 rounded-xl bg-neutral-900 border border-white/10 p-2">
                      {allRoleOptions.map(opt => {
                        const active = roles.some(r => r.label === opt)
                        return (
                          <button
                            key={opt}
                            onClick={() => toggleRole(opt)}
                            className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-white/10 ${
                              active ? 'text-pink-400' : 'text-white'
                            }`}
                          >
                            {active ? '— ' : '+ '} {opt}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 sm:ml-auto">
            <button
              onClick={contact}
              className="bg-white text-black rounded-full px-5 py-2 flex items-center gap-2 hover:bg-neutral-200"
            >
              <MessageCircle size={18} />
              Contacter
            </button>
            <button
              onClick={follow}
              className="bg-pink-600 rounded-full px-5 py-2 flex items-center gap-2 hover:bg-pink-500"
            >
              <UserPlus size={18} />
              Suivre
            </button>
          </div>
        </div>
      </div>

      {/* ====== Corps ====== */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 pb-12">
        {/* ====== Colonne principale ====== */}
        <div className="space-y-6">
          {/* Publications */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Publications</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAllPubs(true)}
                  className="text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20"
                >
                  Voir tout
                </button>
                <button
                  onClick={addPublication}
                  className="text-sm px-3 py-1 rounded-full bg-pink-600 hover:bg-pink-500 flex items-center gap-1"
                >
                  <Plus size={16} />
                  Ajouter
                </button>
              </div>
            </div>

            {/* Hero + grid */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {heroPub && (
                <div className="md:col-span-2 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                  <div className="relative w-full h-64">
                    <Image
                      src={heroPub.image}
                      alt={heroPub.title}
                      fill
                      sizes="(min-width: 768px) 66vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-medium">{heroPub.title}</p>
                    {heroPub.caption && (
                      <p className="text-sm text-neutral-300 mt-1">{heroPub.caption}</p>
                    )}
                    {heroPub.time && (
                      <p className="text-xs text-neutral-400 mt-1">{heroPub.time}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                {restPubs.map(p => (
                  <div
                    key={p.id}
                    className="rounded-xl overflow-hidden border border-white/10 bg-black/30"
                  >
                    <div className="relative w-full h-28">
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        sizes="(min-width: 768px) 33vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Description</h2>
              <button className="text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20">
                Modifier
              </button>
            </div>
            <p className="text-neutral-200 mt-3 leading-relaxed">{artist.description}</p>
          </section>

          {/* Agenda (placeholder pour l’instant) */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <h2 className="text-lg font-semibold">Mon agenda</h2>
            <p className="text-neutral-300 mt-2">
              (On détaillera ici la gestion avancée des disponibilités et bookings.)
            </p>
            <div className="mt-3 h-48 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center">
              <span className="text-neutral-500 text-sm">Calendrier à venir</span>
            </div>
          </section>
        </div>

        {/* ====== Colonne droite ====== */}
        <aside className="space-y-6">
          {/* SoundCloud (optionnel) */}
          {artist.showSoundcloud && (
            <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-3">
              <div className="rounded-lg overflow-hidden">
                <iframe
                  title="Soundcloud"
                  width="100%"
                  height="180"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  src={artist.soundcloudEmbedUrl}
                />
              </div>
            </section>
          )}

          {/* --- Tarifs (inversé avec styles) --- */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tarifs</h2>
            </div>

            <ul className="mt-3 space-y-2">
              {prices.map(p => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-xs text-neutral-300">{p.price}</p>
                  </div>
                  <button
                    onClick={() => removePrice(p.id)}
                    className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-3 grid grid-cols-1 gap-2">
              <input
                className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Intitulé (ex: Mix 2h · PACA)"
                value={newPriceLabel}
                onChange={e => setNewPriceLabel(e.target.value)}
              />
              <input
                className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Tarif (ex: À partir de 400€)"
                value={newPriceValue}
                onChange={e => setNewPriceValue(e.target.value)}
              />
              <button
                onClick={addPrice}
                className="text-sm px-3 py-2 rounded-lg bg-pink-600 hover:bg-pink-500"
              >
                Ajouter un tarif
              </button>
            </div>
          </section>

          {/* --- Styles (inversé) --- */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <h2 className="text-lg font-semibold">Styles</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {styles.map(s => (
                <button
                  key={s}
                  onClick={() => removeStyle(s)}
                  className="text-xs px-2 py-1 rounded-full bg-white/10 hover:bg-white/20"
                  title="Supprimer"
                >
                  {s} ✕
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Ajouter un style"
                value={newStyle}
                onChange={e => setNewStyle(e.target.value)}
              />
              <button
                onClick={addStyle}
                className="text-sm px-3 py-2 rounded-lg bg-pink-600 hover:bg-pink-500"
              >
                Ajouter
              </button>
            </div>
          </section>

          {/* Avis */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Avis</h2>
              <button
                onClick={() => alert('Ouverture de la liste complète des avis')}
                className="text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20"
              >
                Voir tout
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 rounded-full overflow-hidden">
                      <Image src={r.authorAvatar} alt={r.author} fill sizes="36px" className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{r.author}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-600'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-200 mt-2 leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* ====== Modal "Voir tout" publications ====== */}
      {showAllPubs && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAllPubs(false)}
        >
          <div
            className="max-w-5xl w-full bg-neutral-950 border border-white/10 rounded-2xl p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Toutes les publications</h3>
              <button
                onClick={() => setShowAllPubs(false)}
                className="text-sm px-3 py-1 rounded bg-white/10 hover:bg-white/20"
              >
                Fermer
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {publications.map(p => (
                <div key={p.id} className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                  <div className="relative w-full h-40">
                    <Image src={p.image} alt={p.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium">{p.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}