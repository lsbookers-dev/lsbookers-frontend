'use client'

/**
 * PublicationsSection
 * Section complète publications : grille de cartes + modale avec commentaires.
 * Utilisée sur tous les profils (privés + publics) et la page home.
 */

import { useState, useCallback } from 'react'
import PublicationCard, { type PubCardData } from './PublicationCard'
import PublicationModal from './PublicationModal'

type Props = {
  publications: PubCardData[]
  /** Titre de la section (ex: "Publications", "Réalisations") */
  title?: string
  /** Callback pour supprimer une publication (profil privé uniquement) */
  onDelete?: (id: number) => void
  /** Affiche le bouton supprimer sur chaque carte */
  isOwner?: boolean
  /** Bouton ou élément React additionnel dans le header (ex: bouton Ajouter) */
  headerAction?: React.ReactNode
}

export default function PublicationsSection({
  publications,
  title = 'Publications',
  onDelete,
  isOwner = false,
  headerAction,
}: Props) {
  const [selected,  setSelected]  = useState<PubCardData | null>(null)
  const [showAll,   setShowAll]   = useState(false)
  const [pubs,      setPubs]      = useState<PubCardData[]>(publications)

  /* Sync si la prop change (ex: ajout ou suppression d'une pub) */
  if (publications.length !== pubs.length) {
    setPubs(publications)
  }

  const sorted = [...pubs].sort((a, b) => b.id - a.id)
  const preview = sorted.slice(0, 9)

  /* Mise à jour en temps réel des compteurs likes/comments */
  const handleCountChange = useCallback((pubId: number, likes: number, comments: number) => {
    setPubs(prev =>
      prev.map(p =>
        p.id === pubId
          ? { ...p, _count: { likes, comments } }
          : p
      )
    )
  }, [])

  if (sorted.length === 0) {
    return (
      <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-neutral-400 text-sm mt-3">Aucune publication pour le moment.</p>
      </section>
    )
  }

  return (
    <>
      <section className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            {sorted.length > 9 && (
              <button
                onClick={() => setShowAll(true)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                Voir toutes ({sorted.length})
              </button>
            )}
            {headerAction}
          </div>
        </div>

        {/* ── Grille ── */}
        <div className="grid grid-cols-3 gap-1.5">
          {preview.map(p => (
            <div key={p.id} className="relative">
              <PublicationCard pub={p} onClick={setSelected} />
              {isOwner && onDelete && (
                <button
                  onClick={e => { e.stopPropagation(); onDelete(p.id) }}
                  className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full transition z-10"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Modale détail ── */}
      {selected && (
        <PublicationModal
          pub={selected}
          onClose={() => setSelected(null)}
          onCountChange={handleCountChange}
        />
      )}

      {/* ── Modale "Voir toutes" ── */}
      {showAll && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAll(false)}
        >
          <div
            className="max-w-4xl w-full max-h-[88vh] overflow-y-auto bg-neutral-950 border border-white/10 rounded-2xl p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">
                {title} ({sorted.length})
              </h3>
              <button
                onClick={() => setShowAll(false)}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                Fermer
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {sorted.map(p => (
                <PublicationCard
                  key={p.id}
                  pub={p}
                  onClick={pub => { setShowAll(false); setSelected(pub) }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
