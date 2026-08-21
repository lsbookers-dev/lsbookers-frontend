'use client'

/**
 * AlbumsTab — Onglet Albums sur les profils
 * Affiche la grille d'albums, permet de créer / supprimer un album (owner),
 * et d'ouvrir un album pour voir ses items + ajouter des publications (owner).
 */

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Plus, Trash2, X, FolderOpen, Play, Lock, ImagePlus, ChevronLeft } from 'lucide-react'
import type { PubCardData } from './PublicationCard'
import PublicationModal from './PublicationModal'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

const ACCENT_CLASSES: Record<string, { btn: string; ring: string }> = {
  pink:   { btn: 'bg-pink-600 hover:bg-pink-500',     ring: 'ring-pink-500/50' },
  violet: { btn: 'bg-violet-600 hover:bg-violet-500', ring: 'ring-violet-500/50' },
  blue:   { btn: 'bg-blue-600 hover:bg-blue-500',     ring: 'ring-blue-500/50' },
}

// ─── Types ───────────────────────────────────────────────────────────────────

type AlbumSummary = {
  id: number
  title: string
  description?: string | null
  coverUrl?: string | null
  coverType?: string
  itemCount: number
  isPrivate?: boolean
  createdAt: string
}

type AlbumItem = {
  id: number
  mediaUrl?: string | null
  mediaType?: string | null
  caption?: string | null
  order: number
  publication?: PubCardData | null
}

type AlbumDetail = {
  id: number
  title: string
  description?: string | null
  isPrivate: boolean
  items: AlbumItem[]
}

