'use client'

// Admin › Réglages (choix D1 d'Antho, 31/10/2026) : trois sous-onglets courts, chacun avec son bouton
// « Enregistrer » — Apparence du site (annonce, fonds, logos), Tarifs et règles, Services payants.
// Le « texte d'accueil » de la landing, affiché nulle part, a été retiré.

/* eslint-disable @next/next/no-img-element */
import React, { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import CropModal from '@/components/CropModal'
import AnnouncementSettings from '@/components/admin/AnnouncementSettings'
import { ExtrasTab, RulesTab } from '@/components/admin/billingTabs'
import { API, BTN, CARD, PageHeader, Spinner, SubTabs } from '@/components/admin/ui'
import { useFeedback } from '@/components/ui/Feedback'
import { apiFetch } from '@/utils/auth'
import { uploadToStorage } from '@/utils/directUpload'

type ImageField = 'landingBgUrl' | 'loginBgUrl' | 'registerBgUrl' | 'headerLogoUrl' | 'landingLogoUrl'
type Images = Record<ImageField, string>
type Tab = 'look' | 'rules' | 'services'

const FOLDER: Record<ImageField, string> = {
  landingBgUrl: 'banners', loginBgUrl: 'banners', registerBgUrl: 'banners', headerLogoUrl: 'logos', landingLogoUrl: 'logos',
}

function LookTab() {
  const { notify } = useFeedback()
  const [images, setImages] = useState<Images | null>(null)

  useEffect(() => {
    apiFetch(`${API}/api/admin/settings`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => setImages({
        landingBgUrl: d?.landingBgUrl || '', loginBgUrl: d?.loginBgUrl || '', registerBgUrl: d?.registerBgUrl || '',
        headerLogoUrl: d?.headerLogoUrl || '', landingLogoUrl: d?.landingLogoUrl || '',
      }))
      .catch(() => setImages({ landingBgUrl: '', loginBgUrl: '', registerBgUrl: '', headerLogoUrl: '', landingLogoUrl: '' }))
  }, [])

  // Envoi de l'image puis enregistrement de ce seul champ (le serveur ne touche pas aux autres)
  const upload = useCallback(async (field: ImageField, file: File) => {
    try {
      const res = await uploadToStorage(file, { folder: FOLDER[field] })
      if (!res.ok) throw new Error()
      const url = ((await res.json()) as { url?: string }).url || ''
      const save = await apiFetch(`${API}/api/admin/settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: url }),
      })
      if (!save.ok) throw new Error()
      if (field === 'headerLogoUrl') sessionStorage.removeItem('site_logo')
      setImages(prev => (prev ? { ...prev, [field]: url } : prev))
      notify('Image enregistrée (visible sur le site sous une minute).')
    } catch {
      notify("L'image n'a pas pu être enregistrée.", 'error')
    }
  }, [notify])

  if (!images) return <Spinner />
  return (
    <div className="space-y-6">
      <AnnouncementSettings />
      <section>
        <h2 className="mb-3 text-sm font-semibold">Fonds des pages publiques</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <ImagePicker label="Page d'accueil" url={images.landingBgUrl} onPick={f => upload('landingBgUrl', f)} />
          <ImagePicker label="Connexion" url={images.loginBgUrl} onPick={f => upload('loginBgUrl', f)} />
          <ImagePicker label="Inscription" url={images.registerBgUrl} onPick={f => upload('registerBgUrl', f)} />
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold">Logos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <LogoPicker label="Logo de l'en-tête du site" url={images.headerLogoUrl} onUpload={f => upload('headerLogoUrl', f)} />
          <LogoPicker label="Logo des pages d'accueil, connexion et inscription" url={images.landingLogoUrl} onUpload={f => upload('landingLogoUrl', f)} aspectRatio={1} />
        </div>
      </section>
    </div>
  )
}

function LogoPicker({ label, url, onUpload, aspectRatio = 3 }: {
  label: string; url: string; onUpload: (file: File) => Promise<void>; aspectRatio?: number
}) {
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0]
    e.currentTarget.value = ''
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => setCropSrc(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleConfirm = async (blob: Blob) => {
    setCropSrc(null)
    setBusy(true)
    try { await onUpload(new File([blob], 'logo.jpg', { type: 'image/jpeg' })) } finally { setBusy(false) }
  }

  return (
    <>
      {cropSrc && (
        <CropModal src={cropSrc} aspectRatio={aspectRatio} displayWidth={480} shape="rect" maxZoom={6}
          onConfirm={handleConfirm} onCancel={() => setCropSrc(null)} />
      )}
      <div className={CARD}>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted">{aspectRatio === 1 ? 'Recadrage carré' : 'Recadrage en largeur (3 pour 1)'}</p>
        <div className="mt-4 flex h-20 items-center justify-center rounded-xl border border-line bg-black">
          {url ? <img src={url} alt="" className="max-h-16 max-w-[80%] object-contain" /> : <span className="text-xs text-muted">Aucun logo</span>}
        </div>
        <label className={`${BTN} mt-4 inline-block cursor-pointer ${busy ? 'opacity-50' : ''}`}>
          {busy ? 'Envoi…' : 'Remplacer'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={busy} />
        </label>
      </div>
    </>
  )
}

function ImagePicker({ label, url, onPick }: { label: string; url: string; onPick: (file: File) => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const handle: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const input = e.currentTarget
    const f = input.files?.[0]
    if (!f) return
    setBusy(true)
    try { await onPick(f) } finally { setBusy(false); input.value = '' }
  }
  return (
    <div className={CARD}>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-line bg-black">
        {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-xs text-muted">Aucune image</span>}
      </div>
      <label className={`${BTN} mt-4 inline-block cursor-pointer ${busy ? 'opacity-50' : ''}`}>
        {busy ? 'Envoi…' : 'Remplacer'}
        <input type="file" accept="image/*" className="hidden" onChange={handle} disabled={busy} />
      </label>
    </div>
  )
}

function SettingsContent() {
  const params = useSearchParams()
  const router = useRouter()
  const initial = params.get('tab') as Tab
  const [tab, setTab] = useState<Tab>(['look', 'rules', 'services'].includes(initial) ? initial : 'look')
  const select = (t: Tab) => { setTab(t); router.replace(`/admin/settings?tab=${t}`) }
  return (
    <div>
      <PageHeader title="Réglages" subtitle="Apparence du site, tarifs et règles, services payants." />
      <SubTabs<Tab> value={tab} onChange={select} tabs={[
        { key: 'look', label: 'Apparence du site' },
        { key: 'rules', label: 'Tarifs et règles' },
        { key: 'services', label: 'Services payants' },
      ]} />
      {tab === 'look' && <LookTab />}
      {tab === 'rules' && <RulesTab />}
      {tab === 'services' && <ExtrasTab />}
    </div>
  )
}

export default function AdminSettingsPage() {
  return <Suspense fallback={null}><SettingsContent /></Suspense>
}
