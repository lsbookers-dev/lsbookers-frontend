'use client'

/**
 * AddPublicationModal — Modal de création de publication
 * Supporte le multi-upload (plusieurs photos/vidéos dans une même publication).
 * À utiliser dans les 3 pages profil (artist / organizer / provider).
 */

import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, Plus, Trash2, Play, ImagePlus, Tag, Check, UserPlus } from 'lucide-react'
import type { PubCardData, PubTag } from './PublicationCard'

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

type TagSearchUser = {
  id: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  profile?: { id: number; avatar?: string | null }
}

const tagDisplayName = (u: TagSearchUser) =>
  u.pseudo || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Utilisateur'

export default function AddPublicationModal({ profileId, token, accent = 'pink', onClose, onPublished }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title,    setTitle]    = useState('')
  const [caption,  setCaption]  = useState('')
  const [files,    setFiles]    = useState<FilePreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [error,    setError]    = useState('')

  // ── Étape 2 : tag après publication ──
  const [step,         setStep]         = useState<1 | 2>(1)
  const [savedPubId,   setSavedPubId]   = useState<number | null>(null)
  const [savedPub,     setSavedPub]     = useState<PubCardData | null>(null)
  const [tagQuery,     setTagQuery]     = useState('')
  const [tagResults,   setTagResults]   = useState<TagSearchUser[]>([])
  const [tagSearching, setTagSearching] = useState(false)
  const [tagLoading,   setTagLoading]   = useState(false)
  const [tags,         setTags]         = useState<PubTag[]>([])

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setTagResults([]); return }
    setTagSearching(true)
    try {
      const res = await fetch(`${API_BASE}/api/search/users?q=${encodeURIComponent(q)}&limit=8`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const taggedIds = new Set(tags.map(t => t.taggedUser.id))
        setTagResults((data.users || []).filter((u: TagSearchUser) => !taggedIds.has(u.id)))
      }
    } catch { /* silent */ } finally { setTagSearching(false) }
  }, [token, tags])

  useEffect(() => {
    const t = setTimeout(() => searchUsers(tagQuery), 300)
    return () => clearTimeout(t)
  }, [tagQuery, searchUsers])

  const handleTag = async (targetUserId: number) => {
    if (!savedPubId || tagLoading || tags.length >= 5) return
    setTagLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/publications/${savedPubId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userIds: [targetUserId] }),
      })
      if (res.ok) {
        const data = await res.json()
        setTags(prev => [...prev, ...data.tags])
        setTagQuery('')
        setTagResults([])
      }
    } catch { /* silent */ } finally { setTagLoading(false) }
  }

  const handleRemoveTag = async (tagId: number) => {
    if (!savedPubId) return
    try {
      await fetch(`${API_BASE}/api/publications/${savedPubId}/tags/${tagId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setTags(prev => prev.filter(t => t.id !== tagId))
    } catch { /* silent */ }
  }

  const finishAndClose = () => {
    if (savedPub) onPublished({ ...savedPub, tags })
    onClose()
  }

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
      setSavedPubId(saved.id)
      setSavedPub(saved)
      setStep(2) // Passer à l'étape de tagging
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setUploading(false)
    }
  }

  const btn = ACCENT_CLASSES[accent] ?? ACCENT_CLASSES.pink

  // ── Étape 2 : identifier des personnes ──
  if (step === 2) {
    return (
      <div
        className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={finishAndClose}
      >
        <div
          className="max-w-md w-full bg-neutral-950 border border-white/10 rounded-2xl p-5 space-y-4"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-violet-400" />
              <h3 className="text-base font-semibold">Identifier des personnes</h3>
            </div>
            <button onClick={finishAndClose} className="text-neutral-400 hover:text-white transition">
              <X size={18} />
            </button>
          </div>

          <p className="text-xs text-white/45">
            Publication créée ✓ — Identifie jusqu&apos;à 5 personnes. Elles recevront une notification et pourront accepter ou refuser.
          </p>

          {/* Tags déjà ajoutés */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(t => (
                <div key={t.id} className="flex items-center gap-1.5 bg-white/8 rounded-full px-3 py-1.5">
                  <span className="text-sm">@{tagDisplayName(t.taggedUser)}</span>
                  <button onClick={() => handleRemoveTag(t.id)} className="text-white/30 hover:text-red-400 transition">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Champ de recherche */}
          {tags.length < 5 && (
            <div className="relative">
              <input
                autoFocus
                value={tagQuery}
                onChange={e => setTagQuery(e.target.value)}
                placeholder="Rechercher par pseudo ou nom…"
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-violet-500/50 transition"
              />
              {tagSearching && <p className="text-[10px] text-white/30 mt-1 px-1">Recherche…</p>}
              {tagResults.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                  {tagResults.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleTag(u.id)}
                      disabled={tagLoading}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/8 transition text-left"
                    >
                      {u.profile?.avatar ? (
                        <div className="relative h-8 w-8 rounded-full overflow-hidden shrink-0">
                          <Image src={u.profile.avatar.startsWith('http') ? u.profile.avatar : `${API_BASE}${u.profile.avatar}`} alt="" fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-sm font-bold">
                          {tagDisplayName(u)[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{tagDisplayName(u)}</p>
                        {u.pseudo && <p className="text-xs text-white/40">@{u.pseudo}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={finishAndClose}
              className="flex-1 py-2.5 rounded-xl bg-white/8 hover:bg-white/12 text-sm font-medium transition"
            >
              {tags.length > 0 ? (
                <span className="flex items-center justify-center gap-1.5"><Check size={14} /> Terminer</span>
              ) : (
                'Passer'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

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
