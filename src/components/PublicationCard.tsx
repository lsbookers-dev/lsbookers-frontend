'use client'

import Image from 'next/image'
import { Heart, MessageCircle, Play } from 'lucide-react'

export type PubCardData = {
  id: number
  title: string
  media: string
  mediaType: 'image' | 'video'
  caption?: string
  _count?: { likes: number; comments: number }
}

type Props = {
  pub: PubCardData
  onClick: (pub: PubCardData) => void
  /** Affiche le titre sous la carte (mode liste). Par défaut: false (mode grille avec overlay hover) */
  showTitle?: boolean
}

export default function PublicationCard({ pub, onClick, showTitle = false }: Props) {
  const likes    = pub._count?.likes    ?? 0
  const comments = pub._count?.comments ?? 0

  return (
    <div
      onClick={() => onClick(pub)}
      className="group relative rounded-xl overflow-hidden border border-white/10 bg-black/30 cursor-pointer"
    >
      {/* ── Média ── */}
      <div className="relative w-full aspect-square">
        {pub.mediaType === 'image' ? (
          <Image
            src={pub.media}
            alt={pub.title}
            fill
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
            {/* Icône play pour les vidéos */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 rounded-full p-3">
                <Play size={20} className="text-white fill-white" />
              </div>
            </div>
          </>
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
