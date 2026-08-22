// messages/BookingCards.tsx — Cartes booking request + cancellation request

'use client'

import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { API_BASE } from './_helpers'
import type { Message, BookingRequestData } from './types'

/* ── Status badge ────────────────────────────────────────── */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: 'En attente', cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
    ACCEPTED:  { label: 'Accepté',    cls: 'bg-green-500/20 text-green-300 border-green-500/30' },
    DECLINED:  { label: 'Refusé',     cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
    CANCELLED: { label: 'Annulé',     cls: 'bg-white/10 text-white/40 border-white/10' },
  }
  const s = map[status] || map.PENDING
  return (
    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  )
}

/* ── Carte demande de booking ────────────────────────────── */
export function BookingRequestCard({
  msg, currentUserId, token, onStatusUpdate,
}: {
  msg: Message
  currentUserId: number | null
  token: string | null
  onStatusUpdate: (messageId: string, newStatus: BookingRequestData['status']) => void
}) {
  const [localStatus, setLocalStatus] = useState<BookingRequestData['status'] | null>(null)
  const [updating, setUpdating] = useState(false)
  const [showCounter, setShowCounter] = useState(false)
  const [counterDate, setCounterDate] = useState('')
  const [counterFee, setCounterFee] = useState('')
  const [counterMsg, setCounterMsg] = useState('')
  const [sendingCounter, setSendingCounter] = useState(false)

  const br = msg.bookingRequest
  if (!br) return null

  const status = localStatus ?? br.status
  const isSender = msg.sender.id === currentUserId

  const dateLabel = br.startDate
    ? new Date(br.startDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const updateStatus = async (newStatus: BookingRequestData['status']) => {
    if (!token || updating) return
    setUpdating(true)
    try {
      const res = await fetch(`${API_BASE}/api/events/booking-request/${br.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setLocalStatus(newStatus)
        onStatusUpdate(msg.id, newStatus)
      }
    } catch (err) {
      console.error('updateStatus:', err)
    } finally {
      setUpdating(false)
    }
  }

  const submitCounter = async () => {
    if (!token || !counterDate || sendingCounter) return
    setSendingCounter(true)
    try {
      const res = await fetch(`${API_BASE}/api/events/booking-request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetProfileId: br.requesterId,
          date: counterDate,
          message: counterMsg.trim() || undefined,
          fee: counterFee ? parseFloat(counterFee) : undefined,
        }),
      })
      if (res.ok) {
        setShowCounter(false)
        await updateStatus('DECLINED')
      }
    } catch (err) {
      console.error('submitCounter:', err)
    } finally {
      setSendingCounter(false)
    }
  }

  return (
    <div className="max-w-sm w-full rounded-2xl border border-violet-500/30 bg-violet-900/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-violet-500/20 flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-violet-400 shrink-0" />
        <span className="text-sm font-semibold text-violet-300">Proposition de booking</span>
        <StatusBadge status={status} />
      </div>
      <div className="px-4 py-3 space-y-1.5">
        <p className="text-sm text-white/80 capitalize">📅 {dateLabel}</p>
        {br.fee != null && (
          <p className="text-sm text-white/80">💶 {Number(br.fee).toLocaleString('fr-FR')} €</p>
        )}
        {br.message && (
          <p className="text-sm text-white/55 italic border-l-2 border-violet-500/40 pl-3">&ldquo;{br.message}&rdquo;</p>
        )}
      </div>
      {status === 'PENDING' && (
        <div className="px-4 pb-4">
          {!isSender ? (
            showCounter ? (
              <div className="space-y-2 mt-1">
                <input type="date" value={counterDate} onChange={e => setCounterDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-violet-400" />
                <input type="number" value={counterFee} onChange={e => setCounterFee(e.target.value)}
                  placeholder="Cachet proposé (€)"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-400" />
                <textarea value={counterMsg} onChange={e => setCounterMsg(e.target.value)}
                  placeholder="Message (optionnel)…" rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-400 resize-none" />
                <div className="flex gap-2">
                  <button onClick={submitCounter} disabled={sendingCounter || !counterDate}
                    className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-30 transition">
                    {sendingCounter ? 'Envoi…' : 'Envoyer'}
                  </button>
                  <button onClick={() => setShowCounter(false)}
                    className="px-3 py-2 rounded-xl bg-white/5 text-white/50 text-sm hover:bg-white/10 transition">
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 mt-1">
                <button onClick={() => updateStatus('ACCEPTED')} disabled={updating}
                  className="flex-1 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-500 disabled:opacity-30 transition">
                  ✓ Accepter
                </button>
                <button onClick={() => setShowCounter(true)}
                  className="flex-1 py-2 rounded-xl bg-amber-600/80 text-white text-sm font-medium hover:bg-amber-500/80 transition">
                  ↔ Contre-offre
                </button>
                <button onClick={() => updateStatus('DECLINED')} disabled={updating}
                  className="flex-1 py-2 rounded-xl bg-red-700/70 text-white text-sm font-medium hover:bg-red-600/70 disabled:opacity-30 transition">
                  ✕ Refuser
                </button>
              </div>
            )
          ) : (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-white/35">En attente de réponse…</span>
              <button onClick={() => updateStatus('CANCELLED')} disabled={updating}
                className="px-3 py-1.5 rounded-xl bg-white/5 text-white/40 text-xs hover:bg-white/10 disabled:opacity-30 transition">
                Annuler
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Carte demande d'annulation ──────────────────────────── */
export function CancellationRequestCard({
  msg, currentUserId, token, onStatusUpdate,
}: {
  msg: Message
  currentUserId: number | null
  token: string | null
  onStatusUpdate: (messageId: string, newStatus: BookingRequestData['status']) => void
}) {
  const [responding, setResponding] = useState(false)
  const [localDone, setLocalDone] = useState<'accepted' | 'denied' | null>(null)

  const br = msg.bookingRequest
  if (!br) return null

  const dateLabel = br.startDate
    ? new Date(br.startDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const isRequester = currentUserId !== null && currentUserId === br.cancellationRequesterUserId

  const respond = async (accept: boolean) => {
    if (!token || responding) return
    setResponding(true)
    try {
      const res = await fetch(`${API_BASE}/api/events/booking-request/${br.id}/cancel-response`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept }),
      })
      if (res.ok) {
        setLocalDone(accept ? 'accepted' : 'denied')
        if (accept) onStatusUpdate(msg.id, 'CANCELLED')
      }
    } catch (err) {
      console.error('cancel-response:', err)
    } finally {
      setResponding(false)
    }
  }

  return (
    <div className="max-w-sm w-full rounded-2xl border border-orange-500/30 bg-orange-900/15 overflow-hidden">
      <div className="px-4 py-3 border-b border-orange-500/20 flex items-center gap-2">
        <span className="text-base">🚫</span>
        <span className="text-sm font-semibold text-orange-300">Demande d&apos;annulation</span>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        <p className="text-sm text-white/80 capitalize">📅 {dateLabel}</p>
        {br.cancellationNote && (
          <p className="text-sm text-white/55 italic border-l-2 border-orange-500/40 pl-3">&ldquo;{br.cancellationNote}&rdquo;</p>
        )}
      </div>
      <div className="px-4 pb-4">
        {localDone === 'accepted' ? (
          <p className="text-xs text-green-400 font-medium">✅ Annulation confirmée</p>
        ) : localDone === 'denied' ? (
          <p className="text-xs text-white/40">❌ Demande d&apos;annulation refusée</p>
        ) : isRequester ? (
          <p className="text-xs text-white/35">En attente de confirmation…</p>
        ) : (
          <div className="flex gap-2 mt-1">
            <button onClick={() => respond(true)} disabled={responding}
              className="flex-1 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-500 disabled:opacity-30 transition">
              ✓ Confirmer l&apos;annulation
            </button>
            <button onClick={() => respond(false)} disabled={responding}
              className="flex-1 py-2 rounded-xl bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 disabled:opacity-30 transition">
              ✕ Refuser
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
