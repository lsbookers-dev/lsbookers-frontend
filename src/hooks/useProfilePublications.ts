'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'

const PAGE_SIZE = 20

/**
 * Publications d'un profil, chargées par pages de 20 (le serveur ne renvoie
 * jamais tout d'un coup). `total` = nombre réel de publications du profil.
 */
export function useProfilePublications<T extends { id: number }>(profileId?: number | null) {
  const [publications, setPublications] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchPage = useCallback(async (pageNumber: number) => {
    if (!profileId) return null
    const res = await apiFetch(apiUrl(`publications/profile/${profileId}?page=${pageNumber}&limit=${PAGE_SIZE}`), { cache: 'no-store' })
    if (!res.ok) return null
    return res.json() as Promise<{ publications?: T[]; total?: number; hasMore?: boolean }>
  }, [profileId])

  useEffect(() => {
    let cancelled = false
    setPublications([])
    setTotal(0)
    setPage(1)
    setHasMore(false)
    fetchPage(1)
      .then(data => {
        if (cancelled || !data) return
        setPublications(data.publications || [])
        setTotal(data.total ?? data.publications?.length ?? 0)
        setHasMore(Boolean(data.hasMore))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [fetchPage])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const data = await fetchPage(page + 1)
      if (!data) return
      setPublications(previous => {
        const known = new Set(previous.map(item => item.id))
        return [...previous, ...(data.publications || []).filter(item => !known.has(item.id))]
      })
      setPage(page + 1)
      setHasMore(Boolean(data.hasMore))
      if (data.total != null) setTotal(data.total)
    } catch {
      // on garde ce qui est déjà affiché
    } finally {
      setLoadingMore(false)
    }
  }, [fetchPage, hasMore, loadingMore, page])

  const add = useCallback((publication: T) => {
    setPublications(previous => [publication, ...previous])
    setTotal(count => count + 1)
  }, [])

  const remove = useCallback((id: number) => {
    setPublications(previous => previous.filter(item => item.id !== id))
    setTotal(count => Math.max(0, count - 1))
  }, [])

  return { publications, total, hasMore, loadingMore, loadMore, add, remove }
}
