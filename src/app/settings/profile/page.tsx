'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import CropModal from '@/components/CropModal'
import {
  Camera, Save, ArrowLeft, Music, MapPin, User, Briefcase,
  CheckCircle, XCircle, ShieldOff, ShieldAlert
} from 'lucide-react'

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

// Spécialités par rôle
const SPECIALTIES_BY_ROLE: Record<string, string[]> = {
  ARTIST: ['DJ', 'Chanteur', 'Chanteuse', 'Saxophoniste', 'Danseur', 'Danseuse', 'Groupe', 'Rappeur', 'Guitariste', 'Pianiste', 'Violoniste', 'Trompettiste', 'Animateur', 'MC'],
  ORGANIZER: ['Club / Discothèque', 'Restaurant', 'Wedding Planner', 'Festival', 'Corporate / Entreprise', 'Salle des fêtes', 'Bar / Lounge', 'Hôtel', 'Association', 'Particulier'],
  PROVIDER: ['Photographe', 'Vidéaste', 'Traiteur', 'Serveur / Service', 'Décorateur', 'Éclairagiste', 'Sonorisation', 'Sécurité', 'Maquilleur', 'Coiffeur', 'Fleuriste', 'Location matériel'],
}

const STYLES = [
  'Electro', 'House', 'Techno', 'Deep House', 'RNB', 'Hip-Hop', 'Rap', 'Trap',
  'Reggaeton', 'Afrobeats', 'Dancehall', 'Jazz', 'Blues', 'Soul', 'Funk',
  'Pop', 'Rock', 'Latino', 'Salsa', 'Bachata', 'Kizomba', 'Gospel', 'Classique',
]

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Profile = {
  id: number
  bio: string
  location: string
  specialties: string[]
  styles: string[]
  radiusKm: number | null
  soundcloudUrl: string
  showSoundcloud: boolean
  youtubeUrl: string
  availableForBooking: boolean
  showRealName: boolean
  avatar: string | null
  banner: string | null
}

