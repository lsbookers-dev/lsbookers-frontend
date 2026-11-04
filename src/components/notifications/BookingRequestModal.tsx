'use client'

/**
 * Demande de booking ouverte depuis une notification (point 4d, 04/11/2026) : résumé (date, lieu,
 * cachet, message) et réponse Accepter / Refuser sans ouvrir la conversation.
 * Même règle que la carte de la conversation (PATCH /api/events/booking-request/:id).
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/utils/auth'
import LsIcon from '@/components/ui/LsIcon'

type Request = {
  id: number
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'
  startDate: string
  fee: number | null
  message: string | null
  awaitingArtist: boolean
  event: { title: string; lieu: string | null } | null
  requester: { userId: number | null; name: string; role: string | null; avatar: string | null; city: string | null }
  conversationId: number | null
  canAnswer: boolean
}

const ROLE_LABEL: Record<string, string> = { ORGANIZER: 'Organisateur', ARTIST: 'Artiste', PROVIDER: 'Prestataire' }
const STATUS_TEXT: Record<Request['status'], string> = {
  PENDING: 'En attente de votre réponse',
  ACCEPTED: 'Booking accepté',
  DECLINED: 'Proposition refusée',
  CANCELLED: 'Proposition annulée',
}

export default function BookingRequestModal({ id, onClose }: { id: number; onClose: () => void }) {
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
  const [data, setData] = useState<Request | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'ACCEPTED' | 'DECLINED' | null>(null)

  useEffect(() => {
    let alive = true
    apiFetch(`${API_BASE}/api/events/booking-request/${id}`, { cache: 'no-store' })
      .then(async res => {
        if (!res.ok) throw new Error()
        const json = await res.json()
        if (alive) setData(json)
      })
      .catch(() => { if (alive) setError('Impossible d’ouvrir cette demande.') })
    return () => { alive = false }
  }, [API_BASE, id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const answer = async (status: 'ACCEPTED' | 'DECLINED') => {
    if (!data || busy) return
    setBusy(status)
    setError('')
    try {
      const res = await apiFetch(`${API_BASE}/api/events/booking-request/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'La réponse n’a pas pu être envoyée.')
      // Profil géré avec « accord de l'artiste » : l'agence accepte, l'artiste confirme ensuite
      if (json?.awaitingArtist) setData(d => (d ? { ...d, awaitingArtist: true, canAnswer: false } : d))
      else setData(d => (d ? { ...d, status, canAnswer: false } : d))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La réponse n’a pas pu être envoyée.')
    } finally {
      setBusy(null)
    }
  }

  const rawDate = data ? new Date(data.startDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1)
  const conversationHref = data?.conversationId ? `/messages?c=${data.conversationId}` : '/messages'
  const statusLine = data?.awaitingArtist && data.status === 'PENDING' ? 'Acceptée par l’agence, en attente de la confirmation de l’artiste' : data ? STATUS_TEXT[data.status] : ''

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Demande de booking"
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md rounded-t-3xl border border-line bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wider text-accent-light">Demande de booking</p>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-8 w-8 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white">
            <LsIcon name="close" tone="inherit" size={16} />
          </button>
        </div>

        {!data ? (
          error ? <p className="py-8 text-center text-sm text-red-300">{error}</p> : (
            <div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
          )
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              {data.requester.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.requester.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <span className="grid h-11 w-11 place-items-center rounded-full bg-accent/20 text-sm font-semibold text-accent-light">{data.requester.name.slice(0, 2).toUpperCase()}</span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">{data.requester.name}</span>
                <span className="block text-xs text-white/45">{[ROLE_LABEL[data.requester.role || ''] || null, data.requester.city].filter(Boolean).join(' · ')}</span>
              </span>
            </div>

            <dl className="divide-y divide-white/[0.06] border-y border-white/[0.06] text-sm">
              <div className="flex justify-between gap-4 py-2.5"><dt className="text-white/45">Date</dt><dd className="text-right text-white">{dateLabel}</dd></div>
              {data.event?.title && <div className="flex justify-between gap-4 py-2.5"><dt className="text-white/45">Événement</dt><dd className="text-right text-white">{data.event.title}</dd></div>}
              {data.event?.lieu && <div className="flex justify-between gap-4 py-2.5"><dt className="text-white/45">Lieu</dt><dd className="text-right text-white">{data.event.lieu}</dd></div>}
              <div className="flex justify-between gap-4 py-2.5"><dt className="text-white/45">Cachet proposé</dt><dd className="text-right font-semibold text-gold">{data.fee != null ? `${Number(data.fee).toLocaleString('fr-FR')} €` : 'À définir'}</dd></div>
            </dl>
            {data.message && <p className="mt-3 text-sm italic leading-relaxed text-white/70">« {data.message} »</p>}

            {data.canAnswer ? (
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={() => answer('ACCEPTED')} disabled={!!busy} className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50">
                  {busy === 'ACCEPTED' ? 'Envoi…' : 'Accepter'}
                </button>
                <button type="button" onClick={() => answer('DECLINED')} disabled={!!busy} className="flex-1 rounded-xl border border-line py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/[0.06] disabled:opacity-50">
                  {busy === 'DECLINED' ? 'Envoi…' : 'Refuser'}
                </button>
              </div>
            ) : (
              <p className={`mt-5 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm ${data.status === 'ACCEPTED' ? 'bg-gold/10 text-gold' : 'bg-white/[0.04] text-white/60'}`}>
                {data.status === 'ACCEPTED' && <LsIcon name="check" tone="inherit" size={16} />}{statusLine}
              </p>
            )}
            {error && <p className="mt-3 text-center text-xs text-red-300">{error}</p>}

            <Link href={conversationHref} onClick={onClose} className="mt-4 block text-center text-sm text-accent-light transition hover:text-white">
              {data.canAnswer ? 'Proposer autre chose dans la conversation' : 'Ouvrir la conversation'}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
