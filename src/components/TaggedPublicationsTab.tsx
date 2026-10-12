'use client'

import { apiFetch } from '@/utils/auth'
/**
 * Onglet "Identifications" — affiche toutes les publications
 * où ce profil a été identifié (tags acceptés).
 */

import { useEffect, useState } from 'react'
import { Tag } from 'lucide-react'
import PublicationCard, { type PubCardData } from './PublicationCard'
import PublicationModal from './PublicationModal'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

type Props = {
  profileId: number
}

const PAGE_SIZE = 20

const cardSize = (index: number): 'tall' | 'medium' | 'square' => {
  const pattern: Array<'tall' | 'medium' | 'square'> = ['tall', 'square', 'medium', 'tall', 'medium', 'square']
  return pattern[index % pattern.length]
}

export default function TaggedPublicationsTab({ profileId }: Props) {
  const [publications, setPublications] = useState<PubCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PubCardData | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchPage = (pageNumber: number) =>
    apiFetch(`${API_BASE}/api/publications/tagged/${profileId}?page=${pageNumber}&limit=${PAGE_SIZE}`)
      .then(r => r.ok ? r.json() : { publications: [] })

  useEffect(() => {
    if (!profileId) return
    setLoading(true)
    fetchPage(1)
      .then(d => {
        setPublications(d.publications || [])
        setTotal(d.total ?? d.publications?.length ?? 0)
        setHasMore(Boolean(d.hasMore))
        setPage(1)
      })
      .catch(() => setPublications([]))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchPage ne dépend que de profileId
  }, [profileId])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const d = await fetchPage(page + 1)
      const known = new Set(publications.map(pub => pub.id))
      setPublications(prev => [...prev, ...(d.publications || []).filter((pub: PubCardData) => !known.has(pub.id))])
      setHasMore(Boolean(d.hasMore))
      setPage(page + 1)
    } catch {
      // on garde ce qui est affiché
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-40 place-items-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />
      </div>
    )
  }

  if (publications.length === 0) {
    return (
      <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.018] px-5 text-center">
        <div>
          <span className={`mx-auto grid h-11 w-11 place-items-center rounded-xl bg-violet-500/10 text-violet-300/70`}>
            <Tag size={20} />
          </span>
          <p className="mt-3 text-sm font-medium text-white/65">Aucune identification pour l&apos;instant</p>
          <p className="mt-1 text-[11px] text-white/35">Les photos sur lesquelles ce profil est identifié apparaîtront ici.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-3 text-[10px] text-white/35">{Math.max(total, publications.length)} identification{Math.max(total, publications.length) > 1 ? 's' : ''}</div>
      <div className="columns-2 gap-2.5 sm:gap-3 md:columns-3">
        {publications.map((pub, index) => (
          <div key={pub.id} className="relative mb-2.5 inline-block w-full break-inside-avoid sm:mb-3">
            <PublicationCard
              pub={pub}
              onClick={setSelected}
              size={cardSize(index)}
            />
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={loadMore} disabled={loadingMore} className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-medium text-white/60 transition hover:text-white disabled:opacity-50">
            {loadingMore ? 'Chargement…' : 'Voir plus'}
          </button>
        </div>
      )}

      {selected && (
        <PublicationModal
          pub={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