// ─────────────────────────────────────────────
// Composant Toggle
// ─────────────────────────────────────────────
function Toggle({ value, onChange, label, description }: {
  value: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-white/90">{label}</p>
        {description && <p className="text-xs text-white/45 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-white/10'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Composant Tag sélectionnable
// ─────────────────────────────────────────────
function TagSelector({ options, selected, onChange }: {
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter(s => s !== item))
    } else {
      onChange([...selected, item])
    }
  }
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(item => (
        <button
          key={item}
          type="button"
          onClick={() => toggle(item)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            selected.includes(item)
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/80'
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Composant Section
// ─────────────────────────────────────────────
function Section({ title, icon, children }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-emerald-400">{icon}</span>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────
// Lit le token fraîchement depuis localStorage à chaque appel (fiable sur tous les navigateurs)
function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return t ? { Authorization: `Bearer ${t}`, ...extra } : { ...extra }
}

export default function ProfileSettings() {
  const router = useRouter()
  const { user } = useAuth()
  const role = user?.role || 'ARTIST'

  const [profile, setProfile] = useState<Profile>({
    id: 0,
    bio: '',
    location: '',
    specialties: [],
    styles: [],
    radiusKm: null,
    soundcloudUrl: '',
    showSoundcloud: false,
    youtubeUrl: '',
    availableForBooking: true,
    showRealName: false,
    avatar: null,
    banner: null,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [cropModal, setCropModal] = useState<{ src: string; type: 'avatar' | 'banner' } | null>(null)

  type BlockedUser = {
    id: number
    pseudo?: string | null
    firstName?: string | null
    lastName?: string | null
    role?: string | null
    avatar?: string | null
  }
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [unblockingId, setUnblockingId] = useState<number | null>(null)

  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  // ── Chargement du profil
  useEffect(() => {
    if (!user) return
    const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id

    fetch(`${API}/api/profile/user/${userId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(({ profile: p }) => {
        if (!p) return
        setProfile({
          id: p.id,
          bio: p.bio || '',
          location: p.location || '',
          specialties: p.specialties || [],
          styles: p.styles || [],
          radiusKm: p.radiusKm ?? null,
          soundcloudUrl: p.soundcloudUrl || '',
          showSoundcloud: !!p.showSoundcloud,
          youtubeUrl: p.youtubeUrl || '',
          availableForBooking: p.availableForBooking ?? true,
          showRealName: p.showRealName ?? false,
          avatar: p.avatar || null,
          banner: p.banner || null,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    // Charger la liste des bloqués
    fetch(`${API}/api/block/list`, { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : { blocked: [] })
      .then(d => setBlockedUsers(d.blocked || []))
      .catch(() => {})
  }, [user])

  // ── Débloquer un utilisateur
  const handleUnblock = async (targetId: number) => {
    setUnblockingId(targetId)
    try {
      const res = await fetch(`${API}/api/block/${targetId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        setBlockedUsers(prev => prev.filter(u => u.id !== targetId))
      }
    } catch {
      // silently fail
    } finally {
      setUnblockingId(null)
    }
  }

  // ── Upload image
  const uploadImage = async (file: File, folder: 'avatars' | 'banners') => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', folder)
    fd.append('type', 'image')
    const res = await fetch(`${API}/api/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })
    if (!res.ok) throw new Error('Échec upload')
    const data = await res.json()
    return data.url as string
  }

  // Ouvre le modal de recadrage au lieu d'uploader directement
  const openCrop = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset pour permettre de re-sélectionner le même fichier
    const reader = new FileReader()
    reader.onload = () => setCropModal({ src: reader.result as string, type })
    reader.readAsDataURL(file)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => openCrop(e, 'avatar')
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => openCrop(e, 'banner')

  // Reçoit le blob recadré → upload → sauvegarde l'URL
  const handleCropConfirm = async (blob: Blob) => {
    const type = cropModal?.type
    setCropModal(null)
    if (!type) return
    const file = new File([blob], `${type}.jpg`, { type: 'image/jpeg' })
    if (type === 'avatar') {
      setUploadingAvatar(true)
      try {
        const url = await uploadImage(file, 'avatars')
        setProfile(p => ({ ...p, avatar: url }))
      } catch { setError("Erreur lors de l'upload de la photo") }
      finally { setUploadingAvatar(false) }
    } else {
      setUploadingBanner(true)
      try {
        const url = await uploadImage(file, 'banners')
        setProfile(p => ({ ...p, banner: url }))
      } catch { setError("Erreur lors de l'upload de la bannière") }
      finally { setUploadingBanner(false) }
    }
  }

  // ── Sauvegarde
  const handleSave = async () => {
    if (!profile.id) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/profile/${profile.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          bio: profile.bio,
          location: profile.location,
          specialties: profile.specialties,
          styles: profile.styles,
          radiusKm: profile.radiusKm,
          soundcloudUrl: profile.soundcloudUrl,
          showSoundcloud: profile.showSoundcloud,
          youtubeUrl: profile.youtubeUrl,
          availableForBooking: profile.availableForBooking,
          showRealName: profile.showRealName,
          avatar: profile.avatar,
          banner: profile.banner,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erreur serveur')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0b0b10_0%,_#050508_55%)] flex items-center justify-center">
        <div className="text-white/50 text-sm">Chargement…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0b0b10_0%,_#050508_55%)] text-white pb-20">

      {/* Modal de recadrage */}
      {cropModal && (
        <CropModal
          src={cropModal.src}
          aspectRatio={cropModal.type === 'avatar' ? 1 : 3}
          displayWidth={cropModal.type === 'avatar' ? 280 : 360}
          shape={cropModal.type === 'avatar' ? 'circle' : 'rect'}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropModal(null)}
        />
      )}

      {/* Header fixe */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition">
            <ArrowLeft size={16} />
            Retour
          </button>
          <span className="text-sm font-semibold">Paramètres du profil</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-4 py-1.5 rounded-lg text-sm font-semibold transition"
          >
            {saving ? 'Enregistrement…' : <><Save size={14} /> Enregistrer</>}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Feedback */}
        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            <CheckCircle size={16} /> Profil enregistré avec succès !
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <XCircle size={16} /> {error}
          </div>
        )}

        {/* ── SECTION : Apparence ── */}
        <Section title="Apparence" icon={<Camera size={18} />}>

          {/* Bannière */}
          <div className="relative h-36 rounded-xl overflow-hidden bg-white/5 border border-white/10 mb-4">
            {profile.banner && (
              <Image src={profile.banner} alt="Bannière" fill className="object-cover" />
            )}
            <button
              onClick={() => bannerRef.current?.click()}
              disabled={uploadingBanner}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 hover:bg-black/60 transition text-sm text-white/70 hover:text-white"
            >
              <Camera size={20} />
              {uploadingBanner ? 'Upload…' : 'Changer la bannière'}
            </button>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white/10 border border-white/10 flex-shrink-0">
              {profile.avatar
                ? <Image src={profile.avatar} alt="Avatar" fill className="object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/30">
                    {user?.email?.[0]?.toUpperCase() || '?'}
                  </div>
              }
              <button
                onClick={() => avatarRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/70 transition opacity-0 hover:opacity-100"
              >
                <Camera size={16} className="text-white" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="text-sm font-medium">Photo de profil</p>
              <p className="text-xs text-white/45 mt-1">JPG, PNG · Max 5 Mo · Carré recommandé</p>
              <button onClick={() => avatarRef.current?.click()} disabled={uploadingAvatar} className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
                {uploadingAvatar ? 'Upload en cours…' : 'Changer la photo'}
              </button>
            </div>
          </div>
        </Section>

        {/* ── SECTION : Identité publique ── */}
        <Section title="Identité publique" icon={<User size={18} />}>
          <div className="space-y-4">
            <Toggle
              value={profile.showRealName}
              onChange={v => setProfile(p => ({ ...p, showRealName: v }))}
              label="Afficher mon nom et prénom"
              description="Si désactivé, seul ton pseudo sera visible"
            />
            <div className="border-t border-white/8 pt-4">
              <Toggle
                value={profile.availableForBooking}
                onChange={v => setProfile(p => ({ ...p, availableForBooking: v }))}
                label="Disponible pour booking"
                description="Indique aux organisateurs que tu es ouvert aux demandes"
              />
            </div>
            <div className="border-t border-white/8 pt-4">
              <label className="text-sm text-white/70 mb-2 block">Bio / Description</label>
              <textarea
                value={profile.bio}
                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                rows={4}
                maxLength={600}
                placeholder="Présente-toi en quelques lignes…"
                className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 resize-none"
              />
              <p className="text-xs text-white/30 text-right mt-1">{profile.bio.length}/600</p>
            </div>
          </div>
        </Section>

        {/* ── SECTION : Localisation ── */}
        <Section title="Localisation" icon={<MapPin size={18} />}>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/70 mb-2 block">Ville</label>
              <input
                value={profile.location}
                onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                placeholder="Ex : Paris, Lyon, Marseille…"
                className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-2 block">
                Rayon d&apos;intervention — <span className="text-emerald-400">{profile.radiusKm ?? 0} km</span>
              </label>
              <input
                type="range"
                min={0}
                max={500}
                step={10}
                value={profile.radiusKm ?? 0}
                onChange={e => setProfile(p => ({ ...p, radiusKm: parseInt(e.target.value) }))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>0 km</span>
                <span>500 km</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── SECTION : Spécialités ── */}
        <Section title="Spécialités" icon={<Briefcase size={18} />}>
          <p className="text-xs text-white/45 mb-1">Sélectionne tout ce qui te correspond</p>
          <TagSelector
            options={SPECIALTIES_BY_ROLE[role] || SPECIALTIES_BY_ROLE.ARTIST}
            selected={profile.specialties}
            onChange={v => setProfile(p => ({ ...p, specialties: v }))}
          />
        </Section>

        {/* ── SECTION : Styles (Artistes uniquement) ── */}
        {role === 'ARTIST' && (
          <Section title="Styles musicaux" icon={<Music size={18} />}>
            <p className="text-xs text-white/45 mb-1">Tes univers musicaux</p>
            <TagSelector
              options={STYLES}
              selected={profile.styles}
              onChange={v => setProfile(p => ({ ...p, styles: v }))}
            />
          </Section>
        )}

        {/* ── SECTION : Médias (Artistes, Organisateurs & Prestataires) ── */}
        {(role === 'ARTIST' || role === 'PROVIDER' || role === 'ORGANIZER') && (
          <Section title="Liens médias" icon={<Music size={18} />}>
            <div className="space-y-4">
              {role === 'ARTIST' && (
                <div>
                  <label className="text-sm text-white/70 mb-2 flex items-center gap-1.5">
                    <span className="text-orange-400">☁</span> SoundCloud
                  </label>
                  <input
                    value={profile.soundcloudUrl}
                    onChange={e => setProfile(p => ({ ...p, soundcloudUrl: e.target.value }))}
                    placeholder="https://soundcloud.com/ton-profil"
                    className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <div className="mt-2 border-t border-white/8 pt-2">
                    <Toggle
                      value={profile.showSoundcloud}
                      onChange={v => setProfile(p => ({ ...p, showSoundcloud: v }))}
                      label="Afficher le player SoundCloud sur mon profil"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm text-white/70 mb-2 flex items-center gap-1.5">
                  <span className="text-red-400">▶</span> Vidéo de prestation (YouTube / Vimeo)
                </label>
                <input
                  value={profile.youtubeUrl}
                  onChange={e => setProfile(p => ({ ...p, youtubeUrl: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>
          </Section>
        )}

        {/* ── Section Utilisateurs bloqués ── */}
        <Section title="Utilisateurs bloqués" icon={<ShieldAlert size={18} />}>
          {blockedUsers.length === 0 ? (
            <p className="text-sm text-white/40">Vous n&apos;avez bloqué aucun utilisateur.</p>
          ) : (
            <ul className="space-y-3">
              {blockedUsers.map(u => {
                const displayName =
                  u.pseudo ||
                  [u.firstName, u.lastName].filter(Boolean).join(' ') ||
                  'Utilisateur'
                const avatarSrc = u.avatar || '/default-avatar.png'
                return (
                  <li key={u.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden">
                      <Image src={avatarSrc} alt={displayName} fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{displayName}</p>
                      <p className="text-xs text-white/40">{u.role}</p>
                    </div>
                    <button
                      onClick={() => handleUnblock(u.id)}
                      disabled={unblockingId === u.id}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition disabled:opacity-40"
                    >
                      <ShieldOff size={13} />
                      {unblockingId === u.id ? 'En cours…' : 'Débloquer'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>

      </div>
    </div>
  )
}
