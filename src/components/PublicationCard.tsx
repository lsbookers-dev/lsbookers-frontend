'use client'

import Image from 'next/image'
import { Heart, Images, MessageCircle, Play, Tag } from 'lucide-react'

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
  createdAt?: string
  additionalMedia?: PubMediaItem[]
  tags?: PubTag[]
  _count?: { likes: number; comments: number }
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const toAbs = (url?: string | null) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`
}

type Props = {
  pub: PubCardData
  onClick: (pub: PubCardData) => void
  isOwner?: boolean
  onTagClick?: (pub: PubCardData) => void
  size?: 'tall' | 'medium' | 'square'
}

const sizeClasses = {
  tall: 'aspect-[4/5]',
  medium: 'aspect-[4/3]',
  square: 'aspect-square',
}

export default function PublicationCard({ pub, onClick, isOwner = false, onTagClick, size = 'square' }: Props) {
  const likes = pub._count?.likes ?? 0
  const comments = pub._count?.comments ?? 0
  const isImage = pub.mediaType?.toLowerCase() === 'image'
  const mediaCount = 1 + (pub.additionalMedia?.length ?? 0)
  const acceptedTags = pub.tags?.filter(tag => tag.status === 'ACCEPTED') ?? []
  const pendingTags = pub.tags?.filter(tag => tag.status === 'PENDING') ?? []

  return (
    <article
      onClick={() => onClick(pub)}
      className={`group relative w-full cursor-pointer overflow-hidden rounded-[1.15rem] border border-white/[0.09] bg-[#121016] shadow-[0_18px_45px_rgba(0,0,0,.14)] ${sizeClasses[size]}`}
    >
      {isImage ? (
        <Image
          src={pub.media}
          alt={pub.title}
          fill
          unoptimized
          className="object-cover transition duration-500 group-hover:scale-[1.035] group-hover:saturate-[1.08]"
        />
      ) : (
        <>
          <video src={pub.media} className="h-full w-full object-cover" muted playsInline preload="metadata" />
          <span className="absolute left-1/2 top-1/2 z-[2] grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md">
            <Play size={17} className="translate-x-px fill-white" />
          </span>
        </>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/95 transition-colors group-hover:from-black/25" />

      <div className="absolute inset-x-0 top-0 z-[3] flex items-start justify-between gap-2 p-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          {isOwner && onTagClick && (
            <button
              type="button"
              onClick={event => { event.stopPropagation(); onTagClick(pub) }}
              className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 bg-black/55 text-white/75 backdrop-blur-md transition hover:border-violet-400/50 hover:bg-violet-500/30 hover:text-white"
              aria-label="Identifier des personnes"
            >
              <Tag size={13} />
              {pendingTags.length > 0 && <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-black/60" />}
            </button>
          )}
          {acceptedTags.length > 0 && (
            <div className="flex -space-x-1.5">
              {acceptedTags.slice(0, 3).map(tag => (
                tag.taggedUser.profile?.avatar ? (
                  <span key={tag.id} className="relative h-7 w-7 overflow-hidden rounded-full border border-black/60 bg-[#24152e]">
                    <Image src={toAbs(tag.taggedUser.profile.avatar)} alt="" fill className="object-cover" unoptimized />
                  </span>
                ) : (
                  <span key={tag.id} className="grid h-7 w-7 place-items-center rounded-full border border-black/60 bg-violet-600 text-[8px] font-bold text-white">
                    {(tag.taggedUser.pseudo || tag.taggedUser.firstName || '?')[0]?.toUpperCase()}
                  </span>
                )
              ))}
            </div>
          )}
        </div>

        {mediaCount > 1 && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-black/55 px-2 py-1 text-[9px] font-semibold text-white/85 backdrop-blur-md">
            <Images size={11} /> {mediaCount}
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[3] p-3.5 sm:p-4">
        <p className="line-clamp-2 font-serif text-base font-semibold leading-tight text-white sm:text-lg">{pub.title}</p>
        {pub.caption && <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-white/55 opacity-90 sm:text-[11px]">{pub.caption}</p>}
        <div className="mt-2.5 flex items-center gap-3 border-t border-white/10 pt-2.5 text-[10px] text-white/60">
          <span className="inline-flex items-center gap-1"><Heart size={12} /> {likes}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle size={12} /> {comments}</span>
          <span className="ml-auto text-[8px] font-semibold uppercase tracking-[.16em] text-violet-300/85">Voir</span>
        </div>
      </div>
    </article>
  )
}
