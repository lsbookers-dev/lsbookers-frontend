'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Settings2,
  ChevronDown,
  Plus,
  MessageCircle,
  UserPlus,
  Star,
  MapPin,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
/* ================= Types ================= */
type RoleTag = { label: string }
type Publication = {
  id: number
  title: string
  media: string
  mediaType: 'image' | 'video'
  caption?: string
  time?: string
}
type Review = { id: number; author: string; authorAvatar: string; rating: number; text: string }
type PriceLine = { id: number; label: string; price: string }
type StoredUser = {
  id: number | string
  name?: string
  role?: string
  profile?: { id: number }
}
type ApiUser = { id: number; name: string }
type ApiProfile = {
  id: number
  userId: number
  avatar?: string | null
  banner?: string | null
  bio?: string | null
  location?: string | null
  country?: string | null
  radiusKm?: number | null
  specialties?: string[] | null
  bannerPositionY?: number | null
  user?: ApiUser
}
/* ================= Helpers ================= */
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
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error((err as { details?: string })?.details || 'UPLOAD_FAILED')
  }
  return res.json() as Promise<{ url: string; public_id: string }>
}
/* ============================================================ */
export default function ProviderProfilePage() {
  const router = useRouter()
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
  // --------- “mock” valeurs de départ pour l’UI ----------
  const providerDefaults = useMemo(
    () => ({
      banner: '/banners/provider_banner.jpg',
      avatar: '/avatars/provider.png',
      name: 'Prestataire',
      location: 'Marseille',
      country: 'France',
      radiusKm: 200,
      roles: [{ label: 'Traiteur' }, { label: 'Photobooth' }, { label: 'Artificier' }] as RoleTag[],
      description:
        'Décrivez vos prestations, votre matériel, vos conditions d’intervention, etc.',
    }),
    []
  )
  /* ===== Auth + profile réels ===== */
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [profileId, setProfileId] = useState<number | null>(null)
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null)
  const [profile, setProfile] = useState<ApiProfile | null>(null)
  useEffect(() => {
    try {
      const t = localStorage.getItem('token')
      const uStr = localStorage.getItem('user')
      if (t) setToken(t)
      if (uStr) {
        const u: StoredUser = JSON.parse(uStr)
        setCurrentUser(u)
        const uid = typeof u?.id === 'string' ? parseInt(u.id, 10) : u?.id
        setUserId(uid || null)
        if (u?.profile?.id) setProfileId(u.profile.id)
      }
    } catch {
      /* ignore */
    }
  }, [])
  /* ===== Visuels (avec MAJ immédiate) ===== */
  const [bannerUrl, setBannerUrl] = useState<string>(providerDefaults.banner)
  const [avatarUrl, setAvatarUrl] = useState<string>(providerDefaults.avatar)
  const bannerInputRef = useRef<HTMLInputElement | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const pubInputRef = useRef<HTMLInputElement | null>(null)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [pubUploading, setPubUploading] = useState(false)
  // Position verticale de la bannière (object-position-y)
  const [bannerPosY, setBannerPosY] = useState<number>(50) // %
  const [tweakOpen, setTweakOpen] = useState(false) // popover réglage
  // Prestations (badges)
  const [roles, setRoles] = useState<RoleTag[]>(providerDefaults.roles)
  const allRoleOptions = useMemo(
    () => ['Traiteur', 'Photobooth', 'Artificier', 'Photographe', 'Décorateur', 'Barman', 'Location sono'],
    []
  )
  const [rolePickerOpen, setRolePickerOpen] = useState(false)
  // Zone d’intervention (éditable via petit popover)
  const [locDraft, setLocDraft] = useState(providerDefaults.location)
  const [countryDraft, setCountryDraft] = useState(providerDefaults.country)
  const [radiusDraft, setRadiusDraft] = useState<string>(String(providerDefaults.radiusKm))
  const [geoOpen, setGeoOpen] = useState(false)
  // Description
  const [description, setDescription] = useState(providerDefaults.description)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState(description)
  // Publications
  const [publications, setPublications] = useState<Publication[]>([])
  const [showAllPubs, setShowAllPubs] = useState(false)
  const [showAddPubModal, setShowAddPubModal] = useState(false)
  const [newPubTitle, setNewPubTitle] = useState('')
  const [newPubCaption, setNewPubCaption] = useState('')
  const [newPubFile, setNewPubFile] = useState<File | null>(null)
  // Avis & Tarifs (colonne droite)
  const [reviews] = useState<Review[]>([
    { id: 1, author: 'Wedding Planning', authorAvatar: '/avatars/pro1.png', rating: 5, text: 'Service impeccable, réactif et flexible. Reco ++' },
    { id: 2, author: 'Event Corp', authorAvatar: '/avatars/pro2.png', rating: 4, text: 'Très pro, bon matériel, installation rapide.' },
  ])
  const [prices, setPrices] = useState<PriceLine[]>([
    { id: 1, label: 'Cocktail dînatoire (50 pers)', price: 'Dès 800€' },
    { id: 2, label: 'Photobooth (soirée)', price: 'Dès 350€' },
  ])
  const [newPriceLabel, setNewPriceLabel] = useState('')
  const [newPriceValue, setNewPriceValue] = useState('')
  /* ===== Charger profil depuis l’API ===== */
  useEffect(() => {
    const loadProfile = async () => {
      if (!API_BASE || !userId) return
      try {
        const r = await fetch(`${API_BASE}/api/profile/user/${userId}`)
        if (!r.ok) return
        const data = (await r.json()) as { profile?: ApiProfile }
        const p = data?.profile
        if (p) {
          setProfile(p)
          if (p.banner) setBannerUrl(p.banner)
          if (p.avatar) setAvatarUrl(p.avatar)
          if (typeof p.bannerPositionY === 'number') setBannerPosY(p.bannerPositionY)
          if (!profileId && p.id) setProfileId(p.id)
          if (p.location) setLocDraft(p.location)
          if (p.country) setCountryDraft(p.country)
          if (typeof p.radiusKm === 'number') setRadiusDraft(String(p.radiusKm))
          if (p.bio) {
            setDescription(p.bio)
            setDescDraft(p.bio)
          }
          if (p.specialties?.length) {
            setRoles(p.specialties.map(s => ({ label: s })))
          }
        }
      } catch {
        /* ignore */
      }
    }
    loadProfile()
  }, [API_BASE, userId, profileId])
  /* ===== Charger publications depuis l’API ===== */
  useEffect(() => {
    const loadPublications = async () => {
      if (!API_BASE || !profileId) return
      try {
        const res = await fetch(`${API_BASE}/api/publications/profile/${profileId}`)
        if (!res.ok) throw new Error('Failed to load publications')
        const data = await res.json()
        setPublications(data.publications || [])
      } catch (err) {
        console.error('Erreur de chargement des publications:', err)
      }
    }
    loadPublications()
  }, [API_BASE, profileId])
  /* =============== Actions persistance =============== */
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
      alert("Échec de la mise à jour de la bannière.")
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
      alert("Échec de la mise à jour de l'avatar.")
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }
  const persistBannerPos = async (val: number) => {
    setBannerPosY(val)
    try {
      await saveProfile({ bannerPositionY: val })
    } catch {
      /* optionnel: silencieux si backend pas prêt */
    }
  }
  const toggleRole = (label: string) => {
    setRoles(prev =>
      prev.some(r => r.label === label) ? prev.filter(r => r.label !== label) : [...prev, { label }]
    )
  }
  const saveSpecialties = async () => {
    try {
      await saveProfile({ specialties: roles.map(r => r.label) })
      alert('Prestations mises à jour ✅')
    } catch {
      alert('Impossible de sauvegarder les prestations.')
    }
  }
  const saveGeo = async () => {
    try {
      const radiusNum = parseInt(radiusDraft || '0', 10) || 0
      setGeoOpen(false)
      await saveProfile({ location: locDraft, country: countryDraft, radiusKm: radiusNum })
      alert('Zone d’intervention mise à jour ✅')
    } catch {
      alert('Échec de sauvegarde de la zone.')
    }
  }
  const addPublication = async () => {
    if (!newPubTitle.trim() || !newPubFile) return
    try {
      setPubUploading(true)
      const mediaType = newPubFile.type.startsWith('video/') ? 'video' : 'image'
      const { url } = await uploadToCloudinary(newPubFile, 'media', mediaType)
      const newPub = {
        title: newPubTitle,
        media: url,
        mediaType,
        caption: newPubCaption.trim() || undefined,
        profileId,
      }
      const res = await fetch(`${API_BASE}/api/publications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPub),
      })
      if (!res.ok) throw new Error('Failed to save publication')
      const savedPub = await res.json()
      setPublications(prev => [savedPub, ...prev])
      setNewPubTitle('')
      setNewPubCaption('')
      setNewPubFile(null)
      setShowAddPubModal(false)
      alert('Publication ajoutée ✅')
    } catch (err) {
      console.error('Erreur lors de l’ajout de la publication:', err)
      alert('Échec de l’ajout de la publication')
    } finally {
      setPubUploading(false)
      if (pubInputRef.current) pubInputRef.current.value = ''
    }
  }
  const deletePublication = async (id: number) => {
    if (!confirm('Supprimer cette publication ?')) return
    try {
      const res = await fetch(`${API_BASE}/api/publications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error('Failed to delete publication')
      setPublications(prev => prev.filter(p => p.id !== id))
      alert('Publication supprimée ✅')
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      alert('Échec de la suppression')
    }
  }
  const addPrice = () => {
    const lbl = newPriceLabel.trim()
    const val = newPriceValue.trim()
    if (!lbl || !val) return
    setPrices(prev => [...prev, { id: Date.now(), label: lbl, price: val }])
    setNewPriceLabel('')
    setNewPriceValue('')
  }
  const removePrice = (id: number) => setPrices(prev => prev.filter(p => p.id !== id))
  /* =========================== UI =========================== */
  const sorted = [...publications].sort((a, b) => b.id - a.id)
  const heroPub = sorted[0]
  const restPubs = sorted.slice(1, 4)
  return (
    <div className="min-h-screen bg-black text-white">
      {/* ===== Bannière ===== */}
      <div className="relative h-56 sm:h-64 md:h-72 lg:h-80">
        <Image
          src={bannerUrl}
          alt="Bannière"
          fill
          priority
          className="object-cover opacity-90"
          style={{ objectPosition: `50% ${bannerPosY}%` }}
        />
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => router.push('/settings/profile')}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl flex items-center gap-2 backdrop-blur"
          >
            <Settings2 size={18} />
            Réglages
          </button>
          <button
            onClick={() => bannerInputRef.current?.click()}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl"
            disabled={bannerUploading}
            title="Changer la bannière"
          >
            {bannerUploading ? 'Envoi…' : 'Changer'}
          </button>
          <div className="relative">
            <button
              onClick={() => setTweakOpen(v => !v)}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl flex items-center gap-2"
              title="Ajuster le centrage"
            >
              <SlidersHorizontal size={18} />
              Centrer
            </button>
            {tweakOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-neutral-900 border border-white/10 p-3">
                <p className="text-xs mb-2">Position verticale</p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={bannerPosY}
                  onChange={e => persistBannerPos(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={onSelectBanner} />
      </div>
      {/* ===== Header infos ===== */}
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
            <h1 className="text-2xl md:text-3xl font-bold">
              {currentUser?.name ?? profile?.user?.name ?? providerDefaults.name}
            </h1>
            <p className="text-sm text-neutral-300 flex items-center gap-2 mt-1">
              <MapPin size={16} className="text-violet-400" />
              <span>
                {(profile?.location ?? locDraft) || '—'}, {(profile?.country ?? countryDraft) || '—'} • Rayon{' '}
                {(profile?.radiusKm ?? parseInt(radiusDraft || '0', 10))} km
              </span>
              <button
                onClick={() => setGeoOpen(v => !v)}
                className="text-xs px-2 py-1 rounded-full bg-white/10 hover:bg-white/20"
                title="Régler la zone"
              >
                Régler
              </button>
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {roles.map(r => (
                <span key={r.label} className="text-xs px-2 py-1 rounded-full bg-violet-600/20 border border-violet-600/40">
                  {r.label}
                </span>
              ))}
              <div className="relative">
                <button
                  onClick={() => setRolePickerOpen(v => !v)}
                  className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/20 flex items-center gap-1"
                >
                  Gérer <ChevronDown size={14} />
                </button>
                {rolePickerOpen && (
                  <div className="absolute z-20 mt-2 w-56 rounded-2xl bg-neutral-900 border border-white/10 p-2">
                    {allRoleOptions.map(opt => {
                      const active = roles.some(r => r.label === opt)
                      return (
                        <button
                          key={opt}
                          onClick={() => toggleRole(opt)}
                          className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-white/10 ${
                            active ? 'text-violet-400' : 'text-white'
                          }`}
                        >
                          {active ? '— ' : '+ '} {opt}
                        </button>
                      )
                    })}
                    <div className="pt-2 mt-2 border-t border-white/10">
                      <button
                        onClick={() => {
                          setRolePickerOpen(false)
                          saveSpecialties()
                        }}
                        className="w-full text-center text-sm px-2 py-1 rounded bg-violet-600 hover:bg-violet-500"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {geoOpen && (
              <div className="mt-3 rounded-2xl bg-neutral-900 border border-white/10 p-3 w-full max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                    placeholder="Ville"
                    value={locDraft}
                    onChange={e => setLocDraft(e.target.value)}
                  />
                  <input
                    className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                    placeholder="Pays"
                    value={countryDraft}
                    onChange={e => setCountryDraft(e.target.value)}
                  />
                  <input
                    type="number"
                    className="bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                    placeholder="Rayon (km)"
                    value={radiusDraft}
                    onChange={e => setRadiusDraft(e.target.value)}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={saveGeo} className="text-sm px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500">
                    Enregistrer
                  </button>
                  <button onClick={() => setGeoOpen(false)} className="text-sm px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20">
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white text-black rounded-full px-5 py-2 flex items-center gap-2 hover:bg-neutral-200">
            <MessageCircle size={18} /> Contacter
          </button>
          <button className="bg-violet-600 rounded-full px-5 py-2 flex items-center gap-2 hover:bg-violet-500">
            <UserPlus size={18} /> Suivre
          </button>
        </div>
      </div>
      {/* ===== Corps ===== */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 pb-12">
        {/* Colonne gauche */}
        <div className="space-y-6">
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
                    onClick={async () => {
                      setDescription(descDraft)
                      setEditingDesc(false)
                      try {
                        await saveProfile({ bio: descDraft })
                      } catch {/* ignore */}
                    }}
                    className="text-sm px-3 py-1 rounded-full bg-violet-600 hover:bg-violet-500"
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
                  onClick={() => setShowAddPubModal(true)}
                  className="text-sm px-3 py-1 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center gap-1"
                >
                  <Plus size={16} /> Ajouter
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
              {publications.length > 0 && (
                <>
                  {heroPub && (
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                      <div className="relative w-full h-64">
                        {heroPub.mediaType === 'image' ? (
                          <Image src={heroPub.media} alt={heroPub.title} fill className="object-cover" />
                        ) : (
                          <video src={heroPub.media} controls className="w-full h-full object-cover" />
                        )}
                        <button
                          onClick={() => deletePublication(heroPub.id)}
                          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white px-2 py-1 rounded"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="p-3">
                        <p className="font-medium">{heroPub.title}</p>
                        {heroPub.caption && <p className="text-sm text-neutral-300 mt-1">{heroPub.caption}</p>}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-4">
                    {restPubs.map(p => (
                      <div key={p.id} className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                        <div className="relative w-full h-28">
                          {p.mediaType === 'image' ? (
                            <Image src={p.media} alt={p.title} fill className="object-cover" />
                          ) : (
                            <video src={p.media} controls className="w-full h-full object-cover" />
                          )}
                          <button
                            onClick={() => deletePublication(p.id)}
                            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white px-2 py-1 rounded"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="p-2">
                          <p className="text-sm font-medium truncate">{p.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <h2 className="text-lg font-semibold">Planning</h2>
            <div className="mt-3 h-48 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center">
              <span className="text-neutral-500 text-sm">Calendrier prestataire (composant existant)</span>
            </div>
          </section>
        </div>
        {/* Colonne droite */}
        <aside className="space-y-6">
          <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Avis</h2>
              <button className="text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20">Voir tout</button>
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
                className="text-sm px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500"
              >
                Ajouter un tarif
              </button>
            </div>
          </section>
        </aside>
      </div>
      {/* ===== Modal Publications ===== */}
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
              {sorted.map(p => (
                <div key={p.id} className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                  <div className="relative w-full h-40">
                    {p.mediaType === 'image' ? (
                      <Image src={p.media} alt={p.title} fill className="object-cover" />
                    ) : (
                      <video src={p.media} controls className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => deletePublication(p.id)}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white px-2 py-1 rounded"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
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
      {/* ===== Modal Ajout Publication ===== */}
      {showAddPubModal && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddPubModal(false)}
        >
          <div
            className="max-w-md w-full bg-neutral-950 border border-white/10 rounded-2xl p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nouvelle publication</h3>
              <button
                onClick={() => setShowAddPubModal(false)}
                className="text-sm px-3 py-1 rounded bg-white/10 hover:bg-white/20"
              >
                Fermer
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input
                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Titre de la publication"
                value={newPubTitle}
                onChange={e => setNewPubTitle(e.target.value)}
              />
              <textarea
                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Légende (optionnel)"
                rows={3}
                value={newPubCaption}
                onChange={e => setNewPubCaption(e.target.value)}
              />
              <input
                ref={pubInputRef}
                type="file"
                accept="image/*,video/*"
                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                onChange={e => setNewPubFile(e.target.files?.[0] || null)}
              />
              <button
                onClick={addPublication}
                className="w-full text-sm px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
                disabled={pubUploading || !newPubTitle || !newPubFile}
              >
                {pubUploading ? 'Envoi…' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}