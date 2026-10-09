'use client'

/** Portfolio vivant partagé par les profils privés et publics. */

import { useCallback, useEffect, useState } from 'react'
import { ImagePlus, Trash2, X } from 'lucide-react'
import PublicationCard, { type PubCardData, type PubTag } from './PublicationCard'
import PublicationModal from './PublicationModal'
import TagModal from './TagModal'

type Props = {
  publications: PubCardData[]
  title?: string
  onDelete?: (id: number) => void
  isOwner?: boolean
  ownerUserId?: number
  headerAction?: React.ReactNode
  /** Nombre réel de publications (elles sont chargées par pages) */
  total?: number
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}

const cardSize = (index: number): 'tall' | 'medium' | 'square' => {
  const pattern: Array<'tall' | 'medium' | 'square'> = ['tall', 'square', 'medium', 'tall', 'medium', 'square']
  return pattern[index % pattern.length]
}

export default function PublicationsSection({
  publications,
  title = 'Publications',
  onDelete,
  isOwner = false,
  ownerUserId,
  headerAction,
  total,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: Props) {
  const [selected, setSelected] = useState<PubCardData | null>(null)
  const [tagTarget, setTagTarget] = useState<PubCardData | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [pubs, setPubs] = useState<PubCardData[]>(publications)

  useEffect(() => {
    setPubs(publications)
  }, [publications])

  const sorted = [...pubs].sort((a, b) => b.id - a.id)
  const preview = sorted.slice(0, 9)
  const count = Math.max(total ?? 0, sorted.length)

  const handleCountChange = useCallback((pubId: number, likes: number, comments: number) => {
    setPubs(previous => previous.map(publication => (
      publication.id === pubId ? { ...publication, _count: { likes, comments } } : publication
    )))
    setSelected(previous => previous?.id === pubId
      ? { ...previous, _count: { likes, comments } }
      : previous)
  }, [])

  const handleTagsChange = useCallback((pubId: number, tags: PubTag[]) => {
    setPubs(previous => previous.map(publication => publication.id === pubId ? { ...publication, tags } : publication))
    setSelected(previous => previous?.id === pubId ? { ...previous, tags } : previous)
    setTagTarget(previous => previous?.id === pubId ? { ...previous, tags } : previous)
  }, [])

  const renderPortfolio = (items: PubCardData[], inModal = false) => (
    <div className={`grid grid-cols-2 items-start gap-2.5 sm:gap-3 ${inModal ? 'md:grid-cols-3 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
      {items.map((publication, index) => (
        <div key={publication.id} className="relative w-full">
          <PublicationCard
            pub={publication}
            onClick={pub => { if (inModal) setShowAll(false); setSelected(pub) }}
            isOwner={isOwner}
            onTagClick={isOwner ? pub => { if (inModal) setShowAll(false); setTagTarget(pub) } : undefined}
            size={cardSize(index)}
          />
          {isOwner && onDelete && (
            <button
              type="button"
              onClick={event => { event.stopPropagation(); onDelete(publication.id) }}
              aria-label={`Supprimer ${publication.title}`}
              className="absolute bottom-3.5 right-3.5 z-[5] grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/65 text-white/65 backdrop-blur-md transition hover:border-red-400/50 hover:bg-red-600 hover:text-white"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <>
      <section className="overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(18,16,23,.9),rgba(10,9,13,.94))] p-3.5 shadow-[0_24px_65px_rgba(0,0,0,.16)] sm:p-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[.2em] text-violet-300/80">Portfolio public</span>
            <h2 className="mt-1 font-serif text-xl font-semibold text-white">{title}</h2>
            {count > 0 && <p className="mt-1 text-[10px] text-white/35">{count} création{count > 1 ? 's' : ''}</p>}
          </div>
          <div className="flex items-center gap-2">
            {count > 9 && (
              <button type="button" onClick={() => setShowAll(true)} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-[10px] font-medium text-white/55 transition hover:border-violet-400/30 hover:text-white">
                Tout voir
              </button>
            )}
            {headerAction}
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.018] px-5 text-center">
            <div>
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-violet-500/10 text-violet-300/70"><ImagePlus size={20} /></span>
              <p className="mt-3 text-sm font-medium text-white/65">Le portfolio est encore vide</p>
              <p className="mt-1 text-[11px] text-white/35">Les prochaines créations apparaîtront ici.</p>
            </div>
          </div>
        ) : renderPortfolio(preview)}
      </section>

      {selected && (
        <PublicationModal
          pub={selected}
          onClose={() => setSelected(null)}
          ownerUserId={ownerUserId}
          onCountChange={handleCountChange}
        />
      )}

      {tagTarget && (
        <TagModal
          pubId={tagTarget.id}
          initialTags={tagTarget.tags ?? []}
          onClose={() => setTagTarget(null)}
          onTagsChange={tags => handleTagsChange(tagTarget.id, tags)}
        />
      )}

      {showAll && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center sm:p-5" onMouseDown={event => { if (event.target === event.currentTarget) setShowAll(false) }}>
          <section role="dialog" aria-modal="true" aria-label={`${title}, toutes les publications`} className="flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden border-white/10 bg-[#0b0a0e] shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-[1.35rem] sm:border">
            <header className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-4 py-4 sm:px-5">
              <div><span className="text-[9px] font-bold uppercase tracking-[.18em] text-violet-300/75">Portfolio vivant</span><h3 className="mt-1 font-serif text-lg font-semibold">{title} <span className="text-white/30">({count})</span></h3></div>
              <button type="button" onClick={() => setShowAll(false)} aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-white/50 hover:text-white"><X size={16} /></button>
            </header>
            <div className="overflow-y-auto p-3.5 sm:p-5">
              {renderPortfolio(sorted, true)}
              {hasMore && onLoadMore && (
                <div className="mt-5 flex justify-center">
                  <button type="button" onClick={onLoadMore} disabled={loadingMore} className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-medium text-white/60 transition hover:border-violet-400/30 hover:text-white disabled:opacity-50">
                    {loadingMore ? 'Chargement…' : 'Voir plus de publications'}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
