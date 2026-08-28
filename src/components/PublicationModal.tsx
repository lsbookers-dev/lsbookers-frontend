'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { X, Heart, Send, Trash2, MessageCircle, ChevronLeft, ChevronRight, Tag, UserPlus, Check, XCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { PubCardData, PubTag, PubTagUser } from './PublicationCard'
import { getAuthToken } from '@/utils/auth'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

type CommentProfile = {
  id: number
  avatar?: string | null
  user?: { id: number; pseudo?: string | null; firstName?: string | null; lastName?: string | null }
}

type Comment = {
  id: number
  content: string
  createdAt: string
  profileId: number
  profile?: CommentProfile
  likedByMe: boolean
  _count: { likes: number; replies: number }
  replies: Comment[]
}

const toAbs = (u?: string | null) => {
  if (!u) return ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('//')) return `https:${u}`
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

const displayName = (p?: CommentProfile) => {
  if (!p?.user) return 'Utilisateur'
  return p.user.pseudo || [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') || 'Utilisateur'
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)  return `Il y a ${d}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/** Met à jour le like d'un commentaire dans la liste (top-level ou reply) */
function applyCommentLike(list: Comment[], id: number, liked: boolean, count: number): Comment[] {
  return list.map(c => {
    if (c.id === id) return { ...c, likedByMe: liked, _count: { ...c._count, likes: count } }
    if (c.replies.length > 0) return { ...c, replies: applyCommentLike(c.replies, id, liked, count) }
    return c
  })
}

type TagSearchUser = {
  id: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  profile?: { id: number; avatar?: string | null }
}

type Props = {
  pub: PubCardData
  onClose: () => void
  /** ID du propriétaire de la publication (pour les actions auteur) */
  ownerUserId?: number
  /** Permet à la page de mettre à jour le compteur en temps réel */
  onCountChange?: (pubId: number, likes: number, comments: number) => void
  /** Le viewer a déjà liké ? (optionnel) */
  initialLiked?: boolean
}

export default function PublicationModal({ pub, onClose, ownerUserId, onCountChange, initialLiked = false }: Props) {
  const { user } = useAuth()
  const commentsEndRef = useRef<HTMLDivElement>(null)

  const [comments,        setComments]        = useState<Comment[]>([])
  const [loadingComs,     setLoadingComs]     = useState(true)
  const [newComment,      setNewComment]      = useState('')
  const [submitting,      setSubmitting]      = useState(false)

  const [liked,           setLiked]           = useState(initialLiked)
  const [likeCount,       setLikeCount]       = useState(pub._count?.likes ?? 0)
  const [commentCount,    setCommentCount]    = useState(pub._count?.comments ?? 0)
  const [likeLoading,     setLikeLoading]     = useState(false)

  const [replyingTo,      setReplyingTo]      = useState<number | null>(null)
  const [replyText,       setReplyText]       = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)

  // ── Tags ──
  const [tags,            setTags]            = useState<PubTag[]>(pub.tags ?? [])
  const [showTagInput,    setShowTagInput]    = useState(false)
  const [tagQuery,        setTagQuery]        = useState('')
  const [tagResults,      setTagResults]      = useState<TagSearchUser[]>([])
  const [tagSearching,    setTagSearching]    = useState(false)
  const [tagLoading,      setTagLoading]      = useState(false)

  const isAuthor = !!user && !!ownerUserId && Number(user.id) === ownerUserId
  const myPendingTag = tags.find(t => t.taggedUser.id === Number(user?.id) && t.status === 'PENDING')

  /* ── Galerie multi-médias ── */
  const allMedia = [
    { url: pub.media, mediaType: pub.mediaType as string },
    ...(pub.additionalMedia ?? []).map(m => ({ url: m.url, mediaType: m.mediaType as string })),
  ]
  const [mediaIndex, setMediaIndex] = useState(0)
  const currentMedia = allMedia[mediaIndex] ?? allMedia[0]

  /* ── Fermer avec Escape ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  /* ── Charger les commentaires ── */
  const loadComments = useCallback(async () => {
    setLoadingComs(true)
    try {
      const profileId = user?.profile?.id
      const qs = profileId ? `?profileId=${profileId}` : ''
      const res = await fetch(`${API_BASE}/api/publications/${pub.id}/comments${qs}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch (err) {
      console.error('Erreur chargement commentaires:', err)
    } finally {
      setLoadingComs(false)
    }
  }, [pub.id, user?.profile?.id])

  useEffect(() => { loadComments() }, [loadComments])

  /* ── Scroll auto vers le bas quand nouveaux commentaires ── */
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  /* ── Like publication ── */
  const handleLike = async () => {
    if (!user || likeLoading) return
    const token = getAuthToken()
    if (!token) return

    setLikeLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/publications/${pub.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setLiked(data.liked)
        setLikeCount(data.count)
        onCountChange?.(pub.id, data.count, commentCount)
      }
    } catch (err) {
      console.error('Erreur like:', err)
    } finally {
      setLikeLoading(false)
    }
  }

  /* ── Like commentaire ── */
  const handleLikeComment = async (commentId: number) => {
    if (!user) return
    const token = getAuthToken()
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/publications/comments/${commentId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setComments(prev => applyCommentLike(prev, commentId, data.liked, data.count))
      }
    } catch (err) {
      console.error('Erreur like commentaire:', err)
    }
  }

  /* ── Envoyer un commentaire ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting || !user) return

    const token = getAuthToken()
    if (!token) return

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/publications/${pub.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      if (res.ok) {
        const comment = await res.json()
        setComments(prev => [...prev, { ...comment, replies: comment.replies ?? [], likedByMe: false, _count: comment._count ?? { likes: 0, replies: 0 } }])
        const newCount = commentCount + 1
        setCommentCount(newCount)
        onCountChange?.(pub.id, likeCount, newCount)
        setNewComment('')
      }
    } catch (err) {
      console.error('Erreur commentaire:', err)
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Envoyer une réponse ── */
  const handleReply = async (parentId: number) => {
    if (!replyText.trim() || replySubmitting || !user) return
    const token = getAuthToken()
    if (!token) return

    setReplySubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/publications/${pub.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: replyText.trim(), parentId }),
      })
      if (res.ok) {
        const reply = await res.json()
        const normalizedReply: Comment = {
          ...reply,
          replies: [],
          likedByMe: false,
          _count: reply._count ?? { likes: 0, replies: 0 },
        }
        setComments(prev =>
          prev.map(c =>
            c.id === parentId
              ? { ...c, replies: [...(c.replies ?? []), normalizedReply], _count: { ...c._count, replies: c._count.replies + 1 } }
              : c
          )
        )
        const newCount = commentCount + 1
        setCommentCount(newCount)
        onCountChange?.(pub.id, likeCount, newCount)
        setReplyText('')
        setReplyingTo(null)
      }
    } catch (err) {
      console.error('Erreur réponse:', err)
    } finally {
      setReplySubmitting(false)
    }
  }

  /* ── Supprimer un commentaire ou une réponse ── */
  const handleDeleteComment = async (commentId: number, isReply = false) => {
    const token = getAuthToken()
    if (!token) return

    try {
      const res = await fetch(`${API_BASE}/api/publications/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        if (isReply) {
          setComments(prev =>
            prev.map(c => ({
              ...c,
              replies: c.replies.filter(r => r.id !== commentId),
              _count: { ...c._count, replies: Math.max(0, c._count.replies - 1) },
            }))
          )
        } else {
          setComments(prev => prev.filter(c => c.id !== commentId))
        }
        const newCount = Math.max(0, commentCount - 1)
        setCommentCount(newCount)
        onCountChange?.(pub.id, likeCount, newCount)
      }
    } catch (err) {
      console.error('Erreur suppression commentaire:', err)
    }
  }

  /* ── Recherche utilisateurs pour tag ── */
  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setTagResults([]); return }
    setTagSearching(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/api/search/users?q=${encodeURIComponent(q)}&limit=8`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        // Filtrer ceux déjà tagués
        const taggedIds = new Set(tags.map(t => t.taggedUser.id))
        setTagResults((data.users || data || []).filter((u: TagSearchUser) => !taggedIds.has(u.id)))
      }
    } catch { /* silent */ } finally { setTagSearching(false) }
  }, [tags])

  useEffect(() => {
    const t = setTimeout(() => searchUsers(tagQuery), 300)
    return () => clearTimeout(t)
  }, [tagQuery, searchUsers])

  /* ── Taguer un utilisateur ── */
  const handleTag = async (targetUserId: number) => {
    if (tagLoading || tags.length >= 5) return
    const token = getAuthToken()
    if (!token) return
    setTagLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/publications/${pub.id}/tags`, {
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

  /* ── Supprimer un tag ── */
  const handleRemoveTag = async (tagId: number) => {
    const token = getAuthToken()
    if (!token) return
    try {
      await fetch(`${API_BASE}/api/publications/${pub.id}/tags/${tagId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setTags(prev => prev.filter(t => t.id !== tagId))
    } catch { /* silent */ }
  }

  /* ── Répondre à un tag (accepter / refuser) ── */
  const handleRespondTag = async (tagId: number, action: 'accept' | 'decline') => {
    const token = getAuthToken()
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/publications/${pub.id}/tags/${tagId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        const data = await res.json()
        setTags(prev => prev.map(t => t.id === tagId ? data.tag : t))
      }
    } catch { /* silent */ }
  }

  const tagDisplayName = (u: PubTagUser | TagSearchUser) =>
    u.pseudo || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Utilisateur'

  /* ── Rendu d'un commentaire (utilisé pour top-level ET replies) ── */
  const renderComment = (c: Comment, isReply = false) => {
    const isOwn = user?.profile?.id === c.profileId || Number(user?.profile?.id) === c.profileId
    const avatarUrl = toAbs(c.profile?.avatar) || '/default-avatar.png'
    const isReplying = replyingTo === c.id

    return (
      <div key={c.id} className={isReply ? 'ml-9 mt-2' : ''}>
        <div className="flex gap-2.5">
          <div className="relative h-7 w-7 rounded-full overflow-hidden shrink-0 mt-0.5">
            <Image src={avatarUrl} alt="avatar" fill className="object-cover" unoptimized />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-semibold">{displayName(c.profile)}</span>
                <span className="ml-2 text-[10px] text-white/35">{timeAgo(c.createdAt)}</span>
              </div>
              {isOwn && (
                <button
                  onClick={() => handleDeleteComment(c.id, isReply)}
                  className="text-white/25 hover:text-red-400 transition shrink-0 mt-0.5"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            <p className="text-xs text-white/75 mt-0.5 leading-relaxed">{c.content}</p>

            {/* Actions : like + répondre */}
            <div className="flex items-center gap-3 mt-1.5">
              <button
                onClick={() => handleLikeComment(c.id)}
                disabled={!user}
                className={`flex items-center gap-1 text-[10px] transition ${
                  c.likedByMe ? 'text-red-400' : 'text-white/35 hover:text-white/60'
                } disabled:cursor-not-allowed`}
              >
                <Heart
                  size={11}
                  className={c.likedByMe ? 'fill-red-400 stroke-red-400' : ''}
                />
                {c._count.likes > 0 && <span>{c._count.likes}</span>}
              </button>

              {!isReply && user && (
                <button
                  onClick={() => {
                    if (isReplying) {
                      setReplyingTo(null)
                      setReplyText('')
                    } else {
                      setReplyingTo(c.id)
                      setReplyText('')
                    }
                  }}
                  className="flex items-center gap-1 text-[10px] text-white/35 hover:text-white/60 transition"
                >
                  <MessageCircle size={11} />
                  {isReplying ? 'Annuler' : 'Répondre'}
                  {c._count.replies > 0 && !isReplying && (
                    <span className="ml-0.5 text-white/25">({c._count.replies})</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Réponses imbriquées */}
        {c.replies?.length > 0 && (
          <div className="mt-2 space-y-3">
            {c.replies.map(r => renderComment(r, true))}
          </div>
        )}

        {/* Champ de réponse inline */}
        {isReplying && (
          <div className="ml-9 mt-2 flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={`Répondre à ${displayName(c.profile)}…`}
              maxLength={500}
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition"
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); handleReply(c.id) }
                if (e.key === 'Escape') { setReplyingTo(null); setReplyText('') }
              }}
            />
            <button
              onClick={() => handleReply(c.id)}
              disabled={!replyText.trim() || replySubmitting}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-full p-1.5 transition"
            >
              <Send size={12} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[95vh] md:h-[88vh] bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Bouton fermer ── */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition"
        >
          <X size={18} />
        </button>

        {/* ── Galerie médias (gauche) ── */}
        <div className="md:w-3/5 bg-black flex items-center justify-center min-h-[260px] md:min-h-0 md:h-full overflow-hidden relative">
          {currentMedia.mediaType === 'image' ? (
            <div className="relative w-full h-72 md:h-full">
              <Image src={currentMedia.url} alt={pub.title} fill className="object-contain" unoptimized />
            </div>
          ) : (
            <video
              key={currentMedia.url}
              src={currentMedia.url}
              controls
              autoPlay
              playsInline
              className="w-full h-full max-h-[70vh] md:max-h-full object-contain"
            />
          )}

          {/* Navigation flèches */}
          {allMedia.length > 1 && (
            <>
              <button
                onClick={() => setMediaIndex(i => Math.max(0, i - 1))}
                disabled={mediaIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition disabled:opacity-20 z-10"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setMediaIndex(i => Math.min(allMedia.length - 1, i + 1))}
                disabled={mediaIndex === allMedia.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition disabled:opacity-20 z-10"
              >
                <ChevronRight size={18} />
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                {allMedia.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setMediaIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition ${i === mediaIndex ? 'bg-white' : 'bg-white/30'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Panneau droit : infos + commentaires ── */}
        <div className="md:w-2/5 flex flex-col border-l border-white/10 overflow-hidden">

          {/* En-tête : titre + caption */}
          <div className="p-4 border-b border-white/10 shrink-0 space-y-2">
            <p className="font-semibold text-sm">{pub.title}</p>
            {pub.caption && (
              <p className="text-xs text-white/55 leading-relaxed">{pub.caption}</p>
            )}

            {/* ── Tags ── */}
            {tags.filter(t => t.status === 'ACCEPTED').length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.filter(t => t.status === 'ACCEPTED').map(t => (
                  <div key={t.id} className="flex items-center gap-1 bg-white/8 rounded-full px-2 py-0.5">
                    {t.taggedUser.profile?.avatar && (
                      <div className="relative h-4 w-4 rounded-full overflow-hidden shrink-0">
                        <Image src={toAbs(t.taggedUser.profile.avatar)} alt="" fill className="object-cover" unoptimized />
                      </div>
                    )}
                    <span className="text-[11px] text-white/70">@{tagDisplayName(t.taggedUser)}</span>
                    {(isAuthor || t.taggedUser.id === Number(user?.id)) && (
                      <button onClick={() => handleRemoveTag(t.id)} className="text-white/30 hover:text-red-400 transition ml-0.5">
                        <XCircle size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pending tag pour MOI — accepter/refuser */}
            {myPendingTag && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                <Tag size={13} className="text-amber-400 shrink-0" />
                <p className="text-xs text-amber-200 flex-1">Tu as été identifié(e) dans cette publication.</p>
                <button onClick={() => handleRespondTag(myPendingTag.id, 'accept')}
                  className="flex items-center gap-1 text-[11px] bg-green-600/80 hover:bg-green-600 text-white rounded-full px-2 py-0.5 transition">
                  <Check size={10} /> Accepter
                </button>
                <button onClick={() => handleRespondTag(myPendingTag.id, 'decline')}
                  className="flex items-center gap-1 text-[11px] bg-white/10 hover:bg-white/20 text-white/60 rounded-full px-2 py-0.5 transition">
                  <XCircle size={10} /> Refuser
                </button>
              </div>
            )}

            {/* Bouton + tag (auteur seulement) */}
            {isAuthor && tags.length < 5 && (
              <div>
                <button
                  onClick={() => setShowTagInput(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition"
                >
                  <UserPlus size={13} />
                  Identifier quelqu&apos;un {tags.length > 0 ? `(${tags.length}/5)` : ''}
                </button>

                {showTagInput && (
                  <div className="mt-2 relative">
                    <input
                      autoFocus
                      value={tagQuery}
                      onChange={e => setTagQuery(e.target.value)}
                      placeholder="Rechercher par pseudo…"
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-violet-500/50 transition"
                    />
                    {tagSearching && <p className="text-[10px] text-white/30 mt-1">Recherche…</p>}
                    {tagResults.length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                        {tagResults.map(u => (
                          <button
                            key={u.id}
                            onClick={() => handleTag(u.id)}
                            disabled={tagLoading}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/8 transition text-left"
                          >
                            {u.profile?.avatar ? (
                              <div className="relative h-7 w-7 rounded-full overflow-hidden shrink-0">
                                <Image src={toAbs(u.profile.avatar)} alt="" fill className="object-cover" unoptimized />
                              </div>
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-xs font-bold">
                                {tagDisplayName(u)[0]?.toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm">{tagDisplayName(u)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Liste des commentaires (scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {loadingComs ? (
              <p className="text-xs text-white/40 text-center pt-4">Chargement…</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-white/40 text-center pt-4">
                Aucun commentaire pour l&apos;instant.
                {user ? ' Soyez le premier !' : ''}
              </p>
            ) : (
              comments.map(c => renderComment(c, false))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Barre de likes */}
          <div className="px-4 py-2 border-t border-white/10 flex items-center gap-3 shrink-0">
            <button
              onClick={handleLike}
              disabled={!user || likeLoading}
              className={`flex items-center gap-1.5 text-sm transition ${
                liked ? 'text-red-500' : 'text-white/50 hover:text-white'
              } ${!user ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Heart
                size={18}
                className={liked ? 'fill-red-500 stroke-red-500' : ''}
              />
              <span className="font-medium">{likeCount}</span>
            </button>
            <span className="text-xs text-white/30">{commentCount} commentaire{commentCount !== 1 ? 's' : ''}</span>
          </div>

          {/* Saisie commentaire */}
          {user ? (
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 px-4 py-3 border-t border-white/10 shrink-0"
            >
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire…"
                maxLength={500}
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-full p-2 transition"
              >
                <Send size={14} />
              </button>
            </form>
          ) : (
            <p className="px-4 py-3 text-xs text-white/35 border-t border-white/10 shrink-0">
              Connectez-vous pour commenter.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
