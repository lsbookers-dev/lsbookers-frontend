'use client'

import { useEffect, useState } from 'react'

type SiteSettings = {
  mainColor: string
  secondaryColor: string
  welcomeText: string
  bannerUrl: string            // legacy / héros (landing)
  loginBgUrl?: string
  registerBgUrl?: string
  landingBgUrl?: string
  headerLogoUrl?: string
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

async function uploadImage(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', 'admin')
  fd.append('type', 'image')
  const r = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd })
  if (!r.ok) throw new Error('UPLOAD_FAILED')
  return r.json() as Promise<{ url: string }>
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SiteSettings>({
    mainColor: '#ff2f87',
    secondaryColor: '#7c3aed',
    welcomeText: '',
    bannerUrl: '',
    loginBgUrl: '',
    registerBgUrl: '',
    landingBgUrl: '',
    headerLogoUrl: '',
  })
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    const run = async () => {
      setLoading(true)
      try {
        const r = await fetch(`${API_BASE}/api/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        if (!r.ok) throw new Error('HTTP ' + r.status)
        const data = await r.json()
        setForm((prev) => ({ ...prev, ...data }))
      } catch {
        // fallback silent
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onUpload = async (name: keyof SiteSettings, file?: File | null) => {
    if (!file) return
    try {
      const { url } = await uploadImage(file)
      setForm((f) => ({ ...f, [name]: url }))
    } catch {
      alert('Échec upload.')
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    const token = localStorage.getItem('token') || ''
    try {
      const r = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      setMsg('✅ Modifications enregistrées')
    } catch {
      setMsg('❌ Erreur lors de la mise à jour')
    }
  }

  if (loading) return <p>Chargement…</p>

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Paramètres du site</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Couleurs */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Couleur principale</label>
            <input type="color" name="mainColor" value={form.mainColor} onChange={onChange} className="w-16 h-10" />
          </div>
          <div>
            <label className="block text-sm mb-1">Couleur secondaire</label>
            <input type="color" name="secondaryColor" value={form.secondaryColor} onChange={onChange} className="w-16 h-10" />
          </div>
        </div>

        {/* Textes */}
        <div>
          <label className="block text-sm mb-1">Texte d’accueil (landing)</label>
          <textarea name="welcomeText" value={form.welcomeText} onChange={onChange} className="w-full p-2 rounded bg-neutral-900 border border-white/10" />
        </div>

        {/* Images */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Uploader
            label="Logo du header"
            url={form.headerLogoUrl || ''}
            onFile={(f) => onUpload('headerLogoUrl', f)}
            placeholder="/logo.svg"
          />
          <Uploader
            label="Fond landing"
            url={form.landingBgUrl || form.bannerUrl || ''}
            onFile={(f) => onUpload('landingBgUrl', f)}
            placeholder="/bg-landing.jpg"
          />
          <Uploader
            label="Fond login"
            url={form.loginBgUrl || ''}
            onFile={(f) => onUpload('loginBgUrl', f)}
            placeholder="/bg-login.jpg"
          />
          <Uploader
            label="Fond register"
            url={form.registerBgUrl || ''}
            onFile={(f) => onUpload('registerBgUrl', f)}
            placeholder="/bg-register.jpg"
          />
        </div>

        <div className="pt-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded">
            Enregistrer
          </button>
        </div>
      </form>

      {msg && <p className="mt-4">{msg}</p>}
    </div>
  )
}

/* --- petit composant uploader --- */
function Uploader({
  label,
  url,
  onFile,
  placeholder,
}: {
  label: string
  url: string
  onFile: (file?: File | null) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm mb-2">{label}</label>
      <div className="rounded-lg border border-white/10 bg-neutral-900 p-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="w-full h-28 object-cover rounded mb-2" />
        ) : (
          <div className="w-full h-28 rounded bg-black/30 border border-white/10 grid place-items-center text-xs text-white/40 mb-2">
            {placeholder || 'Aperçu'}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
          className="block text-sm"
        />
      </div>
    </div>
  )
}