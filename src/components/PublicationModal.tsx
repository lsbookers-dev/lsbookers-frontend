'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import {
  X, Heart, Send, Trash2, MessageCircle, ChevronLeft, ChevronRight,
  Tag, Check, XCircle, Images, Share2, Loader2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { PubCardData, PubTag, PubTagUser } from './PublicationCard'
import { getAuthToken, apiFetch } from '@/utils/auth'
import TagModal from './TagModal'

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
  const commentsListRef = useRef<HTMLDivElement>(null)

  const [comments,        setComments]        = useState<Comment[]>([])
  const [loadingComs,     setLoadingComs]     = useState(true)
  const [newComment,      setNewComment]      = useState('')
  const [submitting,      setSubmitting]      = useState(false)

  const [liked,           setLiked]           = useState(initialLiked)
  const [likeCount,       setLikeCount]       = useState(pub._count?.likes ?? 0)
  const [commentCount,    setCommentCount]    = useState(pub._count?.comments ?? 0)
  const [likeLoading,     setLikeLoading]     = useState(false)
  const [shareDone,       setShareDone]       = useState(false)

  const [replyingTo,      setReplyingTo]      = useState<number | null>(null)
  const [replyText,       setReplyText]       = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)

  // ── Tags ──
  const [tags,         setTags]         = useState<PubTag[]>(pub.tags ?? [])
  const [showTagModal, setShowTagModal] = useState(false)

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
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handler)
    }
  }, [onClose])

  /* ── Charger les commentaires ── */
  const loadComments = useCallback(async () => {
    setLoadingComs(true)
    try {
      const profileId = user?.profile?.id
      const qs = profileId ? `?profileId=${profileId}` : ''
      const res = await apiFetch(`${API_BASE}/api/publications/${pub.id}/comments${qs}`)
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
    const list = commentsListRef.current
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' })
  }, [comments])

  /* ── Like publication ── */
  const handleLike = async () => {
    if (!user || likeLoading) return
    const token = getAuthToken()
    if (!token) return

    setLikeLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/api/publications/${pub.id}/like`, {
        method: 'POST',
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

  const handleShare = async () => {
    const data = { title: pub.title, text: pub.caption || pub.title, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(data)
      else await navigator.clipboard.writeText(window.location.href)
      setShareDone(true)
      window.setTimeout(() => setShareDone(false), 1800)
    } catch {
      /* Fermer la feuille de partage ne doit pas afficher d'erreur. */
    }
  }

  /* ── Like commentaire ── */
  const handleLikeComment = async (commentId: number) => {
    if (!user) return
    const token = getAuthToken()
    if (!token) return
    try {
      const res = await apiFetch(`${API_BASE}/api/publications/comments/${commentId}/like`, {
        method: 'POST',
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
      const res = await apiFetch(`${API_BASE}/api/publications/${pub.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const res = await apiFetch(`${API_BASE}/api/publications/${pub.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const res = await apiFetch(`${API_BASE}/api/publications/comments/${commentId}`, {
        method: 'DELETE',
        })
      if (res.ok) {
        if (isReply) {
          setComments(prev =>
            prev.map(c => {
              const hadReply = c.replies.some(r => r.id === commentId)
              return {
                ...c,
                replies: c.replies.filter(r => r.id !== commentId),
                // Décrémenter uniquement le compteur du commentaire parent de cette réponse
                _count: hadReply
                  ? { ...c._count, replies: Math.max(0, c._count.replies - 1) }
                  : c._count,
              }
            })
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

  /* ── Supprimer un tag ── */
  const handleRemoveTag = async (tagId: number) => {
    const token = getAuthToken()
    if (!token) return
    try {
      await apiFetch(`${API_BASE}/api/publications/${pub.id}/tags/${tagId}`, {
        method: 'DELETE',
        })
      setTags(prev => prev.filter(t => t.id !== tagId))
    } catch { /* silent */ }
  }

  /* ── Répondre à un tag (accepter / refuser) ── */
  const handleRespondTag = async (tagId: number, action: 'accept' | 'decline') => {
    const token = getAuthToken()
    if (!token) return
    try {
      const res = await apiFetch(`${API_BASE}/api/publications/${pub.id}/tags/${tagId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        const data = await res.json()
        setTags(prev => prev.map(t => t.id === tagId ? data.tag : t))
      }
    } catch { /* silent */ }
  }

  const tagDisplayName = (u: PubTagUser) =>
    u.pseudo || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Utilisateur'

  /* ── Rendu d'un commentaire (utilisé pour top-level ET replies) ── */
  const renderComment = (c: Comment, isReply = false) => {
    const isOwn = user?.profile?.id === c.profileId || Number(user?.profile?.id) === c.profileId
    const avatarUrl = toAbs(c.profile?.avatar) || '/default-avatar.png'
    const isReplying = replyingTo === c.id

    return (
      <div key={c.id} className={isReply ? 'ml-8 mt-3 border-l border-white/[0.08] pl-3 sm:ml-10' : ''}>
        <div className="flex gap-3">
          <div className="relative mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10 bg-violet-500/10">
            <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-white/90">{displayName(c.profile)}</span>
                <span className="ml-2 text-[9px] text-white/30">{timeAgo(c.createdAt)}</span>
              </div>
              {isOwn && (
                <button
                  type="button"
                  onClick={() => handleDeleteComment(c.id, isReply)}
                  aria-label="Supprimer le commentaire"
                  className="mt-0.5 shrink-0 rounded-lg p-1 text-white/20 transition hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-white/68">{c.content}</p>

            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleLikeComment(c.id)}
                disabled={!user}
                className={`flex items-center gap-1 text-[9px] transition ${
                  c.likedByMe ? 'text-pink-300' : 'text-white/30 hover:text-white/60'
                } disabled:cursor-not-allowed`}
              >
                <Heart
                  size={11}
                  className={c.likedByMe ? 'fill-current' : ''}
                />
                <span>J&apos;aime{c._count.likes > 0 ? ` · ${c._count.likes}` : ''}</span>
              </button>

              {!isReply && user && (
                <button
                  type="button"
                  onClick={() => {
                    if (isReplying) {
                      setReplyingTo(null)
                      setReplyText('')
                    } else {
                      setReplyingTo(c.id)
                      setReplyText('')
                    }
                  }}
                  className="flex items-center gap-1 text-[9px] text-white/30 transition hover:text-white/60"
                >
                  {isReplying ? 'Annuler' : 'Répondre'}
                  {c._count.replies > 0 && !isReplying && (
                    <span className="text-white/25">· {c._count.replies}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {c.replies?.length > 0 && (
          <div className="mt-3 space-y-3">
            {c.replies.map(r => renderComment(r, true))}
          </div>
        )}

        {isReplying && (
          <div className="ml-11 mt-3 flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={`Répondre à ${displayName(c.profile)}…`}
              maxLength={500}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/10"
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); handleReply(c.id) }
                if (e.key === 'Escape') { setReplyingTo(null); setReplyText('') }
              }}
            />
            <button
              type="button"
              onClick={() => handleReply(c.id)}
              disabled={!replyText.trim() || replySubmitting}
              aria-label="Envoyer la réponse"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-35"
            >
              {replySubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            </button>
          </div>
        )}
      </div>
    )
  }

  const acceptedTags = tags.filter(tag => tag.status === 'ACCEPTED')
  const isImage = currentMedia.mediaType?.toLowerCase() === 'image'

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center bg-black/88 backdrop-blur-md lg:items-center lg:p-5"
        onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-label={`Publication : ${pub.title}`}
          className="relative flex h-[100dvh] w-full max-w-6xl flex-col overflow-y-auto bg-[#0b0a0e] shadow-[0_35px_110px_rgba(0,0,0,.7)] lg:h-[min(90dvh,820px)] lg:flex-row lg:overflow-hidden lg:rounded-[1.45rem] lg:border lg:border-white/10"
          onMouseDown={event => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-3 top-3 z-30 grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-black/65 text-white/65 backdrop-blur-md transition hover:border-white/25 hover:bg-black/85 hover:text-white lg:right-4 lg:top-4"
          >
            <X size={17} />
          </button>

          <div className="group relative h-[58dvh] min-h-[430px] max-h-[620px] shrink-0 overflow-hidden bg-black lg:h-full lg:max-h-none lg:min-h-0 lg:w-[64%]">
            {isImage ? (
              <>
                <Image src={currentMedia.url} alt="" fill className="scale-110 object-cover opacity-45 blur-2xl" unoptimized />
                <Image src={currentMedia.url} alt={pub.title} fill className="z-[1] object-contain" unoptimized priority />
              </>
            ) : (
              <video
                key={currentMedia.url}
                src={currentMedia.url}
                controls
                autoPlay
                playsInline
                className="absolute inset-0 z-[1] h-full w-full object-contain"
              />
            )}

            <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black/65 via-transparent to-black/95" />

            <div className="absolute left-4 top-4 z-[5] sm:left-5 sm:top-5">
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-violet-200">Portfolio vivant</p>
              <p className="mt-1 text-[10px] text-white/55">{pub.createdAt ? timeAgo(pub.createdAt) : 'Publication récente'}</p>
            </div>

            {allMedia.length > 1 && (
              <span className="absolute left-4 top-[4.3rem] z-[5] inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1.5 text-[9px] text-white/75 backdrop-blur-md sm:left-5">
                <Images size={12} /> {mediaIndex + 1} / {allMedia.length}
              </span>
            )}

            {allMedia.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setMediaIndex(index => Math.max(0, index - 1))}
                  disabled={mediaIndex === 0}
                  aria-label="Média précédent"
                  className="absolute left-3 top-1/2 z-[6] grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/55 text-white/75 backdrop-blur-md transition hover:bg-black/80 hover:text-white disabled:opacity-20 sm:left-5"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setMediaIndex(index => Math.min(allMedia.length - 1, index + 1))}
                  disabled={mediaIndex === allMedia.length - 1}
                  aria-label="Média suivant"
                  className="absolute right-3 top-1/2 z-[6] grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/55 text-white/75 backdrop-blur-md transition hover:bg-black/80 hover:text-white disabled:opacity-20 sm:right-5"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            <div className="absolute bottom-5 left-4 right-[4.8rem] z-[5] sm:bottom-6 sm:left-6 sm:right-24">
              <h2 className="font-serif text-[clamp(1.8rem,4vw,2.8rem)] font-semibold leading-[1.02] text-white drop-shadow-lg">{pub.title}</h2>
              {pub.caption && <p className="mt-2.5 max-w-2xl text-[11px] leading-relaxed text-white/70 sm:text-xs">{pub.caption}</p>}

              {acceptedTags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {acceptedTags.map(tag => (
                    <span key={tag.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-black/45 py-1 pl-1 pr-2 text-[9px] text-white/70 backdrop-blur-md">
                      <span className="relative grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-600 text-[7px] font-bold text-white">
                        {tag.taggedUser.profile?.avatar
                          ? <Image src={toAbs(tag.taggedUser.profile.avatar)} alt="" fill className="object-cover" unoptimized />
                          : tagDisplayName(tag.taggedUser).slice(0, 2).toUpperCase()}
                      </span>
                      {tagDisplayName(tag.taggedUser)}
                      {(isAuthor || tag.taggedUser.id === Number(user?.id)) && (
                        <button type="button" onClick={() => handleRemoveTag(tag.id)} aria-label={`Retirer ${tagDisplayName(tag.taggedUser)}`} className="ml-0.5 text-white/35 transition hover:text-red-300">
                          <XCircle size={10} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="absolute bottom-5 right-3 z-[7] grid gap-2 sm:bottom-6 sm:right-5">
              <span className="grid justify-items-center gap-1">
                <button
                  type="button"
                  onClick={handleLike}
                  disabled={!user || likeLoading}
                  aria-label={liked ? 'Retirer le J’aime' : 'Aimer'}
                  className={`grid h-11 w-11 place-items-center rounded-full border backdrop-blur-md transition ${liked ? 'border-pink-400/40 bg-pink-500/20 text-pink-300' : 'border-white/15 bg-black/55 text-white/80 hover:bg-white/10'} disabled:opacity-35`}
                >
                  {likeLoading ? <Loader2 size={16} className="animate-spin" /> : <Heart size={17} className={liked ? 'fill-current' : ''} />}
                </button>
                <span className="text-[9px] text-white/65">{likeCount}</span>
              </span>
              <span className="grid justify-items-center gap-1">
                <button type="button" onClick={() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })} aria-label="Voir les commentaires" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/55 text-white/80 backdrop-blur-md transition hover:bg-white/10">
                  <MessageCircle size={17} />
                </button>
                <span className="text-[9px] text-white/65">{commentCount}</span>
              </span>
              <button type="button" onClick={handleShare} aria-label="Partager" className="relative grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/55 text-white/80 backdrop-blur-md transition hover:bg-white/10">
                {shareDone ? <Check size={17} /> : <Share2 size={16} />}
              </button>
            </div>

            {allMedia.length > 1 && (
              <div className="absolute bottom-3 left-1/2 z-[6] flex -translate-x-1/2 gap-1 lg:bottom-4">
                {allMedia.map((_, index) => (
                  <button key={index} type="button" onClick={() => setMediaIndex(index)} aria-label={`Afficher le média ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === mediaIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/35'}`} />
                ))}
              </div>
            )}
          </div>

          <aside className="flex min-h-[520px] flex-1 flex-col overflow-hidden border-white/10 bg-[radial-gradient(circle_at_100%_0%,rgba(168,85,247,.08),transparent_32%),#0d0b10] lg:min-h-0 lg:w-[36%] lg:border-l">
            <header className="shrink-0 border-b border-white/[0.08] px-4 pb-4 pt-5 pr-16 sm:px-5 sm:pr-16">
              <p className="text-[9px] text-white/35">{likeCount} J’aime · {commentCount} commentaire{commentCount !== 1 ? 's' : ''}</p>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <h3 className="font-serif text-xl font-semibold text-white">Échanges</h3>
                {isAuthor && tags.length < 5 && (
                  <button type="button" onClick={() => setShowTagModal(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.035] px-2.5 py-2 text-[10px] text-white/45 transition hover:border-violet-400/30 hover:text-violet-200">
                    <Tag size={13} /> Identifier {tags.length > 0 ? `${tags.length}/5` : ''}
                  </button>
                )}
              </div>
            </header>

            {myPendingTag && (
              <div className="mx-4 mt-4 flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.08] p-3 sm:mx-5">
                <Tag size={14} className="shrink-0 text-amber-300" />
                <p className="min-w-[150px] flex-1 text-[10px] leading-relaxed text-amber-100/80">Vous avez été identifié dans cette publication.</p>
                <button type="button" onClick={() => handleRespondTag(myPendingTag.id, 'accept')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1.5 text-[9px] text-emerald-200 transition hover:bg-emerald-500/30"><Check size={10} /> Accepter</button>
                <button type="button" onClick={() => handleRespondTag(myPendingTag.id, 'decline')} className="inline-flex items-center gap-1 rounded-lg bg-white/[0.05] px-2 py-1.5 text-[9px] text-white/50 transition hover:text-white"><XCircle size={10} /> Refuser</button>
              </div>
            )}

            <div ref={commentsListRef} className="min-h-[300px] flex-1 space-y-5 p-4 sm:p-5 lg:overflow-y-auto">
              {loadingComs ? (
                <div className="grid min-h-40 place-items-center"><span className="inline-flex items-center gap-2 text-xs text-white/35"><Loader2 size={15} className="animate-spin text-violet-300" /> Chargement…</span></div>
              ) : comments.length === 0 ? (
                <div className="grid min-h-40 place-items-center text-center">
                  <div><span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-300/65"><MessageCircle size={18} /></span><p className="mt-3 text-xs font-medium text-white/60">Aucun commentaire pour l&apos;instant</p>{user && <p className="mt-1 text-[10px] text-white/30">Lancez la conversation.</p>}</div>
                </div>
              ) : comments.map(comment => renderComment(comment, false))}
              <div ref={commentsEndRef} />
            </div>

            {user ? (
              <form onSubmit={handleSubmit} className="flex shrink-0 items-center gap-2 border-t border-white/[0.08] bg-[#0a090d] p-3.5 sm:p-4">
                <input
                  type="text"
                  value={newComment}
                  onChange={event => setNewComment(event.target.value)}
                  placeholder="Ajouter un commentaire…"
                  maxLength={500}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/10"
                />
                <button type="submit" disabled={!newComment.trim() || submitting} aria-label="Envoyer le commentaire" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-[0_10px_25px_rgba(168,85,247,.2)] transition hover:brightness-110 disabled:opacity-35">
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </form>
            ) : (
              <p className="shrink-0 border-t border-white/[0.08] px-5 py-4 text-xs text-white/35">Connectez-vous pour commenter.</p>
            )}
          </aside>
        </section>
      </div>

      {showTagModal && (
        <TagModal
          pubId={pub.id}
          initialTags={tags}
          onClose={() => setShowTagModal(false)}
          onTagsChange={newTags => setTags(newTags)}
        />
      )}
    </>
  )
}
