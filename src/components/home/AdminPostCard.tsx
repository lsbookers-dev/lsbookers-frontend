'use client'

import { Star } from 'lucide-react'
import type { AdminPost } from './types'
import { timeAgo } from './format'

/** Publication officielle LS Bookers dans le fil. */
export default function AdminPostCard({ post }: { post: AdminPost }) {
  const isVideo = post.mediaType === 'VIDEO'

  return (
    <article className="group relative min-h-[24rem] overflow-hidden rounded-[1.4rem] border border-accent/20 bg-surface shadow-[0_28px_75px_rgba(0,0,0,.2)] sm:aspect-[16/10] sm:min-h-0">
      {post.mediaUrl && (
        <div className="absolute inset-0 bg-black">
          {isVideo ? (
            <video
              src={post.mediaUrl}
              className="h-full w-full object-cover"
              controls
              preload="metadata"
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.mediaUrl}
              alt={post.title || 'LS Bookers'}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.015]"
              loading="lazy"
            />
          )}
        </div>
      )}
      {!post.mediaUrl && <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,var(--lsb-accent-soft),transparent_38%),linear-gradient(145deg,var(--lsb-panel-soft),var(--background)_70%)]" />}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/5 to-black/95" />

      <header className="absolute inset-x-0 top-0 z-[3] flex items-center gap-3 p-4 sm:p-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-accent-light/35 bg-gradient-to-br from-accent-strong to-accent text-xs font-bold text-white shadow-lg">LS</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-white">LS Bookers <Star className="h-3.5 w-3.5 fill-gold text-gold" /></span>
          <span className="mt-0.5 block text-[10px] text-white/55">{timeAgo(post.createdAt)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-gold-light backdrop-blur-md"><Star size={11} className="fill-current" /> Officiel</span>
      </header>

      {(post.title || post.content) && (
        <div className="absolute bottom-6 left-5 right-5 z-[3] max-w-2xl">
          <p className="text-[9px] font-bold uppercase tracking-[.18em] text-accent-light">Actualité LSBookers</p>
          {post.title && <h2 className="mt-2 font-serif text-2xl font-semibold leading-[1.05] text-white drop-shadow sm:text-3xl">{post.title}</h2>}
          {post.content && <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-white/70 sm:text-xs">{post.content}</p>}
        </div>
      )}
    </article>
  )
}
