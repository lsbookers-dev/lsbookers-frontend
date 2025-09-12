'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
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

type RoleTag = { label: string }
type Publication = { id: number; title: string; image: string; caption?: string; time?: string; createdAt?: string }
type Review = { id: number; author: string; authorAvatar: string; rating: number; text: string }
type PriceLine = { id: number; label: string; price: string }

// ---- Types pour éviter les "any" ----
type StoredUser = {
  id: number | string
  name?: string
  email?: string
  role?: string
  profile?: { id: number }
}

type ApiUser = {
  id: number
  name: string
  email?: string
  role?: string
}

type ApiProfile = {
  id: number
  userId: number
  bio?: string | null
  profession?: string | null
  location?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  radiusKm?: number | null
  specialties?: string[] | null
  typeEtablissement?: string | null
  avatar?: string | null
  banner?: string | null
  user?: ApiUser
}

/* ================= Helpers ================= */
async function uploadToCloudinary(
  file: File,
  folder: 'avatars' | 'banners' | 'media',
  type: 'image' | 'video' | 'auto' = 'auto'
) {
  const API = process.env.NEXT_PUBLIC_API_URL
  if (!API) throw new Error('NEXT_PUBLIC_API_URL manquant dans le frontend')
  const base = API.replace(/\/$/, '')

  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', folder)
  fd.append('type', type)

  const res = await fetch(`${base}/api/upload`, { method: 'POST', body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { details?: string })?.details || 'UPLOAD_FAILED')
  }
  return res.json() as Promise<{ url: string; public_id: string }>
}

/* ============================================================ */

