// src/app/admin/publications/page.tsx
'use client'

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react'
import { getAuthToken } from '@/utils/auth'
import { Loader2, Trash2, ToggleLeft, ToggleRight, Plus, X } from 'lucide-react'

type AdminPost = {
  id: number
  title: string | null
  content: string | null
  mediaUrl: string | null
  mediaType: string | null
  active: boolean
  createdAt: string
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

function getAuthHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? getAuthToken() : null
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  return `Il y a ${d}j`
}

export default function AdminPublicationsPage() {
  const [posts, setPosts]               = useState<AdminPost[]>([])
  const [loading, setLoading]           = useState(true)
  const [creating, setCreating]         = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [notice, setNotice]             = useState<string | null>(null)

  // Form state
  const [title, setTitle]               = useState('')
  const [content, setContent]           = useState('')
  const [mediaFile, setMediaFile]       = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [uploading, setUploading]       = useState(false)

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3000)
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/posts`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const d = await res.json()
      setPosts(d.posts || [])
    } catch (e) {
      console.error(e)
      setError('Impossible de charger les publications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setMediaFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setMediaPreview(url)
    } else {
      setMediaPreview(null)
    }
  }

  const clearFile = () => {
    setMediaFile(null)
    setMediaPreview(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !mediaFile) {
      setError('Au moins un contenu ou un média est requis.')
      return
    }
    setError(null)
    setCreating(true)

    try {
      let mediaUrl: string | null = null
      let mediaType: string | null = null

      if (mediaFile) {
        setUploading(true)
        const form = new FormData()
        form.append('file', mediaFile)
        form.append('folder', 'media')
        const upRes = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: form,
        })
        if (!upRes.ok) throw new Error('Erreur upload média')
        const upData = await upRes.json()
        mediaUrl = upData.url || upData.secure_url || null
        mediaType = mediaFile.type.startsWith('video') ? 'VIDEO' : 'IMAGE'
        setUploading(false)
      }

      const res = await fetch(`${API_BASE}/api/admin/posts`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:     title.trim() || null,
          content:   content.trim() || null,
          mediaUrl,
          mediaType,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erreur création')
      }

      // Reset form
      setTitle('')
      setContent('')
      setMediaFile(null)
      setMediaPreview(null)
      showNotice('Publication créée avec succès.')
      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      setError(msg)
    } finally {
      setCreating(false)
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette publication ?')) return
    try {
      await fetch(`${API_BASE}/api/admin/posts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      setPosts(prev => prev.filter(p => p.id !== id))
      showNotice('Publication supprimée.')
    } catch {
      setError('Erreur lors de la suppression.')
    }
  }

  const handleToggle = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/posts/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      setPosts(prev => prev.map(p => p.id === id ? d.post : p))
    } catch {
      setError('Erreur lors de la mise à jour.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-white">
      <h2 className="text-2xl font-bold mb-6">Publications LSBookers</h2>
      <p className="text-white/50 text-sm mb-8">
        Ces publications apparaissent dans le feed de tous les utilisateurs, affichées comme des posts officiels LS Bookers.
      </p>

      {/* ── Notices ─────────────────────────────────────────── */}
      {notice && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm">
          {notice}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Formulaire de création ───────────────────────────── */}
      <form onSubmit={handleCreate} className="rounded-2xl border border-white/10 bg-white/3 p-6 mb-8 space-y-4">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Plus className="w-5 h-5 text-purple-400" />
          Nouvelle publication
        </h3>

        <div>
          <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">Titre (optionnel)</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Mise à jour importante"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/40"
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">Contenu (optionnel si média)</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Écrivez votre message ici…"
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/40 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">Média (optionnel)</label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-white/60 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600/50 file:text-white/90 file:text-sm hover:file:bg-purple-600/70 cursor-pointer"
          />
        </div>

        {mediaPreview && (
          <div className="relative inline-block">
            {mediaFile?.type.startsWith('video') ? (
              <video src={mediaPreview} className="max-h-48 rounded-xl border border-white/10" controls />
            ) : (
              <img src={mediaPreview} alt="preview" className="max-h-48 rounded-xl border border-white/10 object-cover" />
            )}
            <button
              type="button"
              onClick={clearFile}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={creating || uploading}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          {(creating || uploading) ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {uploading ? 'Upload…' : 'Création…'}</>
          ) : (
            <><Plus className="w-4 h-4" /> Publier</>
          )}
        </button>
      </form>

      {/* ── Liste des publications ────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-center text-white/30 py-12">Aucune publication pour l&apos;instant.</p>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className={`rounded-2xl border ${post.active ? 'border-purple-500/20 bg-purple-500/5' : 'border-white/8 bg-white/3 opacity-60'} p-5`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  {post.title && (
                    <p className="text-sm font-semibold text-white truncate">{post.title}</p>
                  )}
                  {post.content && (
                    <p className="text-sm text-white/60 line-clamp-2 mt-0.5">{post.content}</p>
                  )}
                  <p className="text-xs text-white/30 mt-1.5">{timeAgo(post.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${post.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                    {post.active ? 'Actif' : 'Inactif'}
                  </span>
                  <button
                    onClick={() => handleToggle(post.id)}
                    className="text-white/40 hover:text-purple-400 transition-colors"
                    title={post.active ? 'Désactiver' : 'Activer'}
                  >
                    {post.active ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-white/30 hover:text-red-400 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {post.mediaUrl && (
                <div className="mt-2">
                  {post.mediaType === 'VIDEO' ? (
                    <video src={post.mediaUrl} className="max-h-40 rounded-xl border border-white/10" controls />
                  ) : (
                    <img src={post.mediaUrl} alt="" className="max-h-40 rounded-xl border border-white/10 object-cover" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
