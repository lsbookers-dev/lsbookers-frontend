// src/app/admin/settings/page.tsx
'use client'

/* eslint-disable @next/next/no-img-element */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import CropModal from '@/components/CropModal'

type AdminSettings = {
  welcomeText: string
  landingBgUrl: string
  loginBgUrl: string
  registerBgUrl: string
  headerLogoUrl: string
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

const EMPTY: AdminSettings = {
  welcomeText: '',
  landingBgUrl: '',
  loginBgUrl: '',
  registerBgUrl: '',
  headerLogoUrl: '',
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem('token') : null

  const show = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 2000)
  }

  const load = useCallback(async () => {
    if (!API_BASE || !token) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        headers: token ? ({ Authorization: `Bearer ${token}` } as HeadersInit) : undefined,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as Partial<AdminSettings>
      setSettings({
        welcomeText: data.welcomeText ?? '',
        landingBgUrl: data.landingBgUrl ?? '',
        loginBgUrl: data.loginBgUrl ?? '',
        registerBgUrl: data.registerBgUrl ?? '',
        headerLogoUrl: data.headerLogoUrl ?? '',
      })
    } catch (e) {
      console.error(e)
      show('❌ Erreur de chargement.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const saveAll = useCallback(
    async (next?: Partial<AdminSettings>) => {
      if (!API_BASE || !token) return
      const body: AdminSettings = { ...settings, ...(next ?? {}) }
      setSettings(body) // UI optimiste
      try {
        const res = await fetch(`${API_BASE}/api/admin/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        show('✅ Enregistré')
      } catch (e) {
        console.error(e)
        show('❌ Erreur de sauvegarde.')
      }
    },
    [settings, token]
  )

  const uploadAndSet = useCallback(
    async (field: keyof AdminSettings, file: File) => {
      if (!API_BASE || !token) return
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'site')
      fd.append('type', 'image')
      try {
        const res = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          headers: token ? ({ Authorization: `Bearer ${token}` } as HeadersInit) : undefined,
          body: fd,
        })
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({})) as { error?: string; details?: string }
          throw new Error(`UPLOAD ${res.status} — ${errBody.error ?? ''} ${errBody.details ?? ''}`)
        }
        const data = (await res.json()) as { url?: string }
        const url = data.url || ''
        if (field === 'headerLogoUrl') sessionStorage.removeItem('site_logo')
        await saveAll({ [field]: url } as Partial<AdminSettings>)
      } catch (e) {
        console.error(e)
        show("❌ Échec de l'upload.")
      }
    },
    [token, saveAll]
  )

  if (!token) {
    return (
      <div className="p-6 text-white">
        <p>Connectez-vous pour accéder aux paramètres.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 text-white">
        <p className="text-white/70">Chargement…</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Paramètres du site</h1>

      {/* Welcome text */}
      <section className="mb-8 rounded-2xl border border-white/10 p-4 bg-black/30">
        <h2 className="text-lg font-semibold mb-2">Texte d’accueil (landing)</h2>
        <textarea
          rows={4}
          className="w-full bg-black/40 border border-white/10 rounded p-3"
          value={settings.welcomeText}
          onChange={(e) =>
            setSettings((s) => ({ ...s, welcomeText: e.target.value }))
          }
        />
        <div className="mt-3">
          <button
            onClick={() => void saveAll()}
            className="px-4 py-2 rounded bg-white/10 hover:bg-white/20"
          >
            Enregistrer
          </button>
        </div>
      </section>

      {/* Images */}
      <div className="space-y-6">
        <ImagePicker
          label="Fond — Landing"
          url={settings.landingBgUrl}
          onPick={(f) => void uploadAndSet('landingBgUrl', f)}
        />
        <ImagePicker
          label="Fond — Login"
          url={settings.loginBgUrl}
          onPick={(f) => void uploadAndSet('loginBgUrl', f)}
        />
        <ImagePicker
          label="Fond — Register"
          url={settings.registerBgUrl}
          onPick={(f) => void uploadAndSet('registerBgUrl', f)}
        />
        <LogoPicker
          url={settings.headerLogoUrl}
          onUpload={(f) => void uploadAndSet('headerLogoUrl', f)}
        />
      </div>

      {notice && <p className="mt-6 text-sm text-white/70">{notice}</p>}
    </div>
  )
}

function LogoPicker({
  url,
  onUpload,
}: {
  url: string
  onUpload: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => setCropSrc(ev.target?.result as string)
    reader.readAsDataURL(f)
    e.currentTarget.value = ''
  }

  const handleConfirm = async (blob: Blob) => {
    setCropSrc(null)
    setBusy(true)
    try {
      await onUpload(new File([blob], 'logo.jpg', { type: 'image/jpeg' }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {cropSrc && (
        <CropModal
          src={cropSrc}
          aspectRatio={1}
          displayWidth={320}
          shape="rect"
          maxZoom={6}
          onConfirm={handleConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
      <section className="rounded-2xl border border-purple-500/30 p-4 bg-black/30">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h4 className="font-semibold text-purple-300">Logo — Header</h4>
            <p className="text-xs text-white/50 mt-0.5">Recadrage carré automatique</p>
            {url && <p className="text-[10px] text-white/30 break-all mt-1">{url}</p>}
          </div>
          <label className={`px-4 py-2 rounded-xl cursor-pointer font-medium text-sm transition ${busy ? 'bg-white/10 opacity-60' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}>
            {busy ? 'Envoi…' : 'Choisir un logo'}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={busy} />
          </label>
        </div>
        {url && (
          <div className="mt-4 flex items-center gap-4">
            <img src={url} alt="Logo actuel" className="h-20 w-20 rounded-xl border border-white/10 object-contain bg-black" />
            <div className="text-xs text-white/40">
              <p>Logo actuel</p>
              <p className="mt-1 text-white/25">Choisir un nouveau fichier pour remplacer</p>
            </div>
          </div>
        )}
      </section>
    </>
  )
}

function ImagePicker({
  label,
  url,
  onPick,
}: {
  label: string
  url: string
  onPick: (file: File) => void
}) {
  const [busy, setBusy] = useState(false)

  const handle: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      setBusy(true)
      await onPick(f)
    } finally {
      setBusy(false)
      e.currentTarget.value = ''
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 p-4 bg-black/30">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h4 className="font-medium">{label}</h4>
          <p className="text-xs text-white/50 break-all">{url || '—'}</p>
        </div>
        <label className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer">
          {busy ? 'Envoi…' : 'Choisir un fichier'}
          <input type="file" accept="image/*" className="hidden" onChange={handle} />
        </label>
      </div>
      {url && (
        <img
          src={url}
          alt={label}
          className="mt-3 max-h-40 rounded border border-white/10 object-cover"
        />
      )}
    </section>
  )
}