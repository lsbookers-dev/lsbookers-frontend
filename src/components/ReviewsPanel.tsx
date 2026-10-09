'use client'

/**
 * Avis reçus par un profil (profils publics et Studio).
 * Seuls les avis laissés après une prestation réelle sont renvoyés par l'API.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import SafeImage from './SafeImage'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'

export type ReviewPerson = {
  profileId: number
  userId: number | null
  role: string | null
  name: string
  avatar: string | null
}

type Review = {
  id: number
  rating: number
  comment?: string | null
  createdAt: string
  author: ReviewPerson
}

const PREVIEW = 4

export function personHref(person: ReviewPerson) {
  if (!person.userId || !person.role || !['ARTIST', 'ORGANIZER', 'PROVIDER'].includes(person.role)) return null
  return `/${person.role.toLowerCase()}/${person.userId}`
}

export function Stars({ value, size = 10 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < Math.round(value) ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'} />
      ))}
    </span>
  )
}

export default function ReviewsPanel({ profileId, isOwner = false }: { profileId: number; isOwner?: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [average, setAverage] = useState<number | null>(null)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiFetch(apiUrl(`reviews/profile/${profileId}`), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data) return
        setReviews(data.reviews || [])
        setAverage(data.average ?? null)
        setCount(data.count ?? 0)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [profileId])

  const visible = showAll ? reviews : reviews.slice(0, PREVIEW)

  return (
    <section className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Star size={15} className="text-yellow-400" />
        <h2 className="text-xs uppercase tracking-widest text-white/35">Avis</h2>
        {average != null && count > 0 && (
          <span className="ml-auto text-sm font-medium text-yellow-400">
            {average.toFixed(1)}<span className="text-white/35 text-xs font-normal"> / 5 · {count} avis</span>
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-white/35 text-center py-3">Chargement des avis…</p>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-white/35 text-center py-3 leading-relaxed">
          Aucun avis pour l&apos;instant.
          <br />
          {isOwner
            ? 'Après chaque prestation réalisée, la personne avec qui vous avez travaillé pourra vous laisser un avis.'
            : 'Les avis sont laissés uniquement après une prestation réalisée via LS Bookers.'}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map(review => {
            const href = personHref(review.author)
            const name = <p className="text-xs font-medium truncate text-white/70">{review.author.name}</p>
            return (
              <div key={review.id} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <SafeImage type="avatar" src={review.author.avatar} name={review.author.name} size={28} className="rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    {href ? <Link href={href} className="hover:underline">{name}</Link> : name}
                    <Stars value={review.rating} />
                  </div>
                  <time className="text-[10px] text-white/30 shrink-0">
                    {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </time>
                </div>
                {review.comment && <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{review.comment}</p>}
              </div>
            )
          })}
          {reviews.length > PREVIEW && (
            <button type="button" onClick={() => setShowAll(v => !v)} className="w-full text-xs text-white/45 hover:text-white transition py-1">
              {showAll ? 'Voir moins' : `Voir les ${reviews.length} avis`}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
