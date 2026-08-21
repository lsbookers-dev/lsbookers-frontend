'use client'

/**
 * AddPublicationModal — Modal de création de publication
 * Supporte le multi-upload (plusieurs photos/vidéos dans une même publication).
 * À utiliser dans les 3 pages profil (artist / organizer / provider).
 */

import { useRef, useState } from 'react'
import Image from 'next/image'
import { X, Plus, Trash2, Play, ImagePlus } from 'lucide-react'
import type { PubCardData } from './PublicationCard'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

const ACCENT_CLASSES: Record<string, string> = {
  pink:   'bg-pink-600 hover:bg-pink-500',
  violet: 'bg-violet-600 hover:bg-violet-500',
  blue:   'bg-blue-600 hover:bg-blue-500',
}

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

export default function AddPublicationModal({ profileId, token, accent = 'pink', onClose, onPublished }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title,    setTitle]    = useState('')
  const [caption,  setCaption]  = useState('')
  const [files,    setFiles]    = useState<FilePreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [error,    setError]    = useState('')

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const newPreviews: FilePreview[] = []
    Array.from(incoming).forEach(file => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return
      const previewUrl = URL.createObjectURL(file)
      newPreviews.push({ file, previewUrl, type: file.type.startsWith('video/') ? 'video' : 'image' })
    })
    setFiles(prev => [...prev, ...newPreviews].slice(0, 10)) // max 10 médias
  }

  const removeFile = (i: number) => {
    setFiles(prev => {
      URL.revokeObjectURL(prev[i].previewUrl)
      return prev.filter((_, idx) => idx !== i)
    })
  }

  const uploadFile = async (fp: FilePreview): Promise<{ url: string; mediaType: 'image' | 'video' }> => {
    const fd = new FormData()
    fd.append('file', fp.file)
    fd.append('folder', 'media')
    fd.append('type', fp.type)
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    if (!res.ok) throw new Error('Upload échoué')
    const { url } = await res.json()
    return { url, mediaType: fp.type }
  }

  const handlePublish = async () => {
    if (!title.trim() || files.length === 0 || uploading) return
    setUploading(true)
    setError('')
    try {
      // Upload tous les fichiers séquentiellement
      const uploaded = await Promise.all(files.map(uploadFile))

      const [first, ...rest] = uploaded

      const body: Record<string, unknown> = {
        title:     title.trim(),
        media:     first.url,
        mediaType: first.mediaType,
        caption:   caption.trim() || null,
        profileId,
      }
      if (rest.length > 0) {
        body.additionalMedia = rest.map((m, i) => ({ url: m.url, mediaType: m.mediaType, order: i }))
      }

      const res = await fetch(`${API_BASE}/api/publications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Erreur création publication')
      const saved = await res.json()
      onPublished(saved)
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setUploading(false)
    }
  }

  const btn = ACCENT_CLASSES[accent] ?? ACCENT_CLASSES.pink

  return (
    <div
      className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="max-w-lg w-full bg-neutral-950 border border-white/10 rounded-2xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Nouvelle publication</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Titre */}
        <input
          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-white/25 transition"
          placeholder="Titre"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={150}
        />

        {/* Légende */}
        <textarea
          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-white/25 transition resize-none"
          placeholder="Légende (optionnel)"
          rows={2}
          value={caption}
          onChange={e => setCaption(e.target.value)}
          maxLength={500}
        />

        {/* Grille de prévisualisations */}
        {files.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {files.map((fp, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-white/5 group">
                {fp.type === 'image' ? (
                  <Image src={fp.previewUrl} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/40">
                    <Play size={20} className="text-white/60 fill-white/60" />
                  </div>
                )}
                {/* Bouton supprimer */}
                <button
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 size={10} />
                </button>
                {/* Badge "principal" sur le 1er */}
                {i === 0 && (
                  <div className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white/70 rounded px-1">
                    principal
                  </div>
                )}
              </div>
            ))}

            {/* Bouton ajouter d'autres */}
            {files.length < 10 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border border-dashed border-white/20 hover:border-white/40 flex items-center justify-center text-white/30 hover:text-white/60 transition"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
        )}

        {/* Zone de sélection si aucun fichier */}
        {files.length === 0 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 rounded-xl border border-dashed border-white/20 hover:border-white/40 flex flex-col items-center justify-center gap-2 text-white/40 hover:text-white/60 transition"
          >
            <ImagePlus size={28} />
            <span className="text-sm">Sélectionner photos / vidéos</span>
            <span className="text-xs text-white/25">Jusqu&apos;à 10 fichiers</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* Bouton publier */}
        <button
          onClick={handlePublish}
          disabled={uploading || !title.trim() || files.length === 0}
          className={`w-full py-2.5 rounded-xl ${btn} disabled:opacity-50 text-sm font-semibold transition`}
        >
          {uploading ? 'Publication en cours…' : 'Publier'}
        </button>
      </div>
    </div>
  )
}
