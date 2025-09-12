'use client'

/* eslint-disable @next/next/no-img-element */
import React, { useCallback, useEffect, useMemo, useState } from 'react'

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

  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  )

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
        headers,
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
  }, [headers, token])

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
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        show('✅ Enregistré')
      } catch (e) {
        console.error(e)
        show('❌ Erreur de sauvegarde.')
      }
    },
    [headers, settings, token]
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
          headers, // surtout pas de Content-Type ici
          body: fd,
        })
        if (!res.ok) throw new Error(`UPLOAD ${res.status}`)
        const data = (await res.json()) as { url?: string }
        const url = data.url || ''
        await saveAll({ [field]: url } as Partial<AdminSettings>)
      } catch (e) {
        console.error(e)
        show("❌ Échec de l'upload.")
      }
    },
    [headers, saveAll, token]
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
        <ImagePicker
          label="Logo — Header"
          url={settings.headerLogoUrl}
          onPick={(f) => void uploadAndSet('headerLogoUrl', f)}
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