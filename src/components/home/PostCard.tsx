'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Heart, Images, MessageCircle, Share2, Volume2, VolumeX } from 'lucide-react'
import type { Post } from './types'
import { roleLabel, timeAgo } from './format'

/** Carte d'une publication dans le fil. */
export default function PostCard({ post, onLike, onOpenModal, currentUserId, isMuted, onToggleMute }: {
  post: Post
  onLike: (id: number) => void
  onOpenModal: (post: Post) => void
  currentUserId?: number
  isMuted: boolean
  onToggleMute: () => void
}) {
  const allMedia = [
    { url: post.media, mediaType: post.mediaType },
    ...(post.additionalMedia ?? []).map(m => ({ url: m.url, mediaType: m.mediaType })),
  ]
  const [mediaIdx, setMediaIdx] = useState(0)
  const current = allMedia[mediaIdx] ?? allMedia[0]
  const isMulti = allMedia.length > 1
  const isVideo = current.mediaType === 'video' || current.mediaType === 'VIDEO'

  const videoRef = useRef<HTMLVideoElement>(null)

  // Met à jour le mute sur l'élément vidéo (React muted prop n'est pas réactif)
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted
  }, [isMuted])

  // Autoplay quand la vidéo entre dans le viewport, pause quand elle sort
  useEffect(() => {
    if (!isVideo) return
    const video = videoRef.current
    if (!video) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            video.play().catch(() => {})
          } else {
            video.pause()
            video.currentTime = 0.1
          }
        })
      },
      { threshold: 0.4 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [current.url, isVideo])

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMediaIdx(i => (i - 1 + allMedia.length) % allMedia.length)
  }
  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMediaIdx(i => (i + 1) % allMedia.length)
  }

  const share = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const shareData = {
      title: post.title,
      text: post.caption || post.title,
      url: window.location.href,
    }
    try {
      if (navigator.share) await navigator.share(shareData)
      else await navigator.clipboard.writeText(window.location.href)
    } catch {
      /* L'utilisateur peut fermer la feuille de partage sans erreur visible. */
    }
  }

  const feedLabel = post.feedType === 'suggestion'
    ? 'À découvrir'
    : post.feedType === 'trending'
      ? 'En tendance'
      : null

  return (
    <article className="group relative overflow-hidden rounded-[1.4rem] border border-white/[0.1] bg-surface shadow-[0_28px_75px_rgba(0,0,0,.2)]">
      <div className={`relative ${isVideo ? 'aspect-video' : 'aspect-[4/5]'} bg-black`} onClick={() => onOpenModal(post)}>
        {isVideo ? (
          <video
            key={current.url}
            ref={videoRef}
            src={current.url}
            className="h-full w-full cursor-pointer object-cover transition duration-700 group-hover:scale-[1.015]"
            muted preload="metadata" playsInline loop
            onLoadedMetadata={(e) => { e.currentTarget.currentTime = 0.1 }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.url} alt={post.caption || post.title} className="h-full w-full cursor-pointer object-cover transition duration-700 group-hover:scale-[1.015]" loading="lazy" />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />

      <header className="absolute inset-x-0 top-0 z-[3] flex items-center gap-3 p-4 sm:p-5">
        <Link href={post.author.profileUrl} className="relative block h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-white/20 bg-surface-2 shadow-lg">
          {post.author.avatar ? (
            <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-sm font-bold">{post.author.name[0]}</div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={post.author.profileUrl} className="block truncate text-sm font-semibold text-white drop-shadow hover:text-accent-light">
            {post.author.name}
          </Link>
          <p className="mt-0.5 text-[10px] text-white/60">
            {post.author.profession || roleLabel(post.author.role)} · {timeAgo(post.createdAt)}
          </p>
        </div>
        {post.isFromFollow && post.author.userId !== Number(currentUserId) && (
          <span className="flex-shrink-0 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[9px] text-accent-light backdrop-blur-md">Suivi</span>
        )}
      </header>

      <div className="absolute left-4 top-[4.7rem] z-[3] flex gap-2 sm:left-5 sm:top-[5.25rem]">
        {feedLabel && <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-white/75 backdrop-blur-md">{feedLabel}</span>}
        {isMulti && <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[9px] text-white/75 backdrop-blur-md"><Images size={11} /> {mediaIdx + 1} / {allMedia.length}</span>}
      </div>

      {isMulti && (
        <>
          <button type="button" onClick={prev} aria-label="Média précédent" className="absolute left-3 top-1/2 z-[4] grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/45 text-white/70 opacity-100 backdrop-blur-md transition hover:bg-black/75 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"><ChevronLeft size={17} /></button>
          <button type="button" onClick={next} aria-label="Média suivant" className="absolute right-3 top-1/2 z-[4] grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/45 text-white/70 opacity-100 backdrop-blur-md transition hover:bg-black/75 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"><ChevronRight size={17} /></button>
          <div className="absolute bottom-4 left-1/2 z-[4] flex -translate-x-1/2 gap-1" onClick={event => event.stopPropagation()}>
            {allMedia.map((_, index) => <button key={index} type="button" onClick={event => { event.stopPropagation(); setMediaIdx(index) }} aria-label={`Afficher le média ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === mediaIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`} />)}
          </div>
        </>
      )}

      <div className="absolute bottom-5 left-4 right-[4.8rem] z-[3] sm:bottom-6 sm:left-5 sm:right-24">
        <button type="button" onClick={() => onOpenModal(post)} className="block text-left">
          <h2 className="font-serif text-2xl font-semibold leading-[1.05] text-white drop-shadow sm:text-3xl">{post.title}</h2>
          {post.caption && <p className="mt-2 line-clamp-2 max-w-xl text-[11px] leading-relaxed text-white/70 sm:text-xs">{post.caption}</p>}
        </button>
      </div>

      <div className="absolute bottom-5 right-3 z-[5] grid gap-2.5 sm:bottom-6 sm:right-5">
        <span className="grid justify-items-center gap-1">
          <button type="button" onClick={event => { event.stopPropagation(); onLike(post.id) }} aria-label={post.likedByMe ? 'Retirer le J’aime' : 'Aimer'} className={`grid h-11 w-11 place-items-center rounded-full border backdrop-blur-md transition ${post.likedByMe ? 'border-accent/45 bg-accent/25 text-accent-light' : 'border-white/15 bg-black/50 text-white/80 hover:bg-white/10'}`}><Heart size={17} className={post.likedByMe ? 'fill-current' : ''} /></button>
          <span className="text-[9px] text-white/65">{post.likesCount}</span>
        </span>
        <span className="grid justify-items-center gap-1">
          <button type="button" onClick={event => { event.stopPropagation(); onOpenModal(post) }} aria-label="Voir les commentaires" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur-md transition hover:bg-white/10"><MessageCircle size={17} /></button>
          <span className="text-[9px] text-white/65">{post.commentsCount ?? 0}</span>
        </span>
        <button type="button" onClick={share} aria-label="Partager" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur-md transition hover:bg-white/10"><Share2 size={16} /></button>
        {isVideo && (
          <button type="button" onClick={event => { event.stopPropagation(); onToggleMute() }} aria-label={isMuted ? 'Activer le son' : 'Couper le son'} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur-md transition hover:bg-white/10">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        )}
      </div>
    </article>
  )
}
