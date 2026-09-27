'use client'

/**
 * Composeur partagé par l'accueil et les profils.
 * Les fonctions historiques (multi-upload, création et callback) sont conservées.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Check, ChevronLeft, ChevronRight, Eye, ImagePlus, Loader2,
  MessageCircle, Plus, Search, Send, Trash2, Users, X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { PubCardData, PubTag } from './PublicationCard'
import CropModal from './CropModal'

// Ratio 4:5 — format Instagram portrait, idéal pour un feed uniforme
const PUBLICATION_ASPECT_RATIO = 4 / 5

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const MAX_FILES = 10
const MAX_IMAGE_SIZE = 25 * 1024 * 1024
const MAX_VIDEO_SIZE = 100 * 1024 * 1024
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg'])

type Props = {
  profileId: number
  token: string
  accent?: 'pink' | 'violet' | 'blue'
  onClose: () => void
  onPublished: (pub: PubCardData) => void
}

type FilePreview = {
  file: File
  previewUrl: string
  type: 'image' | 'video'
}

type TagUser = {
  id: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  role?: string | null
  profile?: { id: number; avatar?: string | null } | null
}

const displayName = (user: TagUser) =>
  user.pseudo || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Utilisateur'

const toAbsoluteUrl = (url?: string | null) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`
}

export default function AddPublicationModal({ profileId, token, onClose, onPublished }: Props) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const filesRef = useRef<FilePreview[]>([])
  const uploadingRef = useRef(false)

  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [files, setFiles] = useState<FilePreview[]>([])
  const [coverIndex, setCoverIndex] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState(0)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [showTagSearch, setShowTagSearch] = useState(false)
  const [tagQuery, setTagQuery] = useState('')
  const [tagResults, setTagResults] = useState<TagUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<TagUser[]>([])
  const [searching, setSearching] = useState(false)
  // File d'attente de recadrage : chaque image passe par le CropModal avant d'être ajoutée
  const [cropQueue, setCropQueue] = useState<File[]>([])
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  filesRef.current = files
  uploadingRef.current = uploading

  // Gestion de la file de recadrage : ouvre le CropModal pour chaque image en attente
  useEffect(() => {
    if (cropQueue.length === 0) {
      setCropSrc(prev => { if (prev) URL.revokeObjectURL(prev); return null })
      return
    }
    const url = URL.createObjectURL(cropQueue[0])
    setCropSrc(prev => { if (prev) URL.revokeObjectURL(prev); return url })
  }, [cropQueue])

  const advanceCropQueue = () => setCropQueue(prev => prev.slice(1))

  const handleCropConfirm = (blob: Blob) => {
    const original = cropQueue[0]
    const croppedFile = new File([blob], original?.name ?? 'image.jpg', { type: 'image/jpeg' })
    const preview: FilePreview = { file: croppedFile, previewUrl: URL.createObjectURL(croppedFile), type: 'image' }
    setFiles(prev => {
      if (prev.length >= MAX_FILES) { URL.revokeObjectURL(preview.previewUrl); return prev }
      return [...prev, preview]
    })
    advanceCropQueue()
  }

  const closeModal = useCallback(() => {
    if (!uploadingRef.current) onClose()
  }, [onClose])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [closeModal])

  useEffect(() => () => {
    filesRef.current.forEach(item => URL.revokeObjectURL(item.previewUrl))
  }, [])

  useEffect(() => {
    if (!showTagSearch || tagQuery.trim().length < 2 || !token) {
      setTagResults([])
      setSearching(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setSearching(true)
      try {
        const response = await fetch(
          `${API_BASE}/api/search/users?q=${encodeURIComponent(tagQuery.trim())}&limit=8`,
          { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal },
        )
        if (!response.ok) return
        const data = await response.json()
        const selectedIds = new Set(selectedUsers.map(selected => selected.id))
        setTagResults((data.users || []).filter((candidate: TagUser) => !selectedIds.has(candidate.id)))
      } catch {
        if (!controller.signal.aborted) setTagResults([])
      } finally {
        if (!controller.signal.aborted) setSearching(false)
      }
    }, 300)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [showTagSearch, tagQuery, token, selectedUsers])

  const addFiles = (incoming: FileList | File[]) => {
    const candidates = Array.from(incoming)
    const pendingImages: File[] = []
    const acceptedVideos: FilePreview[] = []
    let nextError = ''

    for (const file of candidates) {
      const isImage = IMAGE_MIME_TYPES.has(file.type)
      const isVideo = VIDEO_MIME_TYPES.has(file.type)
      if (!isImage && !isVideo) {
        nextError = 'Seules les photos et les vidéos sont acceptées.'
        continue
      }
      const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
      if (file.size > maxSize) {
        nextError = isImage
          ? 'Une image dépasse la limite de 25 Mo.'
          : 'Une vidéo dépasse la limite de 100 Mo.'
        continue
      }
      // Les images passent par le CropModal — les vidéos sont ajoutées directement
      if (isImage) {
        pendingImages.push(file)
      } else {
        acceptedVideos.push({ file, previewUrl: URL.createObjectURL(file), type: 'video' })
      }
    }

    // Ajouter les vidéos immédiatement
    if (acceptedVideos.length > 0) {
      setFiles(previous => {
        const available = Math.max(0, MAX_FILES - previous.length)
        const kept = acceptedVideos.slice(0, available)
        acceptedVideos.slice(available).forEach(item => URL.revokeObjectURL(item.previewUrl))
        if (acceptedVideos.length > available) nextError = `Une publication peut contenir ${MAX_FILES} médias maximum.`
        return [...previous, ...kept]
      })
    }

    // Mettre les images en file d'attente de recadrage
    if (pendingImages.length > 0) {
      setCropQueue(prev => [...prev, ...pendingImages])
    }

    setError(nextError)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setFiles(previous => {
      const target = previous[index]
      if (target) URL.revokeObjectURL(target.previewUrl)
      return previous.filter((_, itemIndex) => itemIndex !== index)
    })
    setCoverIndex(previous => Math.max(0, Math.min(previous > index ? previous - 1 : previous, files.length - 2)))
  }

  const moveFile = (from: number, direction: -1 | 1) => {
    const to = from + direction
    if (to < 0 || to >= files.length) return
    setFiles(previous => {
      const reordered = [...previous]
      ;[reordered[from], reordered[to]] = [reordered[to], reordered[from]]
      return reordered
    })
    setCoverIndex(previous => previous === from ? to : previous === to ? from : previous)
  }

  const uploadFile = async (item: FilePreview) => {
    const form = new FormData()
    form.append('file', item.file)
    form.append('folder', 'media')
    form.append('type', item.type)
    const response = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(payload?.error === 'FILE_TOO_LARGE' ? 'Un média est trop volumineux.' : 'L’envoi d’un média a échoué.')
    }
    const { url } = await response.json()
    return { url, mediaType: item.type }
  }

  const handlePublish = async () => {
    if (!title.trim() || files.length === 0 || uploading) return
    if (!profileId || !token) {
      setError('Votre profil doit être chargé avant de publier.')
      return
    }

    setUploading(true)
    setUploadStep(0)
    setError('')
    try {
      const orderedFiles = [files[coverIndex], ...files.filter((_, index) => index !== coverIndex)]
      const uploaded: Array<{ url: string; mediaType: 'image' | 'video' }> = []

      // Envoi séquentiel : évite de charger jusqu'à dix gros fichiers en mémoire en même temps.
      for (const item of orderedFiles) {
        uploaded.push(await uploadFile(item))
        setUploadStep(uploaded.length)
      }

      const [first, ...rest] = uploaded
      const response = await fetch(`${API_BASE}/api/publications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          media: first.url,
          mediaType: first.mediaType,
          caption: caption.trim() || null,
          profileId,
          ...(rest.length > 0 ? {
            additionalMedia: rest.map((media, index) => ({ ...media, order: index })),
          } : {}),
        }),
      })

      if (!response.ok) throw new Error('La publication n’a pas pu être créée.')
      const saved: PubCardData = await response.json()

      if (selectedUsers.length > 0) {
        const tagResponse = await fetch(`${API_BASE}/api/publications/${saved.id}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userIds: selectedUsers.map(selected => selected.id) }),
        }).catch(() => null)
        if (tagResponse?.ok) {
          const tagData = await tagResponse.json()
          saved.tags = (tagData.tags || []) as PubTag[]
        }
      }

      onPublished(saved)
      onClose()
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Une erreur inconnue est survenue.')
    } finally {
      setUploading(false)
    }
  }

  const selectedMedia = files[coverIndex] ?? files[0]
  const ready = title.trim().length > 0 && files.length > 0 && profileId > 0 && token.length > 0
  const authorName = user?.name || 'Votre profil'
  const initials = authorName.slice(0, 2).toUpperCase()

  return (
    <>
    {/* CropModal — s'ouvre par-dessus le composeur pour chaque image de la file */}
    {cropSrc && cropQueue.length > 0 && (
      <CropModal
        src={cropSrc}
        aspectRatio={PUBLICATION_ASPECT_RATIO}
        displayWidth={360}
        outputWidth={1080}
        maxZoom={4}
        onConfirm={handleCropConfirm}
        onCancel={advanceCropQueue}
      />
    )}
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center sm:p-5"
      onMouseDown={event => { if (event.target === event.currentTarget) closeModal() }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="publication-composer-title"
        className="flex h-[100dvh] w-full flex-col overflow-hidden border-white/10 bg-[#0d0c11] shadow-[0_30px_100px_rgba(0,0,0,.65)] sm:h-auto sm:max-h-[92vh] sm:max-w-5xl sm:rounded-[1.4rem] sm:border"
      >
        <header className="flex min-h-16 items-center gap-3 border-b border-white/[0.08] px-4 py-3 sm:px-5">
          <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xs font-bold">
            {user?.avatarUrl ? <Image src={toAbsoluteUrl(user.avatarUrl)} alt="" fill className="object-cover" unoptimized /> : initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="publication-composer-title" className="text-[15px] font-semibold text-white">Créer une publication</h2>
            <p className="mt-0.5 truncate text-[11px] text-white/40">Le même atelier depuis l’accueil et votre profil.</p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={uploading}
            aria-label="Fermer"
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-white/50 transition hover:border-white/20 hover:text-white disabled:opacity-30"
          >
            <X size={17} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,.9fr)] lg:overflow-hidden">
          <div className="min-w-0 p-4 sm:p-5 lg:overflow-y-auto lg:border-r lg:border-white/[0.08]">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-[11px] font-semibold text-white/80">Médias</p>
              <span className="text-[10px] text-white/30">{files.length} / {MAX_FILES}</span>
            </div>

            {files.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={event => { event.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={event => {
                  event.preventDefault()
                  setDragging(false)
                  addFiles(event.dataTransfer.files)
                }}
                className={`grid min-h-48 w-full place-items-center rounded-2xl border border-dashed p-5 text-center transition ${dragging ? 'border-violet-400 bg-violet-500/10' : 'border-violet-400/35 bg-[#100d15] hover:border-violet-400/65 hover:bg-violet-500/[0.07]'}`}
              >
                <span>
                  <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
                    <ImagePlus size={22} />
                  </span>
                  <strong className="block text-sm font-semibold text-white">Ajoutez vos photos ou vidéos</strong>
                  <span className="mx-auto mt-1.5 block max-w-xs text-[11px] leading-relaxed text-white/40">Déposez vos fichiers ici ou parcourez votre appareil. Le premier média devient la couverture.</span>
                  <span className="mx-auto mt-3 inline-flex rounded-xl border border-violet-400/30 bg-violet-500/15 px-3 py-2 text-[11px] font-semibold text-violet-100">Choisir des médias</span>
                </span>
              </button>
            ) : (
              <>
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 bg-black">
                  {selectedMedia.type === 'image' ? (
                    <Image src={selectedMedia.previewUrl} alt="Aperçu du média de couverture" fill className="object-cover" unoptimized />
                  ) : (
                    <video src={selectedMedia.previewUrl} className="h-full w-full object-cover" muted controls playsInline />
                  )}
                  <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[9px] font-semibold text-white/80 backdrop-blur-md">Couverture</span>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/65 px-2.5 py-2 text-[10px] text-white backdrop-blur-md hover:bg-black/80">
                    <ImagePlus size={13} /> Ajouter
                  </button>
                </div>

                <div className="mt-2.5 grid grid-cols-5 gap-2 sm:grid-cols-7">
                  {files.map((item, index) => (
                    <div key={`${item.file.name}-${item.file.lastModified}-${index}`} className={`group relative aspect-square overflow-hidden rounded-xl border ${index === coverIndex ? 'border-violet-400 ring-1 ring-violet-400/50' : 'border-white/10'}`}>
                      <button type="button" onClick={() => setCoverIndex(index)} className="relative h-full w-full" aria-label={`Choisir le média ${index + 1} comme couverture`}>
                        {item.type === 'image' ? <Image src={item.previewUrl} alt="" fill className="object-cover" unoptimized /> : <video src={item.previewUrl} className="h-full w-full object-cover" muted preload="metadata" />}
                        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[8px] text-white/75">{index + 1}</span>
                      </button>
                      <button type="button" onClick={() => removeFile(index)} aria-label={`Supprimer le média ${index + 1}`} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/75 text-white/70 opacity-100 transition hover:bg-red-600 hover:text-white sm:opacity-0 sm:group-hover:opacity-100">
                        <Trash2 size={10} />
                      </button>
                      <div className="absolute bottom-1 right-1 hidden gap-0.5 sm:group-hover:flex">
                        <button type="button" disabled={index === 0} onClick={() => moveFile(index, -1)} className="grid h-5 w-5 place-items-center rounded bg-black/75 text-white/70 disabled:opacity-25"><ChevronLeft size={10} /></button>
                        <button type="button" disabled={index === files.length - 1} onClick={() => moveFile(index, 1)} className="grid h-5 w-5 place-items-center rounded bg-black/75 text-white/70 disabled:opacity-25"><ChevronRight size={10} /></button>
                      </div>
                    </div>
                  ))}
                  {files.length < MAX_FILES && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Ajouter des médias" className="grid aspect-square place-items-center rounded-xl border border-dashed border-white/15 text-white/35 transition hover:border-violet-400/50 hover:text-violet-300"><Plus size={19} /></button>
                  )}
                </div>
              </>
            )}

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,video/ogg" multiple className="hidden" onChange={event => event.target.files && addFiles(event.target.files)} />

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="publication-title" className="text-[11px] font-medium text-white/75">Titre</label>
                <span className="text-[9px] text-white/30">{title.length} / 150</span>
              </div>
              <input id="publication-title" value={title} onChange={event => setTitle(event.target.value)} maxLength={150} placeholder="Donnez un titre clair à votre publication" className="w-full rounded-xl border border-white/10 bg-[#100e14] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-violet-400/45 focus:ring-2 focus:ring-violet-500/10" />
            </div>

            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="publication-caption" className="text-[11px] font-medium text-white/75">Légende</label>
                <span className="text-[9px] text-white/30">{caption.length} / 500</span>
              </div>
              <textarea id="publication-caption" value={caption} onChange={event => setCaption(event.target.value)} maxLength={500} rows={3} placeholder="Racontez le contexte, les coulisses ou l’histoire de ce moment…" className="w-full resize-none rounded-xl border border-white/10 bg-[#100e14] px-3.5 py-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-white/25 focus:border-violet-400/45 focus:ring-2 focus:ring-violet-500/10" />
            </div>

            <div className="mt-3">
              <button type="button" onClick={() => setShowTagSearch(previous => !previous)} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] transition ${showTagSearch || selectedUsers.length > 0 ? 'border-violet-400/35 bg-violet-500/10 text-violet-200' : 'border-white/10 bg-white/[0.025] text-white/45 hover:text-white/70'}`}>
                <Users size={14} /> Identifier des personnes {selectedUsers.length > 0 && `· ${selectedUsers.length}`}
              </button>

              {selectedUsers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedUsers.map(selected => (
                    <button key={selected.id} type="button" onClick={() => setSelectedUsers(previous => previous.filter(item => item.id !== selected.id))} className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 py-1 pl-2 pr-1.5 text-[10px] text-violet-100">
                      {displayName(selected)} <X size={11} />
                    </button>
                  ))}
                </div>
              )}

              {showTagSearch && selectedUsers.length < 5 && (
                <div className="relative mt-2 rounded-xl border border-white/10 bg-[#100e14] p-2">
                  <Search size={14} className="absolute left-5 top-5 text-white/30" />
                  <input autoFocus value={tagQuery} onChange={event => setTagQuery(event.target.value)} placeholder="Rechercher un profil…" className="w-full rounded-lg border border-white/8 bg-black/20 py-2 pl-9 pr-3 text-xs text-white outline-none placeholder:text-white/25 focus:border-violet-400/35" />
                  {searching && <Loader2 size={14} className="absolute right-5 top-5 animate-spin text-violet-300" />}
                  {tagResults.length > 0 && (
                    <div className="mt-2 grid gap-1">
                      {tagResults.map(result => (
                        <button key={result.id} type="button" onClick={() => { setSelectedUsers(previous => [...previous, result].slice(0, 5)); setTagQuery(''); setTagResults([]) }} className="flex items-center gap-2.5 rounded-lg p-2 text-left transition hover:bg-white/[0.05]">
                          <span className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-500/15 text-[10px] font-bold text-violet-100">
                            {result.profile?.avatar ? <Image src={toAbsoluteUrl(result.profile.avatar)} alt="" fill className="object-cover" unoptimized /> : displayName(result).slice(0, 2).toUpperCase()}
                          </span>
                          <span className="min-w-0"><strong className="block truncate text-xs font-medium text-white/80">{displayName(result)}</strong><span className="text-[9px] uppercase tracking-wide text-white/30">{result.role || 'Profil'}</span></span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="hidden min-w-0 bg-[#09080c] p-5 lg:block lg:overflow-y-auto">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold text-white/75">Aperçu dans le fil</p>
              <span className="text-[9px] text-white/30">Portfolio vivant</span>
            </div>
            <article className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-[#141019]">
              {selectedMedia ? (
                selectedMedia.type === 'image'
                  ? <Image src={selectedMedia.previewUrl} alt="" fill className="object-cover" unoptimized />
                  : <video src={selectedMedia.previewUrl} className="h-full w-full object-cover" muted autoPlay loop playsInline />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_65%_30%,rgba(168,85,247,.16),transparent_40%),#111016] text-white/15"><ImagePlus size={34} /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-black/95" />
              <div className="absolute inset-x-0 top-0 flex items-center gap-2.5 p-3">
                <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-violet-600 to-fuchsia-500 text-[9px] font-bold">
                  {user?.avatarUrl ? <Image src={toAbsoluteUrl(user.avatarUrl)} alt="" fill className="object-cover" unoptimized /> : initials}
                </span>
                <span className="min-w-0"><strong className="block truncate text-[11px] font-semibold">{authorName}</strong><span className="block text-[8px] text-white/55">À l’instant</span></span>
              </div>
              {files.length > 1 && <span className="absolute right-3 top-14 rounded-full border border-white/15 bg-black/55 px-2 py-1 text-[8px] backdrop-blur-md">1 / {files.length}</span>}
              <div className="absolute bottom-4 left-4 right-16">
                <span className="text-[8px] font-bold uppercase tracking-[.17em] text-violet-300">Nouvelle publication</span>
                <h3 className="mt-1.5 font-serif text-xl font-semibold leading-tight text-white">{title.trim() || 'Votre titre apparaîtra ici'}</h3>
                <p className="mt-1.5 line-clamp-3 text-[10px] leading-relaxed text-white/65">{caption.trim() || 'Ajoutez une légende pour donner du contexte à ce moment.'}</p>
              </div>
              <div className="absolute bottom-4 right-3 grid gap-2">
                {[Eye, MessageCircle, Send].map((Icon, index) => <span key={index} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/55 text-white/75 backdrop-blur-md"><Icon size={15} /></span>)}
              </div>
            </article>
            <div className="mt-3 flex gap-2 rounded-xl bg-white/[0.035] p-3 text-[10px] leading-relaxed text-white/40">
              <Eye size={14} className="mt-0.5 shrink-0 text-violet-300" />
              <span>La couverture et l’ordre des médias peuvent être modifiés avant la publication.</span>
            </div>
          </aside>
        </div>

        <footer className="flex min-h-16 items-center gap-3 border-t border-white/[0.08] bg-[#0d0c11] px-4 py-3 sm:px-5">
          <div className={`hidden min-w-0 flex-1 items-center gap-2 text-[10px] sm:flex ${ready ? 'text-emerald-300/70' : 'text-white/35'}`}>
            <span className={`h-2 w-2 shrink-0 rounded-full ${ready ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.45)]' : 'bg-white/20'}`} />
            <span>{uploading ? `Envoi du média ${Math.min(uploadStep + 1, files.length)} sur ${files.length}…` : ready ? 'Votre publication est prête' : 'Ajoutez un média et un titre'}</span>
          </div>
          {error && <p role="alert" className="min-w-0 flex-1 text-[10px] text-red-300 sm:text-right">{error}</p>}
          <button type="button" onClick={closeModal} disabled={uploading} className="hidden rounded-xl border border-white/10 bg-white/[0.025] px-4 py-2.5 text-[11px] text-white/55 transition hover:text-white sm:block">Annuler</button>
          <button type="button" onClick={handlePublish} disabled={!ready || uploading} className="ml-auto inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 px-5 py-2.5 text-[11px] font-semibold text-white shadow-[0_12px_30px_rgba(168,85,247,.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : ready ? <Send size={14} /> : <Check size={14} />}
            {uploading ? 'Publication…' : 'Publier'}
          </button>
        </footer>
      </section>
    </div>
    </>
  )
}
