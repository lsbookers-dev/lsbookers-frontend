/** Chargement d'un fil paginé (« Pour vous » ou « À proximité ») avec un curseur fourni par le serveur. */
import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/utils/auth'
import type { AdminPost, Post } from './types'
import { API_BASE } from './format'

type FeedMeta = { region?: string | null; radiusKm?: number; needsLocation?: boolean }

/** `path` = '/api/home/feed' ou '/api/home/nearby' ; null tant que le fil n'est pas affiché. */
export function useFeed(path: string | null) {
  const [posts, setPosts]             = useState<Post[]>([])
  const [adminPosts, setAdminPosts]   = useState<AdminPost[]>([])
  const [meta, setMeta]               = useState<FeedMeta>({})
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError]             = useState(false)
  const cursorRef = useRef<string | null>(null)
  const [hasMore, setHasMore]         = useState(false)
  const loadedFor = useRef<string | null>(null)

  const fetchPage = useCallback(async (reset: boolean) => {
    if (!path) return
    const cursor = reset ? null : cursorRef.current
    if (!reset && !cursor) return
    if (reset) { setLoading(true); setError(false) } else setLoadingMore(true)
    try {
      const res = await apiFetch(`${API_BASE}${path}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`)
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()
      const page: Post[] = data.posts || []
      if (reset) {
        setPosts(page)
        setAdminPosts(data.adminPosts || [])
        setMeta({ region: data.region, radiusKm: data.radiusKm, needsLocation: data.needsLocation })
      } else {
        // Sécurité : jamais deux fois la même publication à l'écran
        setPosts(prev => {
          const seen = new Set(prev.map(p => p.id))
          return [...prev, ...page.filter(p => !seen.has(p.id))]
        })
      }
      cursorRef.current = data.nextCursor ?? null
      setHasMore(!!data.nextCursor)
    } catch {
      if (reset) setError(true)
    } finally {
      if (reset) setLoading(false); else setLoadingMore(false)
    }
  }, [path])

  // Premier chargement quand le fil devient visible
  useEffect(() => {
    if (!path || loadedFor.current === path) return
    loadedFor.current = path
    fetchPage(true)
  }, [path, fetchPage])

  const loadMore = useCallback(() => { if (!loadingMore) fetchPage(false) }, [fetchPage, loadingMore])
  const reload = useCallback(() => fetchPage(true), [fetchPage])
  const updatePost = useCallback((id: number, patch: Partial<Post>) => {
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  return { posts, setPosts, adminPosts, meta, loading, loadingMore, error, hasMore, loadMore, reload, updatePost }
}