export default function ArtistProfilePage() {
  const router = useRouter()
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

  // --------- mock artiste (visuel uniquement) ----------
  const artist = useMemo(
    () => ({
      id: 1,
      banner: '/banners/artist_banner.jpg',
      avatar: '/avatars/a1.png',
      name: 'Test Artist',
      location: 'Marseille',
      country: 'France',
      roles: [{ label: 'DJ' }, { label: 'Saxophoniste' }] as RoleTag[],
      description:
        "L’artiste écris ici sa description, en expliquant sa carrière, son parcours etc...",
      soundcloudEmbedUrl:
        'https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/martingarrix&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true',
      showSoundcloud: true,
    }),
    []
  )

  /* ===== Auth + Profile ID réels (pour persister) ===== */
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [profileId, setProfileId] = useState<number | null>(null)

  // Nouveaux états pour afficher les vraies infos
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null)
  const [profile, setProfile] = useState<ApiProfile | null>(null)

  // 1) Lire token / user dans le localStorage
  useEffect(() => {
    try {
      const t = localStorage.getItem('token')
      const uStr = localStorage.getItem('user')
      if (t) setToken(t)
      if (uStr) {
        const u: StoredUser = JSON.parse(uStr)
        setCurrentUser(u) // <= pour afficher le vrai nom
        const uid = typeof u?.id === 'string' ? parseInt(u.id, 10) : u?.id
        setUserId(uid || null)
        if (u?.profile?.id) setProfileId(u.profile.id)
      }
    } catch {
      // ignore
    }
  }, [])

  // états visuels pour banner/avatar (MAJ immédiate après upload)
  const [bannerUrl, setBannerUrl] = useState<string>(artist.banner)
  const [avatarUrl, setAvatarUrl] = useState<string>(artist.avatar)
  const bannerInputRef = useRef<HTMLInputElement | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const [roles, setRoles] = useState<RoleTag[]>(artist.roles)
  const allRoleOptions = useMemo(
    () => ['DJ', 'Chanteur', 'Saxophoniste', 'Danseur', 'Guitariste', 'Violoniste', 'Photographe'],
    []
  )
  const [rolePickerOpen, setRolePickerOpen] = useState(false)

  // ====== PUBLICATIONS (réelles) ======
  const [publications, setPublications] = useState<Publication[]>([])
  const [showAllPubs, setShowAllPubs] = useState(false)
  const pubFileRef = useRef<HTMLInputElement | null>(null)
  const [newPubTitle, setNewPubTitle] = useState('')

  // Charger publications réelles
  useEffect(() => {
    const run = async () => {
      if (!API_BASE || !userId) return
      try {
        const r = await fetch(`${API_BASE}/api/media/user/${userId}`, { cache: 'no-store' })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = await r.json()
        const pubs: Publication[] = Array.isArray(data?.publications) ? data.publications : []
        setPublications(pubs)
      } catch (e) {
        console.error('Erreur chargement publications:', e)
      }
    }
    run()
  }, [API_BASE, userId])

  // Ajout d’une publication : file -> /api/upload -> POST /api/media
  const onPickPublication = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.currentTarget.value = ''
    if (!file) return
    if (!token) return alert('Connecte-toi pour publier.')
    if (!newPubTitle.trim()) return alert('Indique un titre pour la publication.')

    try {
      const { url } = await uploadToCloudinary(file, 'media', 'image')
      const res = await fetch(`${API_BASE}/api/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newPubTitle.trim(), url }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const created: Publication | undefined = data?.publication
      if (created) {
        setPublications((prev) => [created, ...prev])
        setNewPubTitle('')
        alert('Publication ajoutée ✅')
      }
    } catch (err) {
      console.error(err)
      alert('Échec de la publication.')
    }
  }

  const askAddPublication = () => {
    const title = window.prompt('Titre de la publication ?')
    if (!title) return
    setNewPubTitle(title)
    pubFileRef.current?.click()
  }

  // ====== Reviews / Styles / Prices (mock locaux inchangés) ======
  const [reviews] = useState<Review[]>([
    { id: 1, author: 'Studio 88', authorAvatar: '/avatars/pro1.png', rating: 5, text: 'Merci pour cette prestation, ravis — je recommande !' },
    { id: 2, author: 'Wedding Planning', authorAvatar: '/avatars/pro2.png', rating: 4, text: 'Très bonne prestation et très professionnel.' },
  ])

  const [styles, setStyles] = useState<string[]>(['R&B', 'Latino', 'Rap US', 'Rap FR', 'Deep/House', 'Electro'])
  const [newStyle, setNewStyle] = useState('')

  const [prices, setPrices] = useState<PriceLine[]>([
    { id: 1, label: 'Mix de 2h · Région PACA', price: 'À partir de 400€' },
    { id: 2, label: 'Mix de 4h · Région PACA', price: 'À partir de 700€' },
  ])
  const [newPriceLabel, setNewPriceLabel] = useState('')
  const [newPriceValue, setNewPriceValue] = useState('')

  // Description éditable (pas encore persistée)
  const [description, setDescription] = useState(artist.description)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState(description)

  /* ===== Charger les données du profil pour hydrater TOUT (avatar/banner/nom/lieu) ===== */
  useEffect(() => {
    const loadProfile = async () => {
      if (!API_BASE || !userId) return
      try {
        const r = await fetch(`${API_BASE}/api/profile/user/${userId}`)
        if (!r.ok) return
        const data = (await r.json()) as { profile?: ApiProfile }
        const p = data?.profile
        if (p) {
          setProfile(p) // <= pour location/country/etc.
          if (p.banner) setBannerUrl(p.banner)
          if (p.avatar) setAvatarUrl(p.avatar)
          if (!profileId && p.id) setProfileId(p.id)

          // ✅ Hydrater les spécialités depuis l'API (si présentes)
          if (p.specialties && Array.isArray(p.specialties) && p.specialties.length > 0) {
            setRoles(p.specialties.map((s) => ({ label: s })))
          }
        }
      } catch {
        // ignore
      }
    }
    loadProfile()
  }, [API_BASE, userId, profileId])

  /* ========================= Actions ========================= */

  // ✅ Persistance profil (avec token + vrai profileId)
  const saveProfile = async (fields: Record<string, unknown>) => {
    if (!API_BASE) throw new Error('NEXT_PUBLIC_API_URL manquant')
    if (!token) throw new Error('TOKEN_ABSENT')
    if (!profileId) throw new Error('PROFILE_ID_ABSENT')

    const res = await fetch(`${API_BASE}/api/profile/${profileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fields),
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(err?.error || 'PROFILE_SAVE_FAILED')
    }
  }

  // ✅ Toggle spécialités + sauvegarde immédiate (rollback si échec)
  const toggleRole = async (label: string) => {
    const next = roles.some(r => r.label === label)
      ? roles.filter(r => r.label !== label)
      : [...roles, { label }]

    // UI optimiste
    const previous = roles
    setRoles(next)

    try {
      await saveProfile({ specialties: next.map(r => r.label) })
    } catch (err) {
      console.error('Erreur de sauvegarde des spécialités:', err)
      setRoles(previous) // rollback
      alert("Impossible d'enregistrer les spécialités (vérifie que tu es connecté).")
    }
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

  // Ouvrir une nouvelle conversation avec l'artiste
  const contact = () => router.push(`/messages/new?to=${userId ?? artist.id}`)
  const follow = () => alert('Vous suivez maintenant cet artiste ✅')

  /* =========================== UI =========================== */

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ===== Bannière ===== */}
      <div className="relative h-56 sm:h-64 md:h-72 lg:h-80">
        <Image src={bannerUrl} alt="Bannière" fill priority className="object-cover opacity-90" />
        <button
          onClick={() => router.push('/settings/profile')}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl flex items-center gap-2 backdrop-blur"
        >
          <Settings2 size={18} />
          Réglages
        </button>

        {/* Changer la bannière */}
        <button
          onClick={() => bannerInputRef.current?.click()}
          className="absolute bottom-3 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-sm"
          disabled={bannerUploading}
          title={!token || !profileId ? 'Connecte-toi pour sauvegarder' : 'Changer la bannière'}
        >
          {bannerUploading ? 'Envoi…' : 'Changer la bannière'}
        </button>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onSelectBanner}
        />
      </div>

      {/* ===== Bloc infos sous la bannière ===== */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-full overflow-hidden ring-4 ring-black">
            <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-1 right-1 bg-black/60 hover:bg-black/80 text-xs px-2 py-0.5 rounded"
              disabled={avatarUploading}
              title={!token || !profileId ? 'Connecte-toi pour sauvegarder' : 'Changer la photo'}
            >
              {avatarUploading ? '...' : '✎'}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onSelectAvatar}
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {currentUser?.name ?? profile?.user?.name ?? artist.name}
            </h1>
            <p className="text-sm text-neutral-300">
              {(profile?.location ?? artist.location)}, {profile?.country ?? artist.country}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {roles.map(r => (
                <span key={r.label} className="text-xs px-2 py-1 rounded-full bg-pink-600/20 border border-pink-600/40">
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

        <div className="flex items-center gap-3">
          <button
            onClick={contact}
            className="bg-white text-black rounded-full px-5 py-2 flex items-center gap-2 hover:bg-neutral-200"
          >
            <MessageCircle size={18} /> Contacter
          </button>
          <button
            onClick={follow}
            className="bg-pink-600 rounded-full px-5 py-2 flex items-center gap-2 hover:bg-pink-500"
          >
            <UserPlus size={18} /> Suivre
          </button>
        </div>
      </div>

      {/* ===== Corps ===== */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 pb-12">
        {/* Colonne gauche */}
        <div className="space-y-6">
          {/* Publications (réelles) */}
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
                  onClick={askAddPublication}
                  className="text-sm px-3 py-1 rounded-full bg-pink-600 hover:bg-pink-500 flex items-center gap-1"
                >
                  <Plus size={16} /> Ajouter
                </button>
                <input
                  ref={pubFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickPublication}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {publications[0] && (
                <div className="md:col-span-2 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                  <div className="relative w-full h-64">
                    <Image src={publications[0].image} alt={publications[0].title} fill className="object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="font-medium">{publications[0].title}</p>
                    {publications[0].caption && <p className="text-sm text-neutral-300 mt-1">{publications[0].caption}</p>}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                {publications.slice(1, 4).map(p => (
                  <div key={p.id} className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                    <div className="relative w-full h-28">
                      <Image src={p.image} alt={p.title} fill className="object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Description (éditable, non persistée pour l’instant) */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Description</h2>
              {!editingDesc ? (
                <button
                  onClick={() => {
                    setDescDraft(description)
                    setEditingDesc(true)
                  }}
                  className="text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20"
                >
                  Modifier
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setDescription(descDraft)
                      setEditingDesc(false)
                    }}
                    className="text-sm px-3 py-1 rounded-full bg-pink-600 hover:bg-pink-500"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingDesc(false)}
                    className="text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>

            {!editingDesc ? (
              <p className="text-neutral-200 mt-3 leading-relaxed">{description}</p>
            ) : (
              <textarea
                className="mt-3 w-full rounded-lg bg-black/30 border border-white/10 p-3 text-sm"
                rows={5}
                value={descDraft}
                onChange={e => setDescDraft(e.target.value)}
              />
            )}
          </section>

          {/* Agenda (placeholder) */}
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

        {/* Colonne droite (ordre demandé) */}
        <aside className="space-y-6">
          {/* 1) SoundCloud (optionnel) */}
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

          {/* 2) Styles */}
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

          {/* 3) Avis */}
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
                      <Image src={r.authorAvatar} alt={r.author} fill className="object-cover" />
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

          {/* 4) Tarifs (tout en bas) */}
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
                placeholder="Intitulé"
                value={newPriceLabel}
                onChange={e => setNewPriceLabel(e.target.value)}
              />
              <input
                className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Tarif"
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
        </aside>
      </div>

      {/* ===== Modal "Voir tout" publications ===== */}
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
                    <Image src={p.image} alt={p.title} fill className="object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium">{p.title}</p>
                    {p.caption && <p className="text-xs text-neutral-400 mt-1">{p.caption}</p>}
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