'use client'

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
  accentColor?: string // classe Tailwind ex: 'bg-pink-600'
}

const cardSize = (index: number): 'tall' | 'medium' | 'square' => {
  const pattern: Array<'tall' | 'medium' | 'square'> = ['tall', 'square', 'medium', 'tall', 'medium', 'square']
  return pattern[index % pattern.length]
}

export default function TaggedPublicationsTab({ profileId, accentColor = 'bg-violet-600' }: Props) {
  const [publications, setPublications] = useState<PubCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PubCardData | null>(null)

  useEffect(() => {
    if (!profileId) return
    setLoading(true)
    fetch(`${API_BASE}/api/publications/tagged/${profileId}`)
      .then(r => r.ok ? r.json() : { publications: [] })
      .then(d => setPublications(d.publications || []))
      .catch(() => setPublications([]))
      .finally(() => setLoading(false))
  }, [profileId])

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
          <p className="mt-3 text-sm font-medium text-white/65">Aucune identification pour l'instant</p>
          <p className="mt-1 text-[11px] text-white/35">Les photos sur lesquelles ce profil est identifié apparaîtront ici.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-3 text-[10px] text-white/35">{publications.length} identification{publications.length > 1 ? 's' : ''}</div>
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

      {selected && (
        <PublicationModal
          pub={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
