'use client'

/** « Mes avis » : avis reçus (une seule réponse possible par avis) et avis à donner. */

import { useState } from 'react'
import Link from 'next/link'
import { Stars, personHref, type ReviewPerson } from '@/components/ReviewsPanel'
import ReviewModal, { type PendingReview } from '@/components/ReviewModal'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'
import { DateBadge, EmptyLine, SpacePanel } from './ui'

export type ReceivedReview = {
  id: number
  rating: number
  comment?: string | null
  createdAt: string
  reply?: string | null
  author: ReviewPerson
}

export default function ReviewsZone({ received, average, count, pending, onPendingDone }: {
  received: ReceivedReview[]
  average: number | null
  count: number
  pending: PendingReview[]
  onPendingDone: (item: PendingReview) => void
}) {
  const { notify } = useFeedback()
  const [tab, setTab] = useState<'received' | 'give'>(pending.length && !received.length ? 'give' : 'received')
  const [reviews, setReviews] = useState(received)
  const [replyingId, setReplyingId] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [reviewing, setReviewing] = useState<PendingReview | null>(null)

  const sendReply = async (id: number) => {
    const reply = draft.trim()
    if (!reply) return
    setSending(true)
    try {
      const res = await apiFetch(apiUrl(`reviews/${id}/reply`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply }),
      })
      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Impossible d’envoyer votre réponse.'))
      setReviews(list => list.map(r => (r.id === id ? { ...r, reply } : r)))
      setReplyingId(null)
      setDraft('')
      notify('Réponse publiée')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Impossible d’envoyer votre réponse.', 'error')
    } finally {
      setSending(false)
    }
  }

  const tabs = (
    <div className="inline-flex gap-1 rounded-[10px] border border-line bg-surface-2 p-[3px]" role="tablist">
      {([['received', `Reçus (${count})`], ['give', `À donner (${pending.length})`]] as const).map(([key, label]) => (
        <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
          className={`rounded-[7px] px-3 py-1.5 text-xs font-semibold transition ${tab === key ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}>
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <SpacePanel id="avis" kicker="Réputation" title={<>Mes avis{average != null && count > 0 && <span className="ml-2 text-sm font-semibold text-gold">{average.toFixed(1)} / 5</span>}</>} action={tabs}>
      {tab === 'received' ? (
        reviews.length === 0 ? (
          <EmptyLine>Aucun avis pour l’instant. Après chaque prestation, la personne avec qui vous avez travaillé pourra vous en laisser un.</EmptyLine>
        ) : (
          <div className="grid gap-2.5">
            {reviews.map(review => {
              const href = personHref(review.author)
              return (
                <article key={review.id} className="grid gap-1.5 rounded-[13px] border border-line bg-surface-2 p-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    {href ? <Link href={href} className="text-[13px] font-semibold text-white hover:underline">{review.author.name}</Link> : <b className="text-[13px] text-white">{review.author.name}</b>}
                    <span className="text-white/35">{new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <Stars value={review.rating} size={12} />
                  {review.comment && <p className="whitespace-pre-wrap text-[12.5px] text-white/80">{review.comment}</p>}
                  {review.reply ? (
                    <div className="ml-3 rounded-r-[10px] border-l-2 border-accent bg-accent/[0.07] px-3 py-2 text-xs text-muted">
                      <b className="font-semibold text-accent-light">Votre réponse</b> · <span className="whitespace-pre-wrap">{review.reply}</span>
                    </div>
                  ) : replyingId === review.id ? (
                    <div className="grid gap-2">
                      <textarea value={draft} onChange={e => setDraft(e.target.value)} maxLength={1000} rows={3} autoFocus
                        placeholder="Votre réponse sera publique. Une seule réponse possible, non modifiable."
                        className="w-full resize-none rounded-xl border border-line bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent/50 focus:outline-none" />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => { setReplyingId(null); setDraft('') }} className="px-3 py-1.5 text-xs text-muted hover:text-white">Annuler</button>
                        <button type="button" onClick={() => sendReply(review.id)} disabled={sending || !draft.trim()} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                          {sending ? 'Envoi…' : 'Publier ma réponse'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setReplyingId(review.id); setDraft('') }} className="justify-self-start rounded-lg border border-accent/35 px-2.5 py-1 text-xs font-semibold text-accent-light transition hover:bg-accent/10">
                      Répondre
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        )
      ) : pending.length === 0 ? (
        <EmptyLine>Aucun avis à donner. Après chaque prestation terminée, vous pourrez évaluer la personne avec qui vous avez travaillé.</EmptyLine>
      ) : (
        <div className="grid min-w-0">
          {pending.map(item => (
            <div key={`${item.kind}-${item.id}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-line py-2.5 first:border-t-0">
              <DateBadge date={item.date} />
              <div className="min-w-0">
                <h3 className="truncate text-[13px] font-semibold text-white">{item.counterpart.name}</h3>
                <p className="truncate text-xs text-muted">{item.title ? `${item.title} · ` : ''}Prestation du {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
              </div>
              <button type="button" onClick={() => setReviewing(item)} className="whitespace-nowrap rounded-full border border-gold/35 bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold-light transition hover:bg-gold/25">
                Laisser un avis
              </button>
            </div>
          ))}
        </div>
      )}

      {reviewing && (
        <ReviewModal
          prestation={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => { const done = reviewing; setReviewing(null); onPendingDone(done) }}
        />
      )}
    </SpacePanel>
  )
}
