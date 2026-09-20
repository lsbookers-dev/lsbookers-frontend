// messages/BookingCards.tsx — Cartes booking request + cancellation request

'use client'

import { useState } from 'react'
import { Ban, Banknote, CalendarDays, Check, RefreshCw, X } from 'lucide-react'
import { API_BASE } from './_helpers'
import type { Message, BookingRequestData } from './types'

/* ── Status badge ────────────────────────────────────────── */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'En attente',
    ACCEPTED: 'Accepté',
    DECLINED: 'Refusé',
    CANCELLED: 'Annulé',
  }
  return (
    <span className={`lsb-booking-status is-${status.toLowerCase()}`}>
      {map[status] || map.PENDING}
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
    <div className="lsb-booking-message-card">
      <div className="lsb-booking-card-heading">
        <div>
          <span>DEMANDE DE BOOKING</span>
          <h3>Proposition de booking</h3>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="lsb-booking-card-body">
        <div className="lsb-booking-facts">
          <div><span><CalendarDays className="w-4 h-4" /></span><p><small>Date proposée</small><strong className="capitalize">{dateLabel}</strong></p></div>
          <div><span><Banknote className="w-4 h-4" /></span><p><small>Cachet</small><strong>{br.fee != null ? `${Number(br.fee).toLocaleString('fr-FR')} €` : 'À définir'}</strong></p></div>
        </div>
        {br.message && (
          <div className="lsb-booking-note"><span>MESSAGE</span><p>&ldquo;{br.message}&rdquo;</p></div>
        )}
      </div>
      {status === 'PENDING' && (
        <div className="lsb-booking-card-footer">
          {!isSender ? (
            showCounter ? (
              <div className="lsb-booking-counter-form">
                <p>Faire une contre-proposition</p>
                <input type="date" value={counterDate} onChange={e => setCounterDate(e.target.value)}
                  className="lsb-booking-field" />
                <input type="number" value={counterFee} onChange={e => setCounterFee(e.target.value)}
                  placeholder="Cachet proposé (€)"
                  className="lsb-booking-field" />
                <textarea value={counterMsg} onChange={e => setCounterMsg(e.target.value)}
                  placeholder="Message (optionnel)…" rows={2}
                  className="lsb-booking-field resize-none" />
                <div className="lsb-booking-actions">
                  <button onClick={submitCounter} disabled={sendingCounter || !counterDate}
                    className="is-primary">
                    {sendingCounter ? 'Envoi…' : 'Envoyer'}
                  </button>
                  <button onClick={() => setShowCounter(false)}
                    className="is-secondary">
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="lsb-booking-actions">
                <button onClick={() => updateStatus('ACCEPTED')} disabled={updating}
                  className="is-primary">
                  <Check className="w-4 h-4" />Accepter
                </button>
                <button onClick={() => setShowCounter(true)}
                  className="is-secondary">
                  <RefreshCw className="w-4 h-4" />Contre-offre
                </button>
                <button onClick={() => updateStatus('DECLINED')} disabled={updating}
                  className="is-danger">
                  <X className="w-4 h-4" />Refuser
                </button>
              </div>
            )
          ) : (
            <div className="lsb-booking-waiting">
              <span>En attente de la réponse du destinataire</span>
              <button onClick={() => updateStatus('CANCELLED')} disabled={updating}
                className="is-danger">
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
    <div className="lsb-booking-message-card is-cancellation">
      <div className="lsb-booking-card-heading">
        <div>
          <span>GESTION DU BOOKING</span>
          <h3>Demande d&apos;annulation</h3>
        </div>
        <span className="lsb-booking-status is-cancel-request"><Ban className="w-3 h-3" /> À confirmer</span>
      </div>
      <div className="lsb-booking-card-body">
        <div className="lsb-booking-facts is-single">
          <div><span><CalendarDays className="w-4 h-4" /></span><p><small>Booking concerné</small><strong className="capitalize">{dateLabel}</strong></p></div>
        </div>
        {br.cancellationNote && (
          <div className="lsb-booking-note"><span>MOTIF</span><p>&ldquo;{br.cancellationNote}&rdquo;</p></div>
        )}
      </div>
      <div className="lsb-booking-card-footer">
        {localDone === 'accepted' ? (
          <p className="lsb-booking-result is-success"><Check className="w-4 h-4" />Annulation confirmée</p>
        ) : localDone === 'denied' ? (
          <p className="lsb-booking-result"><X className="w-4 h-4" />Demande d&apos;annulation refusée</p>
        ) : isRequester ? (
          <p className="lsb-booking-result">En attente de confirmation…</p>
        ) : (
          <div className="lsb-booking-actions">
            <button onClick={() => respond(true)} disabled={responding}
              className="is-primary">
              <Check className="w-4 h-4" />Confirmer l&apos;annulation
            </button>
            <button onClick={() => respond(false)} disabled={responding}
              className="is-secondary">
              <X className="w-4 h-4" />Refuser
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
