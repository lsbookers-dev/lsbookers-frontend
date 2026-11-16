'use client'

/**
 * Albums d'un profil (refait le 16/11/2026, demande d'Antho) :
 * on crée l'album, puis on y ajoute ses publications, celles où l'on est identifié,
 * ou des photos envoyées depuis l'appareil. Clic sur un élément : vue agrandie.
 */

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Check, ImagePlus, Lock, Plus, Trash2, X } from 'lucide-react'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { uploadToStorage } from '@/utils/directUpload'
import { useFeedback, apiErrorMessage } from '@/components/ui/Feedback'
import PublicationModal from './PublicationModal'
import type { PubCardData } from './PublicationCard'

type AlbumSummary = { id: number; title: string; description?: string | null; coverUrl?: string | null; itemCount: number; isPrivate?: boolean }
type AlbumItem = { id: number; mediaUrl?: string | null; mediaType?: string | null; caption?: string | null; publication?: PubCardData | null }
type AlbumDetail = { id: number; title: string; description?: string | null; isPrivate: boolean; items: AlbumItem[] }
type Source = 'mine' | 'tagged' | 'upload'

type Props = {
  profileId: number
  isOwner?: boolean
  token?: string
  accent?: string
  /** Gardé pour compatibilité : les publications sont maintenant chargées par la fenêtre d'ajout */
  publications?: PubCardData[]
}

const thumbOf = (item: AlbumItem) => item.publication?.media || item.mediaUrl || ''
const isVideo = (url: string, type?: string | null) => type === 'video' || type === 'VIDEO' || /\.(mp4|mov|webm)(\?|$)/i.test(url)

