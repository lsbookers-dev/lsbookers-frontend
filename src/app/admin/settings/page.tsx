// src/app/admin/settings/page.tsx
'use client'

/* eslint-disable @next/next/no-img-element */
import React, { useCallback, useEffect, useState } from 'react'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

type AdminSettings = {
  welcomeText: string
  landingBgUrl: string
  loginBgUrl: string
  registerBgUrl: string
  headerLogoUrl: string
}

const EMPTY_SETTINGS: AdminSettings = {
  welcomeText: '',
  landingBgUrl: '',
  loginBgUrl: '',
  registerBgUrl: '',
  headerLogoUrl: '',
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(EMPTY_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string>('')

  // Token une fois (pas de re-render infini)
  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem('token') : null

  const show = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 2500)
  }

  /* -------- Charger les settings -------- */
  const load = useCallback(async () => {
    if (!API_BASE || !token) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as Partial<AdminSettings> | null

      setSettings({
        welcomeText: data?.welcomeText ?? '',
        landingBgUrl: data?.landingBgUrl ?? '',
        loginBgUrl: data?.loginBgUrl ?? '',
        registerBgUrl: data?.registerBgUrl ?? '',
        headerLogoUrl: data?.headerLogoUrl ?? '',
      })
    } catch (err) {
      console.error(err)
      show('❌ Erreur de chargement des paramètres.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  /* -------- Sauvegarder tout -------- */
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
        show('✅ Paramètres enregistrés')
      } catch (err) {
        console.error(err)
        show('❌ Erreur lors de la sauvegarde')
      }
    },
    [settings, token]
  )

  /* -------- Upload image -> Cloudinary (via /api/upload) -------- */
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
          headers: token ? { Authorization: `Bearer ${token}` } : undefined, // pas de Content-Type avec FormData
          body: fd,
        })
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
        const data = (await res.json()) as { url?: string }
        const url = data?.url ?? ''
        await saveAll({ [field]: url } as Partial<AdminSettings>)
      } catch (err) {
        console.error(err)
        show('❌ Erreur lors de l’upload')
      }
    },
    [token, saveAll]
  )

  if (!token) {
    return (
      <div className="p-8 text-white">
        <h2 className="text-xl font-semibold mb-2">Paramètres du site</h2>
        <p className="text-white/70">Vous devez être connecté pour accéder à cette page.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 text-white">
        <p className="text-white/70">Chargement…</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 text-white">
      <h2 className="text-2xl font-bold mb-6">Paramètres du site</h2>

      {/* Texte d’accueil */}
      <section className="mb-8 rounded-2xl border border-white/10 p-4 bg-black/30">
        <h3 className="text-lg font-semibold mb-2">Texte d’accueil (landing)</h3>
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
            className="px-4 py-2 rounded bg-white/10 border border-white/15 hover:bg-white/20"
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
          onPick={(file) => void uploadAndSet('landingBgUrl', file)}
        />
        <ImagePicker
          label="Fond — Login"
          url={settings.loginBgUrl}
          onPick={(file) => void uploadAndSet('loginBgUrl', file)}
        />
        <ImagePicker
          label="Fond — Register"
          url={settings.registerBgUrl}
          onPick={(file) => void uploadAndSet('registerBgUrl', file)}
        />
        <ImagePicker
          label="Logo — Header"
          url={settings.headerLogoUrl}
          onPick={(file) => void uploadAndSet('headerLogoUrl', file)}
        />
      </div>

      {notice && <p className="mt-6 text-sm text-white/70">{notice}</p>}
    </div>
  )
}

/* ---------- Composant image picker ---------- */
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

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
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
        <label className="px-3 py-2 rounded bg-white/10 border border-white/15 hover:bg-white/20 cursor-pointer">
          {busy ? 'Envoi…' : 'Choisir un fichier'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
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