type Props = {
  profileId: number
  isOwner?: boolean
  token?: string
  accent?: 'pink' | 'violet' | 'blue'
  /** Publications du profil (pour les ajouter à un album) */
  publications?: PubCardData[]
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AlbumsTab({
  profileId,
  isOwner = false,
  token = '',
  accent = 'pink',
  publications = [],
}: Props) {
  const { btn, ring } = ACCENT_CLASSES[accent] ?? ACCENT_CLASSES.pink

  const [albums, setAlbums]           = useState<AlbumSummary[]>([])
  const [loading, setLoading]         = useState(true)

  // Création d'album
  const [showCreate, setShowCreate]   = useState(false)
  const [newTitle, setNewTitle]       = useState('')
  const [newDesc, setNewDesc]         = useState('')
  const [newPrivate, setNewPrivate]   = useState(false)
  const [creating, setCreating]       = useState(false)

  // Detail album ouvert
  const [openAlbum, setOpenAlbum]     = useState<AlbumDetail | null>(null)
  const [loadingAlbum, setLoadingAlbum] = useState(false)

  // Vue d'une publication dans l'album
  const [selectedPub, setSelectedPub] = useState<PubCardData | null>(null)

  // Ajout de publications à l'album
  const [showAddPub, setShowAddPub]   = useState(false)
  const [addingPubId, setAddingPubId] = useState<number | null>(null)

  // ── Chargement des albums ─────────────────────────────────────────────────

  const loadAlbums = useCallback(async () => {
    setLoading(true)
    try {
      const endpoint = isOwner && token
        ? `${API_BASE}/api/albums/mine`
        : `${API_BASE}/api/albums/profile/${profileId}`

      const res = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      setAlbums(data.albums ?? [])
    } catch {
      setAlbums([])
    } finally {
      setLoading(false)
    }
  }, [profileId, isOwner, token])

  useEffect(() => { loadAlbums() }, [loadAlbums])

  // ── Créer un album ────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!newTitle.trim() || creating) return
    setCreating(true)
    try {
      const res = await fetch(`${API_BASE}/api/albums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() || null, isPrivate: newPrivate }),
      })
      if (!res.ok) throw new Error()
      setNewTitle(''); setNewDesc(''); setNewPrivate(false); setShowCreate(false)
      await loadAlbums()
    } catch {
      alert('Impossible de créer l\'album')
    } finally {
      setCreating(false)
    }
  }

  // ── Supprimer un album ────────────────────────────────────────────────────

  const handleDeleteAlbum = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Supprimer cet album ?')) return
    try {
      await fetch(`${API_BASE}/api/albums/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setAlbums(prev => prev.filter(a => a.id !== id))
      if (openAlbum?.id === id) setOpenAlbum(null)
    } catch {
      alert('Impossible de supprimer l\'album')
    }
  }

  // ── Ouvrir un album ───────────────────────────────────────────────────────

  const handleOpenAlbum = async (albumId: number) => {
    setLoadingAlbum(true)
    try {
      const res = await fetch(`${API_BASE}/api/albums/${albumId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      setOpenAlbum(data.album ?? null)
    } catch {
      alert('Impossible de charger l\'album')
    } finally {
      setLoadingAlbum(false)
    }
  }

  // ── Ajouter une publication à l'album ────────────────────────────────────

  const handleAddPubToAlbum = async (pubId: number) => {
    if (!openAlbum || addingPubId === pubId) return
    setAddingPubId(pubId)
    try {
      const res = await fetch(`${API_BASE}/api/albums/${openAlbum.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ publicationId: pubId }),
      })
      if (!res.ok) throw new Error()
      // Recharger l'album
      await handleOpenAlbum(openAlbum.id)
      setShowAddPub(false)
    } catch {
      alert('Impossible d\'ajouter la publication')
    } finally {
      setAddingPubId(null)
    }
  }

  // ── Supprimer un item de l'album ─────────────────────────────────────────

  const handleRemoveItem = async (itemId: number) => {
    if (!openAlbum) return
    try {
      await fetch(`${API_BASE}/api/albums/${openAlbum.id}/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setOpenAlbum(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== itemId) } : null)
      // Mettre à jour le count dans la liste
      setAlbums(prev => prev.map(a => a.id === openAlbum.id ? { ...a, itemCount: Math.max(0, a.itemCount - 1) } : a))
    } catch {
      alert('Impossible de retirer cet item')
    }
  }

  // ── IDs déjà dans l'album (pour éviter les doublons) ────────────────────

  const alreadyInAlbum = new Set(
    openAlbum?.items.map(i => i.publication?.id).filter(Boolean) ?? []
  )

  // ─────────────────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-white/30 text-sm">
        Chargement…
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70">
          {albums.length > 0 ? `${albums.length} album${albums.length > 1 ? 's' : ''}` : 'Aucun album'}
        </h3>
        {isOwner && (
          <button
            onClick={() => setShowCreate(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${btn} text-xs font-semibold text-white transition`}
          >
            <Plus size={14} /> Nouvel album
          </button>
        )}
      </div>

      {/* ── Grille albums ── */}
      {albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/30">
          <FolderOpen size={36} />
          <p className="text-sm">{isOwner ? 'Crée ton premier album !' : 'Aucun album public'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {albums.map(album => (
            <AlbumCard
              key={album.id}
              album={album}
              isOwner={isOwner}
              onOpen={handleOpenAlbum}
              onDelete={handleDeleteAlbum}
            />
          ))}
        </div>
      )}

      {/* ── Modal : créer un album ── */}
      {showCreate && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="max-w-sm w-full bg-neutral-950 border border-white/10 rounded-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Nouvel album</h3>
              <button onClick={() => setShowCreate(false)} className="text-neutral-400 hover:text-white"><X size={18} /></button>
            </div>
            <input
              className={`w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-1 ${ring} transition`}
              placeholder="Titre de l'album"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              maxLength={100}
              autoFocus
            />
            <textarea
              className={`w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-1 ${ring} transition resize-none`}
              placeholder="Description (optionnel)"
              rows={2}
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              maxLength={500}
            />
            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer select-none">
              <input type="checkbox" checked={newPrivate} onChange={e => setNewPrivate(e.target.checked)} className="accent-violet-500" />
              Album privé
            </label>
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || creating}
              className={`w-full py-2.5 rounded-xl ${btn} disabled:opacity-50 text-sm font-semibold transition`}
            >
              {creating ? 'Création…' : 'Créer l\'album'}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal : detail album ── */}
      {(loadingAlbum || openAlbum) && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-neutral-950 flex-shrink-0">
            <button onClick={() => setOpenAlbum(null)} className="text-white/60 hover:text-white transition">
              <ChevronLeft size={22} />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold truncate">{openAlbum?.title ?? '…'}</h3>
              {openAlbum?.description && (
                <p className="text-xs text-white/40 truncate">{openAlbum.description}</p>
              )}
            </div>
            {isOwner && openAlbum && (
              <button
                onClick={() => setShowAddPub(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${btn} text-xs font-semibold text-white transition`}
              >
                <ImagePlus size={14} /> Ajouter
              </button>
            )}
          </div>

          {/* Grille items */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingAlbum ? (
              <div className="flex items-center justify-center h-40 text-white/30 text-sm">Chargement…</div>
            ) : openAlbum && openAlbum.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-white/30">
                <FolderOpen size={32} />
                <p className="text-sm">{isOwner ? 'Ajoute des publications à cet album' : 'Cet album est vide'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {openAlbum?.items.map(item => {
                  // Source d'affichage : publication en priorité, sinon mediaUrl direct
                  const pub = item.publication
                  const mediaUrl = pub?.media ?? item.mediaUrl ?? ''
                  const mediaType = pub?.mediaType ?? item.mediaType ?? 'image'
                  const isImg = mediaType?.toLowerCase() === 'image'

                  return (
                    <div
                      key={item.id}
                      className="relative aspect-square rounded-xl overflow-hidden bg-white/5 group cursor-pointer"
                      onClick={() => pub && setSelectedPub(pub)}
                    >
                      {isImg ? (
                        <Image src={mediaUrl} alt="" fill className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                      ) : (
                        <>
                          <video src={mediaUrl} className="w-full h-full object-cover" muted preload="metadata" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/50 rounded-full p-2">
                              <Play size={16} className="text-white fill-white" />
                            </div>
                          </div>
                        </>
                      )}
                      {/* Bouton supprimer item (owner) */}
                      {isOwner && (
                        <button
                          onClick={e => { e.stopPropagation(); handleRemoveItem(item.id) }}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal : choisir une publication à ajouter ── */}
      {showAddPub && openAlbum && (
        <div className="fixed inset-0 z-[210] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowAddPub(false)}>
          <div className="w-full sm:max-w-lg bg-neutral-950 border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Ajouter une publication</h3>
              <button onClick={() => setShowAddPub(false)} className="text-neutral-400 hover:text-white"><X size={18} /></button>
            </div>

            {publications.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-6">Aucune publication disponible</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 overflow-y-auto flex-1">
                {publications.map(pub => {
                  const inAlbum = alreadyInAlbum.has(pub.id)
                  const isImg   = pub.mediaType?.toLowerCase() === 'image'
                  return (
                    <button
                      key={pub.id}
                      disabled={inAlbum || addingPubId === pub.id}
                      onClick={() => handleAddPubToAlbum(pub.id)}
                      className={`relative aspect-square rounded-lg overflow-hidden group ${inAlbum ? 'opacity-40 cursor-not-allowed' : 'hover:ring-2 hover:ring-white/40'} transition`}
                    >
                      {isImg ? (
                        <Image src={pub.media} alt={pub.title} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full bg-black/40 flex items-center justify-center">
                          <Play size={18} className="text-white/60 fill-white/60" />
                        </div>
                      )}
                      {inAlbum && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="text-[9px] font-bold text-white bg-black/60 rounded px-1">Déjà ajouté</span>
                        </div>
                      )}
                      {addingPubId === pub.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="text-[9px] text-white/60">…</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modale publication (vue détail) ── */}
      {selectedPub && (
        <PublicationModal
          pub={selectedPub}
          onClose={() => setSelectedPub(null)}
        />
      )}

      {/* Badge privé */}
      {openAlbum?.isPrivate && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[210] flex items-center gap-1.5 bg-black/80 text-white/60 text-xs px-3 py-1.5 rounded-full border border-white/10 pointer-events-none">
          <Lock size={11} /> Album privé
        </div>
      )}
    </div>
  )
}

// ─── Carte album ──────────────────────────────────────────────────────────────

function AlbumCard({
  album, isOwner, onOpen, onDelete,
}: {
  album: AlbumSummary
  isOwner: boolean
  onOpen: (id: number) => void
  onDelete: (id: number, e: React.MouseEvent) => void
}) {
  const isImg = album.coverType?.toLowerCase() === 'image'

  return (
    <div
      onClick={() => onOpen(album.id)}
      className="group cursor-pointer rounded-xl overflow-hidden border border-white/10 bg-black/30"
    >
      {/* Cover */}
      <div className="relative aspect-square bg-white/5">
        {album.coverUrl ? (
          isImg ? (
            <Image src={album.coverUrl} alt={album.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
          ) : (
            <>
              <video src={album.coverUrl} className="w-full h-full object-cover" muted preload="metadata" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Play size={18} className="text-white/60 fill-white/60" />
              </div>
            </>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <FolderOpen size={32} />
          </div>
        )}

        {/* Overlay + actions owner */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Bouton supprimer */}
        {isOwner && (
          <button
            onClick={e => onDelete(album.id, e)}
            className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
          >
            <Trash2 size={12} />
          </button>
        )}

        {/* Badge privé */}
        {album.isPrivate && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/60 text-white/60 rounded-full px-1.5 py-0.5 text-[10px]">
            <Lock size={9} /> Privé
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="px-2.5 py-2">
        <p className="text-xs font-semibold truncate">{album.title}</p>
        <p className="text-[10px] text-white/40 mt-0.5">{album.itemCount} élément{album.itemCount !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )
}