export default function AlbumsTab({ profileId, isOwner = false }: Props) {
  const { notify, confirm } = useFeedback()
  const [albums, setAlbums] = useState<AlbumSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPrivate, setNewPrivate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState<AlbumDetail | null>(null)
  const [adding, setAdding] = useState(false)
  const [viewPub, setViewPub] = useState<PubCardData | null>(null)
  const [viewMedia, setViewMedia] = useState<AlbumItem | null>(null)

  const loadAlbums = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(apiUrl(isOwner ? 'albums/mine' : `albums/profile/${profileId}`))
      setAlbums(res.ok ? ((await res.json()).albums ?? []) : [])
    } catch { setAlbums([]) }
    finally { setLoading(false) }
  }, [profileId, isOwner])

  useEffect(() => { loadAlbums() }, [loadAlbums])

  const openAlbum = async (id: number) => {
    const res = await apiFetch(apiUrl(`albums/${id}`)).catch(() => null)
    if (!res?.ok) { notify('Impossible de charger l’album.', 'error'); return }
    setOpen((await res.json()).album ?? null)
  }

  const createAlbum = async () => {
    if (!newTitle.trim() || creating) return
    setCreating(true)
    try {
      const res = await apiFetch(apiUrl('albums'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() || null, isPrivate: newPrivate }),
      })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Impossible de créer l’album.'), 'error'); return }
      const d = await res.json()
      setNewTitle(''); setNewDesc(''); setNewPrivate(false); setShowCreate(false)
      await loadAlbums()
      // L'album créé s'ouvre directement, avec la fenêtre d'ajout
      const id = d.album?.id ?? d.id
      if (id) { await openAlbum(id); setAdding(true) }
    } finally { setCreating(false) }
  }

  const deleteAlbum = async (album: { id: number }) => {
    if (!(await confirm({ title: 'Supprimer cet album ?', message: 'Les publications qu’il contient ne sont pas supprimées.', danger: true }))) return
    const res = await apiFetch(apiUrl(`albums/${album.id}`), { method: 'DELETE' }).catch(() => null)
    if (!res?.ok) { notify('Impossible de supprimer l’album.', 'error'); return }
    setAlbums(prev => prev.filter(a => a.id !== album.id))
    setOpen(null)
  }

  const removeItem = async (item: AlbumItem) => {
    if (!open) return
    const res = await apiFetch(apiUrl(`albums/${open.id}/items/${item.id}`), { method: 'DELETE' }).catch(() => null)
    if (!res?.ok) { notify('Impossible de retirer cet élément.', 'error'); return }
    setOpen(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== item.id) } : prev)
    setAlbums(prev => prev.map(a => a.id === open.id ? { ...a, itemCount: Math.max(0, a.itemCount - 1) } : a))
  }

  if (loading) return <div className="py-16 text-center text-sm text-white/30">Chargement…</div>

  /* ── Album ouvert ── */
  if (open) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => { setOpen(null); loadAlbums() }} className="flex items-center gap-1.5 text-sm text-white/60 transition hover:text-white">
            <ArrowLeft size={15} /> Tous les albums
          </button>
          {isOwner && (
            <div className="flex gap-2">
              <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-strong">
                <Plus size={13} /> Ajouter
              </button>
              <button type="button" onClick={() => deleteAlbum(open)} aria-label="Supprimer l’album" className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-white/45 transition hover:border-red-400/40 hover:text-red-300">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">{open.title}{open.isPrivate && <Lock size={14} className="text-white/40" />}</h3>
          {open.description && <p className="mt-1 text-sm text-white/55">{open.description}</p>}
        </div>

        {open.items.length === 0 ? (
          <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center">
            <ImagePlus size={26} className="text-white/30" />
            <p className="text-sm text-white/55">Cet album est vide.</p>
            {isOwner && <button type="button" onClick={() => setAdding(true)} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong">Ajouter des publications ou des photos</button>}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {open.items.map(item => {
              const url = thumbOf(item)
              return (
                <div key={item.id} className="group relative aspect-square overflow-hidden rounded-xl border border-white/[0.08] bg-black">
                  <button type="button" className="h-full w-full" onClick={() => item.publication ? setViewPub(item.publication) : setViewMedia(item)} aria-label="Agrandir">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {url && (isVideo(url, item.publication?.mediaType || item.mediaType) ? <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" /> : <img src={url} alt={item.publication?.title || item.caption || ''} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />)}
                  </button>
                  {item.publication && <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white/80">Publication</span>}
                  {isOwner && (
                    <button type="button" onClick={() => removeItem(item)} aria-label="Retirer de l’album"
                      className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white/80 opacity-100 transition hover:bg-red-500/80 sm:opacity-0 sm:group-hover:opacity-100">
                      <X size={13} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {adding && isOwner && (
          <AddToAlbumModal
            album={open}
            profileId={profileId}
            onClose={() => setAdding(false)}
            onAdded={() => openAlbum(open.id)}
          />
        )}
        {viewPub && <PublicationModal pub={viewPub} onClose={() => setViewPub(null)} onCountChange={() => {}} />}
        {viewMedia && <MediaViewer item={viewMedia} onClose={() => setViewMedia(null)} />}
      </div>
    )
  }

  /* ── Liste des albums ── */
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70">{albums.length > 0 ? `${albums.length} album${albums.length > 1 ? 's' : ''}` : 'Aucun album'}</h3>
        {isOwner && (
          <button type="button" onClick={() => setShowCreate(v => !v)} className="flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-strong">
            <Plus size={13} /> Nouvel album
          </button>
        )}
      </div>

      {showCreate && isOwner && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} maxLength={100} autoFocus placeholder="Nom de l’album (ex. Concerts 2026)"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent/50" />
          <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} maxLength={500} placeholder="Description (facultatif)"
            className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent/50" />
          <label className="flex items-center gap-2 text-xs text-white/60">
            <input type="checkbox" checked={newPrivate} onChange={e => setNewPrivate(e.target.checked)} className="accent-violet-500" />
            Album privé (visible seulement par moi)
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:text-white">Annuler</button>
            <button type="button" onClick={createAlbum} disabled={!newTitle.trim() || creating} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-40">
              {creating ? 'Création…' : 'Créer et ajouter du contenu'}
            </button>
          </div>
        </div>
      )}

      {albums.length === 0 ? (
        <p className="py-10 text-center text-sm text-white/40">{isOwner ? 'Créez un album pour regrouper vos publications et vos photos.' : 'Aucun album pour l’instant.'}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {albums.map(album => (
            <button key={album.id} type="button" onClick={() => openAlbum(album.id)} className="group text-left">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-accent/20 to-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {album.coverUrl ? <img src={album.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : <span className="grid h-full place-items-center"><ImagePlus size={26} className="text-white/25" /></span>}
                {album.isPrivate && <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/60"><Lock size={11} className="text-white/80" /></span>}
              </div>
              <p className="mt-2 truncate text-sm font-semibold text-white">{album.title}</p>
              <p className="text-xs text-white/45">{album.itemCount} élément{album.itemCount > 1 ? 's' : ''}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Fenêtre « Ajouter à l'album » : mes publications, où je suis identifié, ou des photos envoyées ── */
function AddToAlbumModal({ album, profileId, onClose, onAdded }: { album: AlbumDetail; profileId: number; onClose: () => void; onAdded: () => void }) {
  const { notify } = useFeedback()
  const [source, setSource] = useState<Source>('mine')
  const [pubs, setPubs] = useState<PubCardData[] | null>(null)
  const [picked, setPicked] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const inAlbum = new Set(album.items.map(i => i.publication?.id).filter(Boolean) as number[])

  useEffect(() => {
    if (source === 'upload') return
    setPubs(null); setPicked([])
    apiFetch(apiUrl(source === 'mine' ? `publications/profile/${profileId}?limit=50` : `publications/tagged/${profileId}?limit=50`))
      .then(r => (r.ok ? r.json() : null))
      .then(d => setPubs(d?.publications ?? []))
      .catch(() => setPubs([]))
  }, [source, profileId])

  const toggle = (id: number) => setPicked(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id])

  const addPicked = async () => {
    if (!picked.length) return
    setSaving(true)
    let ok = 0
    for (const id of picked) {
      const res = await apiFetch(apiUrl(`albums/${album.id}/items`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publicationId: id }) }).catch(() => null)
      if (res?.ok) ok++
    }
    setSaving(false)
    notify(ok ? `${ok} publication${ok > 1 ? 's' : ''} ajoutée${ok > 1 ? 's' : ''} à l’album.` : 'Aucune publication ajoutée.', ok ? 'success' : 'error')
    onAdded(); onClose()
  }

  const uploadPhotos = async (files: FileList | null) => {
    const list = Array.from(files || []).filter(f => f.type.startsWith('image/'))
    if (!list.length) return
    setSaving(true)
    let ok = 0
    for (const [i, file] of list.entries()) {
      setProgress(`Envoi ${i + 1} / ${list.length}…`)
      const up = await uploadToStorage(file, { folder: 'media' }).catch(() => null)
      const d = up?.ok ? await up.json() : null
      if (!d?.url) continue
      const res = await apiFetch(apiUrl(`albums/${album.id}/items`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mediaUrl: d.url, mediaType: 'image' }) }).catch(() => null)
      if (res?.ok) ok++
    }
    setSaving(false); setProgress(null)
    notify(ok ? `${ok} photo${ok > 1 ? 's' : ''} ajoutée${ok > 1 ? 's' : ''} à l’album.` : 'Aucune photo n’a pu être ajoutée.', ok ? 'success' : 'error')
    onAdded(); onClose()
  }

  const TABS: { key: Source; label: string }[] = [
    { key: 'mine', label: 'Mes publications' },
    { key: 'tagged', label: 'Où je suis identifié' },
    { key: 'upload', label: 'Envoyer des photos' },
  ]

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="album-add-title" onClick={e => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/12 bg-surface sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
          <h2 id="album-add-title" className="truncate text-base font-bold text-white">Ajouter à « {album.title} »</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.07] text-white/60 hover:text-white"><X size={16} /></button>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-white/[0.08] px-3 py-2">
          {TABS.map(t => (
            <button key={t.key} type="button" onClick={() => setSource(t.key)} aria-pressed={source === t.key}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${source === t.key ? 'bg-accent text-white' : 'text-white/55 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {source === 'upload' ? (
            <label className="grid cursor-pointer justify-items-center gap-3 rounded-2xl border border-dashed border-white/15 px-5 py-12 text-center transition hover:border-accent/50">
              <ImagePlus size={28} className="text-white/40" />
              <span className="text-sm font-semibold text-white">{progress || 'Choisir des photos'}</span>
              <span className="text-xs text-white/45">Depuis votre téléphone ou votre ordinateur. Elles restent dans l’album, sans devenir des publications.</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={saving} className="hidden" onChange={e => uploadPhotos(e.target.files)} />
            </label>
          ) : pubs === null ? (
            <p className="py-10 text-center text-sm text-white/40">Chargement…</p>
          ) : pubs.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/45">{source === 'mine' ? 'Vous n’avez pas encore de publication.' : 'Vous n’êtes identifié dans aucune publication pour l’instant.'}</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {pubs.map(p => {
                const already = inAlbum.has(p.id)
                const on = picked.includes(p.id)
                return (
                  <button key={p.id} type="button" disabled={already} onClick={() => toggle(p.id)} aria-pressed={on}
                    className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-black transition ${on ? 'border-accent' : 'border-transparent'} disabled:opacity-40`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {isVideo(p.media, p.mediaType) ? <video src={p.media} muted playsInline preload="metadata" className="h-full w-full object-cover" /> : <img src={p.media} alt={p.title} loading="lazy" className="h-full w-full object-cover" />}
                    {(on || already) && <span className={`absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full ${already ? 'bg-white/30' : 'bg-accent'}`}><Check size={13} className="text-white" /></span>}
                    {already && <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-[10px] text-white/80">Déjà dans l’album</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {source !== 'upload' && (
          <div className="flex items-center justify-between gap-3 border-t border-white/[0.08] px-5 py-3">
            <span className="text-xs text-white/50">{picked.length ? `${picked.length} sélectionnée${picked.length > 1 ? 's' : ''}` : 'Touchez les publications à ajouter'}</span>
            <button type="button" onClick={addPicked} disabled={!picked.length || saving} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-40">
              {saving ? 'Ajout…' : 'Ajouter à l’album'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

/* ── Photo envoyée directement dans l'album, en grand ── */
function MediaViewer({ item, onClose }: { item: AlbumItem; onClose: () => void }) {
  const url = item.mediaUrl || ''
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button type="button" onClick={onClose} aria-label="Fermer" className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+1rem)] grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><X size={20} /></button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {isVideo(url, item.mediaType) ? <video src={url} controls autoPlay playsInline className="max-h-[88dvh] max-w-full rounded-xl" onClick={e => e.stopPropagation()} /> : <img src={url} alt={item.caption || ''} className="max-h-[88dvh] max-w-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />}
    </div>,
    document.body,
  )
}
