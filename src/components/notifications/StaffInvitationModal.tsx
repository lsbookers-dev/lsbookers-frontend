'use client'

/** Invitation dans l'équipe d'un événement : tout le détail, avec Accepter / Refuser (ouverte depuis la notification). */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import SafeImage from '@/components/SafeImage'
import LsIcon from '@/components/ui/LsIcon'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'

type Invitation = {
  staffId: number; eventId: number; status: string; role: string; fee: number | null; notes: string | null
  event: { title: string; start: string; end: string | null; allDay: boolean; lieu: string | null; description: string | null }
  organizer: { userId: number; avatar: string | null; name: string } | null
}

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export default function StaffInvitationModal({ eventId, staffId, responding, onRespond, onClose }: {
  eventId: number
  staffId: number
  responding?: boolean
  onRespond: (response: 'ACCEPT' | 'REFUSE') => void
  onClose: () => void
}) {
  const [inv, setInv] = useState<Invitation | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    apiFetch(apiUrl(`events/${eventId}/staff/${staffId}/invitation`))
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setInv(d.invitation))
      .catch(() => setFailed(true))
  }, [eventId, staffId])

  const answered = inv && ['BOOKED', 'CANCELLED'].includes(inv.status)

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="staff-invite-title" onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md space-y-4 rounded-3xl border border-white/12 bg-surface p-5 sm:p-6">
        <button type="button" onClick={onClose} aria-label="Fermer" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-white/60 hover:text-white">
          <X size={16} />
        </button>
        <p className="text-xs font-semibold uppercase tracking-[.12em] text-accent-light">Invitation dans une équipe</p>

        {failed ? (
          <p className="text-sm text-white/60">Cette invitation n&apos;est plus disponible.</p>
        ) : !inv ? (
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
        ) : (
          <>
            <h2 id="staff-invite-title" className="pr-10 text-xl font-bold leading-tight text-white">{inv.event.title}</h2>
            {inv.organizer && (
              <div className="flex items-center gap-2.5 text-sm text-white/70">
                <SafeImage type="avatar" src={inv.organizer.avatar} name={inv.organizer.name} size={32} />
                <span>Invitation de <strong className="font-semibold text-white">{inv.organizer.name}</strong></span>
              </div>
            )}
            <ul className="space-y-2 rounded-2xl border border-white/[0.09] bg-surface-2 p-4 text-sm text-white/80">
              <li className="flex items-start gap-2.5"><LsIcon name="stage" size={16} tone="accent" className="mt-0.5" /><span>Poste : <strong className="text-white">{inv.role}</strong></span></li>
              <li className="flex items-start gap-2.5"><LsIcon name="calendar" size={16} tone="accent" className="mt-0.5" />
                <span className="capitalize">{dateLabel(inv.event.start)}{!inv.event.allDay && <span className="normal-case"> · {timeLabel(inv.event.start)}{inv.event.end ? ` – ${timeLabel(inv.event.end)}` : ''}</span>}</span>
              </li>
              <li className="flex items-start gap-2.5"><LsIcon name="pin" size={16} tone="accent" className="mt-0.5" /><span>{inv.event.lieu || 'Lieu non précisé'}</span></li>
              {inv.fee != null && (
                <li className="flex items-start gap-2.5"><LsIcon name="payment" size={16} tone="gold" className="mt-0.5" /><span>Cachet proposé : <strong className="text-gold-light">{inv.fee.toLocaleString('fr-FR')} €</strong></span></li>
              )}
            </ul>
            {inv.notes && (
              <div className="rounded-2xl border border-white/[0.09] p-4">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[.1em] text-white/45">Message</p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-white/75">{inv.notes}</p>
              </div>
            )}
            {inv.event.description && (
              <p className="line-clamp-4 whitespace-pre-line text-xs leading-relaxed text-white/50">{inv.event.description}</p>
            )}

            {answered ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm text-white/70">
                {inv.status === 'BOOKED' ? 'Vous avez accepté cette invitation.' : 'Vous avez refusé cette invitation.'}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" disabled={responding} onClick={() => onRespond('REFUSE')} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.06] disabled:opacity-40">Refuser</button>
                <button type="button" disabled={responding} onClick={() => onRespond('ACCEPT')} className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-40">{responding ? '…' : 'Accepter'}</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
