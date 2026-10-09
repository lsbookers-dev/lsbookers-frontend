'use client'

/** Laisser un avis sur la personne avec qui on a réalisé une prestation. */

import { useState } from 'react'
import { Star, X } from 'lucide-react'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import type { ReviewPerson } from './ReviewsPanel'

export type PendingReview = {
  kind: 'booking' | 'staff'
  id: number
  date: string
  title?: string | null
  counterpart: ReviewPerson
}

const LABELS = ['', 'Très décevant', 'Décevant', 'Correct', 'Très bien', 'Excellent']

export default function ReviewModal({ prestation, onClose, onDone }: {
  prestation: PendingReview
  onClose: () => void
  onDone: () => void
}) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!rating) { setError('Choisissez une note de 1 à 5 étoiles.'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await apiFetch(apiUrl('reviews'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [prestation.kind === 'booking' ? 'bookingId' : 'staffId']: prestation.id,
          rating,
          comment: comment.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || data?.error || 'Impossible d’enregistrer votre avis.')
      }
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’enregistrer votre avis.')
    } finally {
      setSaving(false)
    }
  }

  const shown = hover || rating
  const date = new Date(prestation.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-label="Laisser un avis" className="w-full max-w-md rounded-t-2xl border border-white/10 bg-[#0f0e13] p-5 text-white shadow-2xl sm:rounded-2xl">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[.18em] text-yellow-300/80">Votre avis</span>
            <h2 className="mt-1 text-lg font-semibold truncate">{prestation.counterpart.name}</h2>
            <p className="text-xs text-white/45">{prestation.title ? `${prestation.title} · ` : ''}{date}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 text-white/50 hover:text-white"><X size={16} /></button>
        </header>

        <div className="mt-5 flex flex-col items-center gap-2">
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map(value => (
              <button key={value} type="button" onClick={() => setRating(value)} onMouseEnter={() => setHover(value)} aria-label={`${value} étoile${value > 1 ? 's' : ''}`} className="p-1">
                <Star size={30} className={value <= shown ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'} />
              </button>
            ))}
          </div>
          <p className="h-4 text-xs text-white/50">{LABELS[shown]}</p>
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Racontez comment s’est passée la collaboration (facultatif)…"
          className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-white/30 focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-white/35">Votre avis sera visible sur son profil, avec votre nom.</p>

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-white/50 hover:text-white">Plus tard</button>
          <button type="button" onClick={submit} disabled={saving} className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50">
            {saving ? 'Envoi…' : 'Publier mon avis'}
          </button>
        </div>
      </section>
    </div>
  )
}
