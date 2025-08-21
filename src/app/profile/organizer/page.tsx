'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core'
import { Settings2, Plus, MapPin, Heart, MessageCircle } from 'lucide-react'

/* ================= Types ================= */
type StoredUser = {
  id: number | string
  name?: string
  role?: string
  profile?: { id: number }
}

type ApiUser = { id: number; name: string; role?: string }
type ApiProfile = {
  id: number
  userId: number
  avatar?: string | null
  banner?: string | null
  name?: string | null
  description?: string | null
  location?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  radiusKm?: number | null
  specialties?: string[] | null
  socials?: {
    instagram?: string
    facebook?: string
    tiktok?: string
    website?: string
    phone?: string
    email?: string
  } | null
  user?: ApiUser
}

/* ============== Helpers (upload + save) ============== */
async function uploadToCloudinary(
  file: File,
  folder: 'avatars' | 'banners' | 'media',
  type: 'image' | 'video' | 'auto' = 'auto'
) {
  const API = process.env.NEXT_PUBLIC_API_URL
  if (!API) throw new Error('NEXT_PUBLIC_API_URL manquant')
  const base = API.replace(/\/$/, '')

  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', folder)
  fd.append('type', type)

  const res = await fetch(`${base}/api/upload`, { method: 'POST', body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as { details?: string }))
    throw new Error(err?.details || 'UPLOAD_FAILED')
  }
  return res.json() as Promise<{ url: string; public_id: string }>
}

