'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'

type RoleTag = string

type UserLite = {
  id: number
  name?: string
  role?: 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'
  profile?: { id: number }
}

type Profile = {
  id: number
  userId: number
  avatar?: string | null
  banner?: string | null
  bio?: string
  location?: string | null
  country?: string | null
  specialties?: string[]
  styles?: string[]
}

type UploadResponse = { url: string; public_id?: string }

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

/* -------------------- helpers -------------------- */
async function uploadToCloudinary(file: File, folder: 'avatars' | 'banners' | 'media'): Promise<UploadResponse> {
  if (!API_BASE) throw new Error('NEXT_PUBLIC_API_URL manquant')
  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', folder)
  fd.append('type', 'image')
  const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.details || 'UPLOAD_FAILED')
  }
  return res.json()
}

async function saveProfilePart(profileId: number, token: string, fields: Partial<Profile>) {
  if (!API_BASE) throw new Error('NEXT_PUBLIC_API_URL manquant')
  const res = await fetch(`${API_BASE}/api/profile/${profileId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(fields),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || 'PROFILE_SAVE_FAILED')
  }
}

/* -------------------- page -------------------- */
export default function ArtistSettingsPage() {
  // auth
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserLite | null>(null)

  // profile
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  // local editable states
  const [avatar, setAvatar] = useState<string | undefined>(undefined)
  const [banner, setBanner] = useState<string | undefined>(undefined)
  const [bio, setBio] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [country, setCountry] = useState<string>('')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [styles, setStyles] = useState<string[]>([])

  const bannerInputRef = useRef<HTMLInputElement | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState<{ avatar?: boolean; banner?: boolean }>({})

  const roleOptions = useMemo(
    () => ['DJ', 'Chanteur', 'Saxophoniste', 'Danseur', 'Guitariste', 'Violoniste', 'Photographe'],
    []
  )
  const styleSuggestions = useMemo(
    () => ['R&B', 'Latino', 'Rap US', 'Rap FR', 'Deep House', 'Electro', 'Techno', 'Afrobeat'],
    []
  )

  // init auth + fetch
  useEffect(() => {
    try {
      const tk = localStorage.getItem('token')
      const uStr = localStorage.getItem('user')
      if (tk) setToken(tk)
      if (uStr) {
        const u: UserLite = JSON.parse(uStr)
        setUser(u)
        const uid = typeof u.id === 'string' ? parseInt(u.id as unknown as string, 10) : u.id
        if (API_BASE && uid) {
          ;(async () => {
            try {
              const r = await fetch(`${API_BASE}/api/profile/user/${uid}`)
              const data = await r.json()
              const p: Profile | undefined = data?.profile
              if (p) {
                setProfile(p)
                setAvatar(p.avatar || undefined)
                setBanner(p.banner || undefined)
                setBio(p.bio || '')
                setLocation(p.location || '')
                setCountry(p.country || '')
                setSpecialties(p.specialties || [])
                setStyles(p.styles || [])
              }
            } catch {
              setError("Impossible de charger le profil.")
            } finally {
              setLoading(false)
            }
          })()
        } else {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }, [])

  const profileId = profile?.id ?? user?.profile?.id ?? null

  /* -------------------- actions -------------------- */
  const handleUpload = async (kind: 'avatar' | 'banner', file?: File) => {
    if (!file) return
    try {
      setUploading(s => ({ ...s, [kind]: true }))
      const { url } = await uploadToCloudinary(file, kind === 'avatar' ? 'avatars' : 'banners')
      if (kind === 'avatar') setAvatar(url)
      else setBanner(url)
      setOkMsg(`${kind === 'avatar' ? 'Photo de profil' : 'Bannière'} chargée ✅ (pense à enregistrer)`)
    } catch (e) {
      setError("Échec de l'upload.")
    } finally {
      setUploading(s => ({ ...s, [kind]: false }))
    }
  }

  const saveAll = async () => {
    setError(null)
    setOkMsg(null)
    if (!token || !profileId) {
      setError('Session invalide. Reconnecte-toi.')
      return
    }
    try {
      setSaving(true)
      await saveProfilePart(profileId, token, {
        avatar,
        banner,
        bio,
        location,
        country,
        specialties,
        styles,
      })
      setOkMsg('Profil enregistré ✅')
    } catch (e) {
      setError('Sauvegarde impossible.')
    } finally {
      setSaving(false)
    }
  }

  const toggleChip = (value: string, list: string[], setList: (x: string[]) => void) => {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value])
  }

  /* -------------------- UI -------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-white/80">Chargement…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Banner */}
      <div className="relative h-52 md:h-64 lg:h-72 bg-neutral-900">
        {banner ? (
          <Image src={banner} alt="Bannière" fill className="object-cover opacity-95" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-neutral-900 to-neutral-800" />
        )}

        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-3 right-4 flex gap-2">
          <button
            onClick={() => bannerInputRef.current?.click()}
            className="px-3 py-1.5 text-sm rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20"
            disabled={uploading.banner}
            title="Changer la bannière"
          >
            {uploading.banner ? 'Envoi…' : 'Changer la bannière'}
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => handleUpload('banner', e.target.files?.[0])}
          />
        </div>

        {/* avatar over banner */}
        <div className="absolute -bottom-10 left-6 flex items-end gap-4">
          <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden ring-4 ring-black/70 border border-white/20 bg-black">
            {avatar ? (
              <Image src={avatar} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-white/60">Avatar</div>
            )}
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="px-3 py-1.5 text-sm rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20"
            disabled={uploading.avatar}
            title="Changer la photo"
          >
            {uploading.avatar ? 'Envoi…' : 'Changer la photo'}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => handleUpload('avatar', e.target.files?.[0])}
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-14 pb-20 space-y-10">
        {/* messages */}
        {(error || okMsg) && (
          <div className={`rounded-xl border p-3 ${error ? 'border-red-500/40 bg-red-500/10' : 'border-emerald-500/40 bg-emerald-500/10'}`}>
            <p className="text-sm">{error || okMsg}</p>
          </div>
        )}

        {/* identité / localisation */}
        <section className="rounded-2xl bg-neutral-900/60 border border-white/10 p-5">
          <h2 className="text-lg font-semibold mb-4">Identité & localisation</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-white/70">Ville</label>
              <input
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Marseille"
              />
            </div>
            <div>
              <label className="text-sm text-white/70">Pays</label>
              <input
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="France"
              />
            </div>
          </div>
        </section>

        {/* bio */}
        <section className="rounded-2xl bg-neutral-900/60 border border-white/10 p-5">
          <h2 className="text-lg font-semibold mb-3">Description</h2>
          <textarea
            className="w-full rounded-lg bg-black/40 border border-white/10 p-3 min-h-[120px]"
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Présente-toi, ton parcours, tes prestations…"
          />
        </section>

        {/* spécialités */}
        <section className="rounded-2xl bg-neutral-900/60 border border-white/10 p-5">
          <h2 className="text-lg font-semibold mb-3">Spécialités</h2>
          <div className="flex flex-wrap gap-2">
            {roleOptions.map(opt => {
              const active = specialties.includes(opt)
              return (
                <button
                  key={opt}
                  onClick={() => toggleChip(opt, specialties, setSpecialties)}
                  className={`px-3 py-1.5 rounded-full border ${
                    active
                      ? 'bg-pink-600 text-white border-pink-500'
                      : 'bg-white/5 border-white/15 hover:bg-white/10'
                  }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
          {specialties.length > 0 && (
            <p className="text-xs text-white/60 mt-2">Sélectionnées : {specialties.join(', ')}</p>
          )}
        </section>

        {/* styles musicaux */}
        <section className="rounded-2xl bg-neutral-900/60 border border-white/10 p-5">
          <h2 className="text-lg font-semibold mb-3">Styles musicaux</h2>
          <div className="flex flex-wrap gap-2">
            {styleSuggestions.map(s => {
              const active = styles.includes(s)
              return (
                <button
                  key={s}
                  onClick={() => toggleChip(s, styles, setStyles)}
                  className={`px-3 py-1.5 rounded-full border ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-white/5 border-white/15 hover:bg-white/10'
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>

          {/* ajout manuel */}
          <AddChip
            onAdd={(val) => {
              const v = val.trim()
              if (v && !styles.includes(v)) setStyles([...styles, v])
            }}
          />
          {styles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {styles.map(s => (
                <span key={s} className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/15">
                  {s}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* save */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={saveAll}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* petit composant pour ajouter un style à la volée */
function AddChip({ onAdd }: { onAdd: (val: string) => void }) {
  const [val, setVal] = useState('')
  return (
    <div className="mt-3 flex gap-2">
      <input
        className="flex-1 max-w-xs rounded-lg bg-black/40 border border-white/10 px-3 py-2"
        placeholder="Ajouter un style (ex: Funk)"
        value={val}
        onChange={e => setVal(e.target.value)}
      />
      <button
        onClick={() => {
          onAdd(val)
          setVal('')
        }}
        className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15"
      >
        Ajouter
      </button>
    </div>
  )
}