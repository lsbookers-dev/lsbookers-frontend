'use client'

import Image from 'next/image'
import { Heart, MessageCircle, Play, Images } from 'lucide-react'

export type PubMediaItem = {
  id?: number
  url: string
  mediaType: 'image' | 'video' | string
  order?: number
}

export type PubCardData = {
  id: number
  title: string
  media: string
  mediaType: 'image' | 'video' | string
  caption?: string
  additionalMedia?: PubMediaItem[]
  _count?: { likes: number; comments: number }
}

type Props = {
  pub: PubCardData
  onClick: (pub: PubCardData) => void
  /** Affiche le titre sous la carte (mode liste). Par défaut: false (mode grille avec overlay hover) */
  showTitle?: boolean
}

export default function PublicationCard({ pub, onClick, showTitle = false }: Props) {
  const likes      = pub._count?.likes    ?? 0
  const comments   = pub._count?.comments ?? 0
  const isImage    = pub.mediaType?.toLowerCase() === 'image'
  const extraCount = pub.additionalMedia?.length ?? 0

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
