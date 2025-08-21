'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core'
import { Settings2, ChevronDown, Plus, MessageCircle, UserPlus } from 'lucide-react'

/* ================= Types ================= */
type StoredUser = {
  id: number | string
  name?: string
  email?: string
  role?: 'PROVIDER' | 'ARTIST' | 'ORGANIZER' | 'ADMIN'
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
  description?: string | null
  location?: string | null
  country?: string | null
  radiusKm?: number | null
  specialties?: string[] | null
  avatar?: string | null
  banner?: string | null
  user?: ApiUser
}

/* ================= Helpers ================= */
async function uploadToCloudinary(
  file: File,
  folder: 'avatars' | 'banners' | 'messages' | 'media',
  type: 'image' | 'video' | 'auto' = 'auto'
) {
  const API = process.env.NEXT_PUBLIC_API_URL
  if (!API) throw new Error('NEXT_PUBLIC_API_URL manquant côté frontend')
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
  return res.json() as Promise<{ url: string; public_id?: string }>
}

/* ================= Constantes ================= */
const PROVIDER_OPTIONS = [
  'Traiteur',
  'Photobooth',
  'Artificier',
  'Photographe',
  'Décorateur',
  'Son / Lumière',
  'Sécurité',
]

/* ============================================================ */

export default function ProviderProfilePage() {
  const router = useRouter()
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

  /* ===== Auth + IDs ===== */
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [profileId, setProfileId] = useState<number | null>(null)
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null)

  useEffect(() => {
    try {
      const t = localStorage.getItem('token')
      const uStr = localStorage.getItem('user')
      if (t) setToken(t)
      if (uStr) {
        const u: StoredUser = JSON.parse(uStr)
        if (u?.role !== 'PROVIDER') {
          router.push('/home')
          return
        }
        setCurrentUser(u)
        const uid = typeof u.id === 'string' ? parseInt(u.id, 10) : u.id
        setUserId(uid || null)
        if (u.profile?.id) setProfileId(u.profile.id)
      }
    } catch {
      // ignore
    }
  }, [router])

  /* ===== État profil affiché ===== */
  const fallback = useMemo(
    () => ({
      banner: '/banners/provider_banner.jpg',
      avatar: '/default-avatar.png',
      name: 'Prestataire',
      location: '—',
      country: '',
      description:
        "Décrivez vos prestations, votre matériel, vos conditions d’intervention, etc.",
      specialties: [] as string[],
    }),
    []
  )

  const [profile, setProfile] = useState<ApiProfile | null>(null)

  // visuels
  const [bannerUrl, setBannerUrl] = useState<string>(fallback.banner)
  const [avatarUrl, setAvatarUrl] = useState<string>(fallback.avatar)
  const bannerInputRef = useRef<HTMLInputElement | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // données modifiables
  const [types, setTypes] = useState<string[]>(fallback.specialties)
  const [typePickerOpen, setTypePickerOpen] = useState(false)

  const [location, setLocation] = useState<string>(fallback.location)
  const [country, setCountry] = useState<string>(fallback.country)
  const [radiusKm, setRadiusKm] = useState<string>('')

  const [description, setDescription] = useState<string>(fallback.description)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState<string>(fallback.description)

  // planning
  const [events, setEvents] = useState<EventInput[]>([])

  /* ===== Charger le profil backend ===== */
  useEffect(() => {
    const loadProfile = async () => {
      if (!API_BASE || !userId) return
      try {
        const r = await fetch(`${API_BASE}/api/profile/user/${userId}`)
        if (!r.ok) return
        const data = (await r.json()) as { profile?: ApiProfile }
        const p = data?.profile
        if (!p) return

        setProfile(p)
        if (p.banner) setBannerUrl(p.banner)
        if (p.avatar) setAvatarUrl(p.avatar)
        if (p.description) {
          setDescription(p.description)
          setDescDraft(p.description)
        }
        setTypes(p.specialties ?? [])
        setLocation(p.location ?? '')
        setCountry(p.country ?? '')
        setRadiusKm(p.radiusKm ? String(p.radiusKm) : '')
        if (!profileId && p.id) setProfileId(p.id)
      } catch {
        // ignore
      }
    }
    loadProfile()
  }, [API_BASE, userId, profileId])

  /* ===== Persistance profil ===== */
  async function saveProfile(fields: Record<string, unknown>) {
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

  /* ===== Upload bannière / avatar ===== */
  const onSelectBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setBannerUploading(true)
      const { url } = await uploadToCloudinary(file, 'banners', 'image')
      setBannerUrl(url)
      await saveProfile({ banner: url })
      alert('Bannière mise à jour ✅')
    } catch (err) {
      console.error(err)
      alert('Échec de mise à jour de la bannière.')
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
      alert('Photo de profil mise à jour ✅')
    } catch (err) {
      console.error(err)
      alert("Échec de mise à jour de l'avatar.")
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  /* ===== Interactions ===== */
  const toggleType = (label: string) => {
    setTypes(prev =>
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    )
  }

  const saveTypes = async () => {
    try {
      await saveProfile({ specialties: types })
      alert('Types de prestations enregistrés ✅')
    } catch (err) {
      console.error(err)
      alert('Impossible de sauvegarder les prestations.')
    }
  }

  const saveZone = async () => {
    try {
      await saveProfile({
        location: location.trim(),
        country: country.trim(),
        radiusKm: radiusKm ? parseInt(radiusKm, 10) : null,
      })
      alert('Zone d’intervention enregistrée ✅')
    } catch (err) {
      console.error(err)
      alert('Impossible de sauvegarder la zone.')
    }
  }

  const saveDescription = async () => {
    try {
      await saveProfile({ description: descDraft })
      setDescription(descDraft)
      setEditingDesc(false)
      alert('Description enregistrée ✅')
    } catch (err) {
      console.error(err)
      alert('Impossible de sauvegarder la description.')
    }
  }

  const contact = () => router.push(`/messages/new?to=${userId ?? profile?.userId ?? ''}`)
  const follow = () => alert('Vous suivez maintenant ce prestataire ✅')

  /* ===== Planning (FullCalendar) ===== */
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const title = window.prompt('Titre de l’événement ?')
    const calendarApi = selectInfo.view.calendar
    calendarApi.unselect()
    if (title) {
      const newEvent: EventInput = {
        id: String(Date.now()),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
      }
      setEvents(prev => [...prev, newEvent])
    }
  }

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (window.confirm(`Supprimer l’événement "${clickInfo.event.title}" ?`)) {
      setEvents(prev => prev.filter(e => e.id !== clickInfo.event.id))
    }
  }

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

      {/* ===== En-tête sous bannière ===== */}
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
              {profile?.user?.name ?? currentUser?.name ?? 'Prestataire'}
            </h1>
            <p className="text-sm text-neutral-300">
              {location || 'Localisation à définir'}
              {country ? `, ${country}` : ''}
              {radiusKm ? ` · Rayon ${radiusKm}km` : ''}
            </p>

            {/* Types de prestations (chips) */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {types.map(t => (
                <span key={t} className="text-xs px-2 py-1 rounded-full bg-indigo-600/25 border border-indigo-500/50">
                  {t}
                </span>
              ))}

              {/* Sélecteur de types */}
              <div className="relative">
                <button
                  onClick={() => setTypePickerOpen(v => !v)}
                  className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/20 flex items-center gap-1"
                >
                  Gérer
                  <ChevronDown size={14} />
                </button>
                {typePickerOpen && (
                  <div className="absolute z-20 mt-2 w-56 rounded-xl bg-neutral-900 border border-white/10 p-2">
                    <div className="max-h-56 overflow-auto pr-1">
                      {PROVIDER_OPTIONS.map(opt => {
                        const active = types.includes(opt)
                        return (
                          <button
                            key={opt}
                            onClick={() => toggleType(opt)}
                            className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-white/10 ${
                              active ? 'text-indigo-400' : 'text-white'
                            }`}
                          >
                            {active ? '— ' : '+ '} {opt}
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setTypePickerOpen(false)
                          void saveTypes()
                        }}
                        className="text-xs px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={contact}
            className="bg-white text-black rounded-full px-5 py-2 flex items-center gap-2 hover:bg-neutral-200"
          >
            <MessageCircle size={18} /> Contacter
          </button>
          <button
            onClick={follow}
            className="bg-indigo-600 rounded-full px-5 py-2 flex items-center gap-2 hover:bg-indigo-500"
          >
            <UserPlus size={18} /> Suivre
          </button>
        </div>
      </div>

      {/* ===== Corps ===== */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 pb-12">
        {/* Colonne gauche */}
        <div className="space-y-6">
          {/* Portfolio (placeholders, à relier plus tard) */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Portfolio</h2>
              <button
                onClick={() => alert('Ouverture du module de portfolio')}
                className="text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20"
              >
                Gérer
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="relative w-full h-28 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                  <Image src={`/media/placeholder_${(i % 5) + 1}.jpg`} alt="media" fill className="object-cover" />
                </div>
              ))}
            </div>
          </section>

          {/* Description (persistée) */}
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
                    onClick={saveDescription}
                    className="text-sm px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500"
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
              <p className="text-neutral-200 mt-3 leading-relaxed whitespace-pre-wrap">{description}</p>
            ) : (
              <textarea
                className="mt-3 w-full rounded-lg bg-black/30 border border-white/10 p-3 text-sm"
                rows={5}
                value={descDraft}
                onChange={e => setDescDraft(e.target.value)}
              />
            )}
          </section>

          {/* Planning (FullCalendar en thème sombre) */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <h2 className="text-lg font-semibold mb-3">Mon planning</h2>
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div className="bg-black text-white p-2 text-sm">Calendrier</div>
              <div className="bg-neutral-950 p-2">
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
                  select={handleDateSelect}
                  eventClick={handleEventClick}
                  events={events}
                  height="auto"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Colonne droite */}
        <aside className="space-y-6">
          {/* Zone d’intervention */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <h2 className="text-lg font-semibold">Zone d’intervention</h2>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <input
                className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Ville"
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
                placeholder="Rayon (km)"
                value={radiusKm}
                onChange={e => setRadiusKm(e.target.value)}
              />
              <button
                onClick={saveZone}
                className="text-sm px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500"
              >
                Enregistrer
              </button>
            </div>
          </section>

          {/* Raccourcis prestations */}
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Prestations</h2>
              <button
                onClick={() => setTypePickerOpen(v => !v)}
                className="text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 flex items-center gap-1"
              >
                Gérer <Plus size={14} />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {types.length ? (
                types.map(t => (
                  <span key={t} className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/15">
                    {t}
                  </span>
                ))
              ) : (
                <p className="text-sm text-neutral-400">Aucun type sélectionné.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}