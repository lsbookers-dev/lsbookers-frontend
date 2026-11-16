'use client'

import { useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import type { AdminPost, Post } from './types'
import AdminPostCard from './AdminPostCard'
import PostCard from './PostCard'
import { PostCardSkeleton } from './FeedSkeleton'

/**
 * Liste du fil : publications officielles épinglées tout en haut, puis les publications
 * dans l'ordre choisi par l'algorithme du serveur (comptes suivis, tendances, suggestions, classés par score —
 * décision d'Antho du 17/11/2026, avant : retriées par date). Les officielles non épinglées
 * s'intercalent selon leur date, juste avant la première publication plus ancienne qu'elles.
 * La page suivante se charge toute seule en arrivant en bas (le bouton reste là au cas où).
 */
export default function FeedList({ posts, adminPosts = [], hasMore, loadingMore, onLoadMore, onLike, onOpen, currentUserId, isMuted, onToggleMute }: {
  posts: Post[]
  adminPosts?: AdminPost[]
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  onLike: (post: Post) => void
  onOpen: (post: Post) => void
  currentUserId?: number
  isMuted: boolean
  onToggleMute: () => void
}) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) onLoadMore()
    }, { rootMargin: '600px 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, onLoadMore])

  type Item = { kind: 'admin'; data: AdminPost } | { kind: 'post'; data: Post }
  const pinned: Item[] = adminPosts.filter(p => p.pinned).map(data => ({ kind: 'admin', data }))
  const time = (d: string) => new Date(d).getTime()
  const officials = adminPosts.filter(p => !p.pinned).sort((a, b) => time(b.createdAt) - time(a.createdAt))
  const mixed: Item[] = []
  let oi = 0
  for (const data of posts) {
    while (oi < officials.length && time(officials[oi].createdAt) >= time(data.createdAt)) mixed.push({ kind: 'admin', data: officials[oi++] })
    mixed.push({ kind: 'post', data })
  }
  // Les officielles restantes ne s'affichent qu'une fois tout le fil chargé
  if (!hasMore) while (oi < officials.length) mixed.push({ kind: 'admin', data: officials[oi++] })

  return (
    <div className="space-y-4">
      {[...pinned, ...mixed].map(item => item.kind === 'admin' ? <AdminPostCard key={`admin-${item.data.id}`} post={item.data} /> : (
        <PostCard
          key={item.data.id}
          post={item.data}
          onLike={() => onLike(item.data)}
          onOpenModal={onOpen}
          currentUserId={currentUserId}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
        />
      ))}

      {loadingMore && <PostCardSkeleton />}
      <div ref={sentinelRef} />

      {hasMore && !loadingMore && (
        <button
          type="button"
          onClick={onLoadMore}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/3 py-3 text-sm text-white/50 transition-all hover:bg-white/6 hover:text-white/80"
        >
          <ChevronDown className="h-4 w-4" /> Charger plus de publications
        </button>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="py-6 text-center text-xs text-white/20">— Vous avez tout vu —</p>
      )}
    </div>
  )
}
