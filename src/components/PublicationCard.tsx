'use client'

import Image from 'next/image'
import { Heart, MessageCircle, Play, Images, Tag } from 'lucide-react'

export type PubMediaItem = {
  id?: number
  url: string
  mediaType: 'image' | 'video' | string
  order?: number
}

export type PubTagUser = {
  id: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  profile?: { id: number; avatar?: string | null }
}

export type PubTag = {
  id: number
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  taggedUser: PubTagUser
}

export type PubCardData = {
  id: number
  title: string
  media: string
  mediaType: 'image' | 'video' | string
  caption?: string
  additionalMedia?: PubMediaItem[]
  tags?: PubTag[]
  _count?: { likes: number; comments: number }
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const toAbs = (u?: string | null) => {
  if (!u) return ''
  if (u.startsWith('http')) return u
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

type Props = {
  pub: PubCardData
  onClick: (pub: PubCardData) => void
  /** Affiche le titre sous la carte (mode liste). Par défaut: false */
  showTitle?: boolean
  /** Si l'utilisateur connecté est l'auteur → affiche le bouton tag */
  isOwner?: boolean
  /** Callback quand l'auteur clique sur l'icône tag */
  onTagClick?: (pub: PubCardData) => void
}

export default function PublicationCard({ pub, onClick, showTitle = false, isOwner = false, onTagClick }: Props) {
  const likes      = pub._count?.likes    ?? 0
  const comments   = pub._count?.comments ?? 0
  const isImage    = pub.mediaType?.toLowerCase() === 'image'
  const extraCount = pub.additionalMedia?.length ?? 0

  // Tags acceptés uniquement pour l'overlay
  const acceptedTags = pub.tags?.filter(t => t.status === 'ACCEPTED') ?? []
  const pendingTags  = pub.tags?.filter(t => t.status === 'PENDING')  ?? []

  return (
    <div
      onClick={() => onClick(pub)}
      className="group relative rounded-xl overflow-hidden border border-white/10 bg-black/30 cursor-pointer"
    >
      {/* ── Média principal ── */}
      <div className="relative w-full aspect-square">
        {isImage ? (
          <Image
            src={pub.media}
            alt={pub.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <>
            <video
              src={pub.media}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 rounded-full p-3">
                <Play size={20} className="text-white fill-white" />
              </div>
            </div>
          </>
        )}

        {/* ── Badge multi-photos ── */}
        {extraCount > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 pointer-events-none">
            <Images size={11} className="text-white" />
            <span className="text-white text-[10px] font-semibold">+{extraCount}</span>
          </div>
        )}

        {/* ── Overlay tags acceptés (bas-gauche, comme Instagram) ── */}
        {acceptedTags.length > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center pointer-events-none">
            <div className="flex -space-x-1.5">
              {acceptedTags.slice(0, 3).map(t => (
                t.taggedUser.profile?.avatar ? (
                  <div key={t.id} className="relative h-5 w-5 rounded-full overflow-hidden border border-black/60 shrink-0">
                    <Image src={toAbs(t.taggedUser.profile.avatar)} alt="" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div key={t.id} className="h-5 w-5 rounded-full bg-violet-600 border border-black/60 shrink-0 flex items-center justify-center text-[8px] font-bold text-white">
                    {(t.taggedUser.pseudo || t.taggedUser.firstName || '?')[0]?.toUpperCase()}
                  </div>
                )
              ))}
            </div>
            {acceptedTags.length > 3 && (
              <span className="ml-1 text-[10px] text-white/70 bg-black/50 rounded-full px-1">+{acceptedTags.length - 3}</span>
            )}
          </div>
        )}

        {/* ── Badge tags en attente (point orange) ── */}
        {pendingTags.length > 0 && isOwner && (
          <div className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-amber-400 border border-black/60 pointer-events-none" />
        )}

        {/* ── Overlay hover ── */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6">
          <div className="flex items-center gap-1.5 text-white font-semibold text-sm drop-shadow">
            <Heart size={18} className="fill-white" />
            <span>{likes}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white font-semibold text-sm drop-shadow">
            <MessageCircle size={18} className="fill-white" />
            <span>{comments}</span>
          </div>
        </div>

        {/* ── Bouton Tag (auteur uniquement, visible au hover) ── */}
        {isOwner && onTagClick && (
          <button
            onClick={e => { e.stopPropagation(); onTagClick(pub) }}
            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-violet-600 text-white rounded-full p-1.5 z-10"
            title="Identifier des personnes"
          >
            <Tag size={13} />
          </button>
        )}
      </div>

      {/* ── Titre optionnel sous la carte ── */}
      {showTitle && (
        <div className="p-3">
          <p className="text-sm font-medium truncate">{pub.title}</p>
          {pub.caption && (
            <p className="text-xs text-white/40 truncate mt-0.5">{pub.caption}</p>
          )}
        </div>
      )}
    </div>
  )
}
