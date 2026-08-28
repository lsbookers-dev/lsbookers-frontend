'use client'

/**
 * TagModal — Modal d'identification de personnes sur une publication existante.
 * Affiché quand l'auteur clique sur l'icône tag d'une PublicationCard.
 */

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, Tag, UserMinus, Search } from 'lucide-react'
import type { PubTag } from './PublicationCard'
import { getAuthToken } from '@/utils/auth'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

type TagUser = {
  id: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  profile?: { id: number; avatar?: string | null }
}

const displayName = (u: TagUser) =>
  u.pseudo || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Utilisateur'

const toAbs = (u?: string | null) => {
  if (!u) return ''
  if (u.startsWith('http')) return u
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

type Props = {
  pubId: number
  initialTags: PubTag[]
  onClose: () => void
  onTagsChange: (tags: PubTag[]) => void
}

export default function TagModal({ pubId, initialTags, onClose, onTagsChange }: Props) {
  const [tags,        setTags]        = useState<PubTag[]>(initialTags)
  const [query,       setQuery]       = useState('')
  const [results,     setResults]     = useState<TagUser[]>([])
  const [searching,   setSearching]   = useState(false)
  const [tagLoading,  setTagLoading]  = useState<number | null>(null) // userId en cours

  const token = getAuthToken()

  // Recherche utilisateurs
  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`${API_BASE}/api/search/users?q=${encodeURIComponent(q)}&limit=8`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        const taggedIds = new Set(tags.map(t => t.taggedUser.id))
        setResults((data.users || []).filter((u: TagUser) => !taggedIds.has(u.id)))
      }
    } catch { /* silent */ } finally { setSearching(false) }
  }, [token, tags])

  useEffect(() => {
    const t = setTimeout(() => searchUsers(query), 300)
    return () => clearTimeout(t)
  }, [query, searchUsers])

  const handleTag = async (userId: number) => {
    if (!token || tags.length >= 5) return
    setTagLoading(userId)
    try {
      const res = await fetch(`${API_BASE}/api/publications/${pubId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userIds: [userId] }),
      })
      if (res.ok) {
        const data = await res.json()
        const newTags = [...tags, ...data.tags]
        setTags(newTags)
        onTagsChange(newTags)
        setQuery('')
        setResults([])
      }
    } catch { /* silent */ } finally { setTagLoading(null) }
  }

  const handleRemove = async (tagId: number) => {
    if (!token) return
    try {
      await fetch(`${API_BASE}/api/publications/${pubId}/tags/${tagId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const newTags = tags.filter(t => t.id !== tagId)
      setTags(newTags)
      onTagsChange(newTags)
    } catch { /* silent */ }
  }

  const acceptedTags = tags.filter(t => t.status === 'ACCEPTED')
  const pendingTags  = tags.filter(t => t.status === 'PENDING')

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Tag size={15} className="text-violet-400" />
            <h3 className="font-semibold text-sm">Identifier des personnes</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Personnes déjà identifiées */}
          {tags.length > 0 && (
            <div>
              {acceptedTags.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {acceptedTags.map(t => (
                    <div key={t.id} className="flex items-center gap-2.5 px-3 py-2 bg-green-500/8 border border-green-500/20 rounded-xl">
                      {t.taggedUser.profile?.avatar ? (
                        <div className="relative h-7 w-7 rounded-full overflow-hidden shrink-0">
                          <Image src={toAbs(t.taggedUser.profile.avatar)} alt="" fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-xs font-bold">
                          {displayName(t.taggedUser)[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{displayName(t.taggedUser)}</p>
                        <p className="text-[10px] text-green-400">✓ Accepté</p>
                      </div>
                      <button onClick={() => handleRemove(t.id)} className="text-white/25 hover:text-red-400 transition shrink-0">
                        <UserMinus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {pendingTags.length > 0 && (
                <div className="space-y-1.5">
                  {pendingTags.map(t => (
                    <div key={t.id} className="flex items-center gap-2.5 px-3 py-2 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                      {t.taggedUser.profile?.avatar ? (
                        <div className="relative h-7 w-7 rounded-full overflow-hidden shrink-0">
                          <Image src={toAbs(t.taggedUser.profile.avatar)} alt="" fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-xs font-bold">
                          {displayName(t.taggedUser)[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{displayName(t.taggedUser)}</p>
                        <p className="text-[10px] text-amber-400">⏳ En attente de confirmation</p>
                      </div>
                      <button onClick={() => handleRemove(t.id)} className="text-white/25 hover:text-red-400 transition shrink-0">
                        <UserMinus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Champ de recherche */}
          {tags.length < 5 ? (
            <div className="relative">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher par pseudo ou nom…"
                  className="w-full bg-white/5 border border-white/12 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/40 transition"
                />
              </div>

              {searching && (
                <p className="text-[11px] text-white/30 mt-2 px-1">Recherche en cours…</p>
              )}

              {results.length > 0 && (
                <div className="mt-2 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                  {results.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleTag(u.id)}
                      disabled={tagLoading === u.id}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/6 transition text-left disabled:opacity-50"
                    >
                      {u.profile?.avatar ? (
                        <div className="relative h-8 w-8 rounded-full overflow-hidden shrink-0">
                          <Image src={toAbs(u.profile.avatar)} alt="" fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-sm font-bold">
                          {displayName(u)[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{displayName(u)}</p>
                        {u.pseudo && <p className="text-xs text-white/40">@{u.pseudo}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!searching && query.length >= 2 && results.length === 0 && (
                <p className="text-xs text-white/30 mt-2 px-1">Aucun résultat pour &quot;{query}&quot;</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-white/40 text-center py-2">Maximum 5 identifications atteint.</p>
          )}

          {tags.length === 0 && !query && (
            <p className="text-xs text-white/35 text-center py-1">
              Identifie jusqu&apos;à 5 personnes. Elles recevront une notification et pourront accepter ou refuser.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