/* ============== Page ============== */
export default function OrganizerProfilePage() {
  const router = useRouter()
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

  // ——— session
  const [token, setToken] = useState<string | null>(null)
  const [userLite, setUserLite] = useState<StoredUser | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [profileId, setProfileId] = useState<number | null>(null)

  // ——— profil (données réelles si présentes)
  const [, setProfile] = useState<ApiProfile | null>(null)

  // ——— visuels (bannière / avatar)
  const [bannerUrl, setBannerUrl] = useState<string>('/banners/organizer_default.jpg')
  const [avatarUrl, setAvatarUrl] = useState<string>('/avatars/default_org.png')
  const bannerInputRef = useRef<HTMLInputElement | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // ——— identité & tags
  const [orgName, setOrgName] = useState<string>('Mon Établissement')
  const [specialties, setSpecialties] = useState<string[]>(['Club'])
  const allSpecialties = useMemo(
    () => ['Club', 'Bar', 'Rooftop', 'Soirée privée', 'Autre'],
    []
  )

  // ——— zone géographique (mini éditeur compact sous le pseudo)
  const [editingGeo, setEditingGeo] = useState<boolean>(false)
  const [location, setLocation] = useState<string>('')
  const [radiusKm, setRadiusKm] = useState<string>('')
  const [country, setCountry] = useState<string>('')
  const [lat, setLat] = useState<string>('') // string pour inputs
  const [lng, setLng] = useState<string>('')

  // ——— description
  const [description, setDescription] = useState<string>('')

  // ——— publications (comme artiste)
  type Publication = {
    id: number
    title: string
    image: string
    caption?: string
    likes?: number
    comments?: number
    createdAt?: string
  }
  const [publications, setPublications] = useState<Publication[]>([
    { id: 1, title: 'Nouvelle scène', image: '/media/pub1.jpg', caption: 'Setup prêt pour ce soir !', likes: 27, comments: 4 },
    { id: 2, title: 'Line-up weekend', image: '/media/pub2.jpg', likes: 19, comments: 2 },
    { id: 3, title: 'Aftermovie', image: '/media/pub5.jpg', likes: 42, comments: 9 },
    { id: 4, title: 'Rétro mapping', image: '/media/pub3.jpg', likes: 12, comments: 1 },
  ])
  const [showAllPubs, setShowAllPubs] = useState(false)

  // ——— offres d’emploi (annonces)
  type Job = { id: number; title: string; date: string; budget?: string; details?: string }
  const [jobs, setJobs] = useState<Job[]>([
    { id: 1, title: 'DJ vendredi 23h–3h', date: '2025-09-05', budget: '250€–350€', details: 'Style House/EDM' },
  ])
  const [newJob, setNewJob] = useState<Job>({ id: 0, title: '', date: '', budget: '', details: '' })

  // ——— planning (FullCalendar)
  const [events, setEvents] = useState<EventInput[]>([])

  // ——— socials / contacts (sous publications)
  const [socials, setSocials] = useState<ApiProfile['socials']>({
    instagram: '',
    facebook: '',
    tiktok: '',
    website: '',
    phone: '',
    email: '',
  })

  /* ====== Session & chargement profil ====== */
  useEffect(() => {
    try {
      const t = localStorage.getItem('token')
      const uStr = localStorage.getItem('user')
      if (t) setToken(t)
      if (uStr) {
        const u: StoredUser = JSON.parse(uStr)
        setUserLite(u)
        const uid = typeof u?.id === 'string' ? parseInt(u.id, 10) : u?.id
        setUserId(uid || null)
        if (u?.profile?.id) setProfileId(u.profile.id)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!API_BASE || !userId) return
      try {
        const r = await fetch(`${API_BASE}/api/profile/user/${userId}`, { cache: 'no-store' })
        if (!r.ok) return
        const data = (await r.json()) as { profile?: ApiProfile }
        const p = data?.profile
        if (p) {
          setProfile(p)
          setOrgName(p.name || userLite?.name || 'Mon Établissement')
          if (p.avatar) setAvatarUrl(p.avatar)
          if (p.banner) setBannerUrl(p.banner)

          setDescription(p.description || '')

          setLocation(p.location || '')
          setCountry(p.country || '')
          setRadiusKm(p.radiusKm ? String(p.radiusKm) : '')
          setLat(p.latitude != null ? String(p.latitude) : '')
          setLng(p.longitude != null ? String(p.longitude) : '')

          if (Array.isArray(p.specialties) && p.specialties.length) {
            setSpecialties(p.specialties)
          }

          if (p.socials) setSocials(p.socials)
          if (!profileId && p.id) setProfileId(p.id)
        }
      } catch {
        // ignore
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE, userId])

  /* ====== Save helpers ====== */
  async function saveProfile(fields: Record<string, unknown>) {
    if (!API_BASE) throw new Error('NEXT_PUBLIC_API_URL manquant')
    if (!token) throw new Error('TOKEN_ABSENT')
    if (!profileId) throw new Error('PROFILE_ID_ABSENT')

    const res = await fetch(`${API_BASE}/api/profile/${profileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(fields),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({} as { error?: string }))
      throw new Error(err?.error || 'PROFILE_SAVE_FAILED')
    }
  }

  /* ====== Upload handlers ====== */
  const onSelectBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setBannerUploading(true)
      const { url } = await uploadToCloudinary(file, 'banners', 'image')
      setBannerUrl(url)
      await saveProfile({ banner: url })
    } catch (err) {
      console.error(err)
      alert("Échec de mise à jour de la bannière.")
    } finally {
      setBannerUploading(false)
      e.target.value = ''
    }
  }

  const onSelectAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setAvatarUploading(true)
      const { url } = await uploadToCloudinary(file, 'avatars', 'image')
      setAvatarUrl(url)
      await saveProfile({ avatar: url })
    } catch (err) {
      console.error(err)
      alert("Échec de mise à jour de l'avatar.")
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  /* ====== Map helpers (OSM + geocoding Nominatim) ====== */
  const mapSrc = useMemo(() => {
    // iframe OSM embed avec marker si lat/lng valides (fallback: centré France)
    const latNum = Number(lat)
    const lngNum = Number(lng)
    const hasCoords = !Number.isNaN(latNum) && !Number.isNaN(lngNum)
    const bbox = hasCoords
      ? `${lngNum - 0.02},${latNum - 0.02},${lngNum + 0.02},${latNum + 0.02}`
      : `-1.7,46.7,8.3,49.7` // bbox approx France
    const marker = hasCoords ? `&marker=${latNum},${lngNum}` : ''
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`
  }, [lat, lng])

  const geocodeAddress = async () => {
    try {
      const q = location.trim()
      if (!q) return
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`)
      const list = (await r.json()) as Array<{ lat: string; lon: string; display_name?: string }>
      if (!Array.isArray(list) || list.length === 0) {
        alert('Adresse introuvable.')
        return
      }
      setLat(list[0].lat)
      setLng(list[0].lon)
      // Sauvegarde côté profil
      const radius = radiusKm ? parseInt(radiusKm, 10) : null
      const countryGuess = country || '' // on peut aussi parser display_name
      await saveProfile({
        location,
        country: countryGuess,
        latitude: Number(list[0].lat),
        longitude: Number(list[0].lon),
        radiusKm: radius,
      })
      alert('Zone mise à jour ✅')
      setEditingGeo(false)
    } catch (err) {
      console.error(err)
      alert('Échec de mise à jour de la zone.')
    }
  }

  /* ====== UI actions ====== */
  const toggleSpec = (s: string) => {
    setSpecialties(prev => {
      const exists = prev.includes(s)
      const next = exists ? prev.filter(x => x !== s) : [...prev, s]
      // best-effort save
      if (profileId && token) saveProfile({ specialties: next }).catch(() => {})
      return next
    })
  }

  const addPublication = () => {
    const title = window.prompt('Titre de la publication ?')
    if (!title) return
    const image = window.prompt("URL de l'image ?") || '/media/pub_placeholder.jpg'
    setPublications(prev => [{ id: Date.now(), title, image, likes: 0, comments: 0 }, ...prev])
  }

  const likePub = (id: number) =>
    setPublications(prev => prev.map(p => (p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p)))

  const addJob = () => {
    const { title, date } = newJob
    if (!title.trim() || !date.trim()) return
    setJobs(prev => [{ ...newJob, id: Date.now() }, ...prev])
    setNewJob({ id: 0, title: '', date: '', budget: '', details: '' })
  }
  const removeJob = (id: number) => setJobs(prev => prev.filter(j => j.id !== id))

  const saveSocials = async () => {
    try {
      await saveProfile({ socials })
      alert('Réseaux/contacts mis à jour ✅')
    } catch (err) {
      console.error(err)
      alert('Échec de sauvegarde des réseaux.')
    }
  }

  /* ====== Publications: hero + vignettes ====== */
  const sortedPubs = [...publications].sort((a, b) => b.id - a.id)
  const heroPub = sortedPubs[0]
  const restPubs = sortedPubs.slice(1, 4)

  /* ================= Render ================= */
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

        <button
          onClick={() => bannerInputRef.current?.click()}
          className="absolute bottom-3 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-sm"
          disabled={bannerUploading}
          title="Changer la bannière"
        >
          {bannerUploading ? 'Envoi…' : 'Changer la bannière'}
        </button>
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={onSelectBanner} />
      </div>

      {/* ===== Entête sous bannière ===== */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-full overflow-hidden ring-4 ring-black">
            <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-1 right-1 bg-black/60 hover:bg-black/80 text-xs px-2 py-0.5 rounded"
              disabled={avatarUploading}
              title="Changer la photo"
            >
              {avatarUploading ? '...' : '✎'}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onSelectAvatar} />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{orgName}</h1>

            {/* Zone compacte: localisation + rayon (avec mini éditeur) */}
            <div className="mt-1 text-sm text-neutral-300 flex flex-wrap items-center gap-2">
              <MapPin size={14} className="text-pink-500" />
              <span>
                {location ? `${location}, ${country || ''}` : 'Localisation non renseignée'}
                {radiusKm ? ` · Rayon ${radiusKm} km` : ''}
              </span>
              <button
                onClick={() => setEditingGeo(v => !v)}
                className="text-xs px-2 py-1 rounded-full bg-white/10 hover:bg-white/20"
              >
                Régler
              </button>
            </div>

            {/* Tags d’établissement */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {specialties.map(s => (
                <span key={s} className="text-xs px-2 py-1 rounded-full bg-pink-600/20 border border-pink-600/40">
                  {s}
                </span>
              ))}
              <div className="relative">
                <details className="group">
                  <summary className="list-none text-xs px-2 py-1 rounded-full bg-white/10 border border-white/20 cursor-pointer">
                    Gérer
                  </summary>
                  <div className="absolute z-20 mt-2 w-44 rounded-xl bg-neutral-900 border border-white/10 p-2">
                    {allSpecialties.map(opt => {
                      const active = specialties.includes(opt)
                      return (
                        <button
                          key={opt}
                          onClick={() => toggleSpec(opt)}
                          className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-white/10 ${
                            active ? 'text-pink-400' : 'text-white'
                          }`}
                        >
                          {active ? '— ' : '+ '} {opt}
                        </button>
                      )
                    })}
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons rapides */}
        <div className="flex items-center gap-3">
          <button className="bg-white text-black rounded-full px-5 py-2 flex items-center gap-2 hover:bg-neutral-200">
            <MessageCircle size={18} /> Contacter
          </button>
          <button className="bg-pink-600 rounded-full px-5 py-2 hover:bg-pink-500">Suivre</button>
        </div>
      </div>

      {/* Mini panneau d’édition de zone (compact) */}
      {editingGeo && (
        <div className="max-w-6xl mx-auto px-4 pb-2">
          <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              className="md:col-span-2 bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
              placeholder="Ville / adresse"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
            <input
              className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
              placeholder="Pays"
              value={country}
              onChange={e => setCountry(e.target.value)}
            />
            <input
              className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
              placeholder="Latitude"
              value={lat}
              onChange={e => setLat(e.target.value)}
            />
            <input
              className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
              placeholder="Longitude"
              value={lng}
              onChange={e => setLng(e.target.value)}
            />
            <input
              className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
              placeholder="Rayon (km)"
              value={radiusKm}
              onChange={e => setRadiusKm(e.target.value)}
            />
            <div className="md:col-span-5 flex gap-2">
              <button onClick={geocodeAddress} className="text-sm px-3 py-2 rounded-lg bg-pink-600 hover:bg-pink-500">
                Sauvegarder la zone
              </button>
              <button onClick={() => setEditingGeo(false)} className="text-sm px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Corps en 2 colonnes ===== */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 pb-12">
        {/* ==== Colonne gauche ==== */}
        <div className="space-y-6">
          {/* Carte + Planning (côte à côte en large) */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Map réactive (iframe OSM) */}
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/30">
              <div className="flex items-center justify-between p-3">
                <h2 className="text-lg font-semibold">Localisation</h2>
              </div>
              <div className="relative w-full h-72">
                <iframe
                  title="map"
                  src={mapSrc}
                  className="absolute inset-0 w-full h-full"
                  loading="lazy"
                />
              </div>
              <div className="p-3 text-xs text-neutral-400 flex items-center gap-2">
                <MapPin size={14} className="text-pink-500" />
                {lat && lng ? `Lat ${lat} · Lng ${lng}` : 'Clique “Régler” pour définir la zone'}
              </div>
            </div>

            {/* Planning (FullCalendar) */}
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-neutral-900/60 p-3">
              <h2 className="text-lg font-semibold mb-2">Planning</h2>
              <div className="bg-white text-black rounded-lg p-2">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                  }}
                  initialView="dayGridMonth"
                  selectable
                  editable
                  select={(info: DateSelectArg) => {
                    const title = window.prompt('Titre de l’événement :')
                    if (!title) return
                    const ev = {
                      id: String(Date.now()),
                      title,
                      start: info.startStr,
                      end: info.endStr,
                      allDay: info.allDay,
                    }
                    setEvents(prev => [...prev, ev])
                  }}
                  eventClick={(e: EventClickArg) => {
                    if (window.confirm(`Supprimer “${e.event.title}” ?`)) {
                      setEvents(prev => prev.filter(x => x.id !== e.event.id))
                    }
                  }}
                  events={events}
                  height="auto"
                />
              </div>
            </div>
          </section>

          {/* Description (au-dessus du portfolio) */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Description</h2>
              <button
                onClick={async () => {
                  try {
                    await saveProfile({ description })
                    alert('Description sauvegardée ✅')
                  } catch {
                    alert('Échec de sauvegarde')
                  }
                }}
                className="text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20"
              >
                Enregistrer
              </button>
            </div>
            <textarea
              className="mt-3 w-full rounded-lg bg-black/30 border border-white/10 p-3 text-sm"
              rows={5}
              placeholder="Présentez votre établissement, vos formats de soirée, votre politique artistique…"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </section>

          {/* Publications (comme artiste) */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Publications</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowAllPubs(true)} className="text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20">
                  Voir tout
                </button>
                <button onClick={addPublication} className="text-sm px-3 py-1 rounded-full bg-pink-600 hover:bg-pink-500 flex items-center gap-1">
                  <Plus size={16} /> Ajouter
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {heroPub && (
                <div className="md:col-span-2 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                  <div className="relative w-full h-64">
                    <Image src={heroPub.image} alt={heroPub.title} fill className="object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="font-medium">{heroPub.title}</p>
                    {heroPub.caption && <p className="text-sm text-neutral-300 mt-1">{heroPub.caption}</p>}
                    <div className="mt-2 flex items-center gap-3 text-sm text-neutral-300">
                      <button onClick={() => likePub(heroPub.id)} className="inline-flex items-center gap-1 hover:text-white">
                        <Heart size={16} /> {heroPub.likes ?? 0}
                      </button>
                      <span className="inline-flex items-center gap-1">
                        💬 {heroPub.comments ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                {restPubs.map(p => (
                  <div key={p.id} className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                    <div className="relative w-full h-28">
                      <Image src={p.image} alt={p.title} fill className="object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-neutral-400">
                        <button onClick={() => likePub(p.id)} className="inline-flex items-center gap-1 hover:text-white">
                          <Heart size={14} /> {p.likes ?? 0}
                        </button>
                        <span className="inline-flex items-center gap-1">💬 {p.comments ?? 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Réseaux & contacts */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <h2 className="text-lg font-semibold">Réseaux & contacts</h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Instagram (https://instagram.com/...)"
                value={socials?.instagram || ''}
                onChange={e => setSocials(prev => ({ ...(prev || {}), instagram: e.target.value }))}
              />
              <input
                className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Facebook (https://facebook.com/...)"
                value={socials?.facebook || ''}
                onChange={e => setSocials(prev => ({ ...(prev || {}), facebook: e.target.value }))}
              />
              <input
                className="bg_black/30 bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="TikTok (https://tiktok.com/@...)"
                value={socials?.tiktok || ''}
                onChange={e => setSocials(prev => ({ ...(prev || {}), tiktok: e.target.value }))}
              />
              <input
                className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Site web (https://...)"
                value={socials?.website || ''}
                onChange={e => setSocials(prev => ({ ...(prev || {}), website: e.target.value }))}
              />
              <input
                className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Téléphone"
                value={socials?.phone || ''}
                onChange={e => setSocials(prev => ({ ...(prev || {}), phone: e.target.value }))}
              />
              <input
                className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Email"
                value={socials?.email || ''}
                onChange={e => setSocials(prev => ({ ...(prev || {}), email: e.target.value }))}
              />
            </div>
            <div className="mt-3">
              <button onClick={saveSocials} className="text-sm px-3 py-2 rounded-lg bg-pink-600 hover:bg-pink-500">
                Enregistrer
              </button>
            </div>
          </section>
        </div>

        {/* ==== Colonne droite ==== */}
        <aside className="space-y-6">
          {/* Offres d’emploi / annonces */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Offres d’emploi</h2>
            </div>

            {/* Formulaire rapide */}
            <div className="mt-3 grid grid-cols-1 gap-2">
              <input
                className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Intitulé (ex: DJ vendredi 23h–3h)"
                value={newJob.title}
                onChange={e => setNewJob(j => ({ ...j, title: e.target.value }))}
              />
              <input
                type="date"
                className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                value={newJob.date}
                onChange={e => setNewJob(j => ({ ...j, date: e.target.value }))}
              />
              <input
                className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Budget (ex: 250€–350€)"
                value={newJob.budget || ''}
                onChange={e => setNewJob(j => ({ ...j, budget: e.target.value }))}
              />
              <textarea
                className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Détails (style, matos, horaires...)"
                rows={3}
                value={newJob.details || ''}
                onChange={e => setNewJob(j => ({ ...j, details: e.target.value }))}
              />
              <button onClick={addJob} className="text-sm px-3 py-2 rounded-lg bg-pink-600 hover:bg-pink-500">
                Publier l’offre
              </button>
            </div>

            {/* Liste d’offres */}
            <ul className="mt-4 space-y-3">
              {jobs.map(j => (
                <li key={j.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{j.title}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{j.date} {j.budget ? `· ${j.budget}` : ''}</p>
                      {j.details && <p className="text-sm text-neutral-200 mt-1">{j.details}</p>}
                    </div>
                    <button onClick={() => removeJob(j.id)} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20">
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Avis – (placeholder, même style que artiste) */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Avis</h2>
              <button className="text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20">Voir tout</button>
            </div>
            <div className="mt-3 space-y-3">
              {[
                { id: 1, author: 'Soirée Riviera', avatar: '/avatars/pro1.png', rating: 5, text: 'Top accueil & technique.' },
                { id: 2, author: 'Agence Eventa', avatar: '/avatars/pro2.png', rating: 4, text: 'Equipe sérieuse, bon matos.' },
              ].map(r => (
                <div key={r.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 rounded-full overflow-hidden">
                      <Image src={r.avatar} alt={r.author} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{r.author}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < r.rating ? 'text-yellow-400' : 'text-neutral-600'}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-200 mt-2 leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Tarifs – identique à artiste/presta */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tarifs</h2>
            </div>
            <TarifsBlock onSave={fields => saveProfile(fields)} />
          </section>
        </aside>
      </div>

      {/* ===== Modal publications ===== */}
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
              <button onClick={() => setShowAllPubs(false)} className="text-sm px-3 py-1 rounded bg-white/10 hover:bg-white/20">
                Fermer
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sortedPubs.map(p => (
                <div key={p.id} className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                  <div className="relative w-full h-40">
                    <Image src={p.image} alt={p.title} fill className="object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium">{p.title}</p>
                    {p.caption && <p className="text-xs text-neutral-400 mt-1">{p.caption}</p>}
                    <div className="mt-1 flex items-center gap-3 text-xs text-neutral-400">
                      ❤️ {p.likes ?? 0} · 💬 {p.comments ?? 0}
                    </div>
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

/* ===== Petit composant Tarifs ===== */
function TarifsBlock({ onSave }: { onSave: (fields: Record<string, unknown>) => Promise<void> }) {
  type PriceLine = { id: number; label: string; price: string }
  const [prices, setPrices] = useState<PriceLine[]>([
    { id: 1, label: 'Privatisation salle — semaine', price: 'Sur devis' },
    { id: 2, label: 'Privatisation salle — week-end', price: 'Sur devis' },
  ])
  const [label, setLabel] = useState('')
  const [price, setPrice] = useState('')

  const add = () => {
    const l = label.trim()
    const p = price.trim()
    if (!l || !p) return
    setPrices(prev => [...prev, { id: Date.now(), label: l, price: p }])
    setLabel('')
    setPrice('')
  }
  const remove = (id: number) => setPrices(prev => prev.filter(x => x.id !== id))

  const save = async () => {
    await onSave({ prices })
    alert('Tarifs sauvegardés ✅')
  }

  return (
    <div>
      <ul className="mt-3 space-y-2">
        {prices.map(p => (
          <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <div>
              <p className="text-sm font-medium">{p.label}</p>
              <p className="text-xs text-neutral-300">{p.price}</p>
            </div>
            <button onClick={() => remove(p.id)} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20">
              Supprimer
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <input
          className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
          placeholder="Intitulé"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
        <input
          className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
          placeholder="Tarif"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button onClick={add} className="text-sm px-3 py-2 rounded-lg bg-pink-600 hover:bg-pink-500">
            Ajouter un tarif
          </button>
          <button onClick={save} className="text-sm px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}