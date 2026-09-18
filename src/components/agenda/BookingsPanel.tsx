// agenda/BookingsPanel.tsx — Panneau "Mes Bookings"

import { BookingItem } from './types'
import { BkStatusBadge, PayBadge } from './helpers'
import { BellRing, CalendarDays, Clock3, MessageCircle, Send, WalletCards } from 'lucide-react'

interface BookingsPanelProps {
  panelData: { received: BookingItem[]; sent: BookingItem[] } | null
  panelLoading: boolean
  panelTab: 'pending' | 'upcoming' | 'past' | 'cancelled'
  profileId: number
  cancelingId: number | null
  cancelNoteFor: number | null
  cancelNoteText: string
  cancelRequestingId: number | null
  updatingPayment: number | null
  setPanelTab: (tab: 'pending' | 'upcoming' | 'past' | 'cancelled') => void
  setCancelNoteFor: (id: number | null) => void
  setCancelNoteText: (text: string) => void
  cancelBooking: (id: number) => void
  requestCancellation: (id: number) => void
  updatePaymentStatus: (id: number, status: string) => void
}

export default function BookingsPanel({
  panelData, panelLoading, panelTab, profileId,
  cancelingId, cancelNoteFor, cancelNoteText, cancelRequestingId, updatingPayment,
  setPanelTab, setCancelNoteFor, setCancelNoteText,
  cancelBooking, requestCancellation, updatePaymentStatus,
}: BookingsPanelProps) {
  const received = (panelData?.received || []) as BookingItem[]
  const sent     = (panelData?.sent     || []) as BookingItem[]
  const now2     = new Date()

  type CombinedItem = BookingItem & { direction: 'received' | 'sent' }
  const allItems: CombinedItem[] = [
    ...received.map(b => ({ ...b, direction: 'received' as const })),
    ...sent.map(b =>     ({ ...b, direction: 'sent'     as const })),
  ].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

  const tabItems = {
    pending:   allItems.filter(b => b.status === 'PENDING'),
    upcoming:  allItems.filter(b => b.status === 'ACCEPTED' && new Date(b.startDate) > now2),
    past:      allItems.filter(b => b.status === 'ACCEPTED' && new Date(b.startDate) <= now2),
    cancelled: allItems.filter(b => ['CANCELLED', 'DECLINED'].includes(b.status)),
  }

  const TABS = [
    { key: 'pending'   as const, label: 'Offres',   count: tabItems.pending.length },
    { key: 'upcoming'  as const, label: 'À venir',  count: tabItems.upcoming.length },
    { key: 'past'      as const, label: 'Passés',   count: tabItems.past.length },
    { key: 'cancelled' as const, label: 'Annulés',  count: tabItems.cancelled.length },
  ]

  const fmt = (n: number) => n === 0 ? '—' : `${n.toLocaleString('fr-FR')} €`
  const personName = (b: BookingItem, side: 'requester' | 'target') => {
    const p = b[side]
    return p?.user?.pseudo || [p?.user?.firstName, p?.user?.lastName].filter(Boolean).join(' ') || '?'
  }

  const acceptedReceived  = received.filter(b => b.status === 'ACCEPTED')
  const totalEarnings     = acceptedReceived.reduce((s, b) => s + (b.fee || 0), 0)
  const thisYearEarnings  = acceptedReceived.filter(b => new Date(b.startDate).getFullYear() === now2.getFullYear()).reduce((s, b) => s + (b.fee || 0), 0)
  const thisMonthEarnings = acceptedReceived.filter(b => new Date(b.startDate).getFullYear() === now2.getFullYear() && new Date(b.startDate).getMonth() === now2.getMonth()).reduce((s, b) => s + (b.fee || 0), 0)

  const currentItems = tabItems[panelTab]

  return (
    <div className="max-h-[580px] space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.11),transparent_34%),linear-gradient(180deg,rgba(14,17,28,0.98),rgba(9,10,16,0.98))] p-4 sm:p-5">
      {panelLoading ? (
        <div className="flex min-h-36 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.025]">
          <p className="text-center text-sm text-white/45">Chargement…</p>
        </div>
      ) : (
        <>
          {/* Stats financières */}
          <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-3">
            {[
              { label: 'Ce mois',     value: fmt(thisMonthEarnings),  cls: 'from-violet-500/18 to-fuchsia-500/5 border-violet-300/15', icon: 'text-violet-300' },
              { label: 'Cette année', value: fmt(thisYearEarnings),   cls: 'from-cyan-500/14 to-blue-500/5 border-cyan-300/15', icon: 'text-cyan-300' },
              { label: 'Total',       value: fmt(totalEarnings),      cls: 'from-emerald-500/14 to-teal-500/5 border-emerald-300/15', icon: 'text-emerald-300' },
            ].map(({ label, value, cls, icon }) => (
              <div key={label} className={`rounded-2xl border bg-gradient-to-br p-3.5 ${cls}`}>
                <div className="mb-2 flex items-center gap-1.5">
                  <WalletCards className={`h-3.5 w-3.5 ${icon}`} aria-hidden="true" />
                  <p className="text-[11px] font-medium text-white/55">{label}</p>
                </div>
                <p className="text-base font-semibold tracking-tight text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Sous-onglets */}
          <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/8 bg-black/20 p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setPanelTab(tab.key)}
                className={`flex min-h-11 min-w-[76px] flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-[11px] font-medium transition ${
                  panelTab === tab.key
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_8px_24px_rgba(124,58,237,0.24)]'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                }`}
              >
                <span className="truncate text-center">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] ${panelTab === tab.key ? 'bg-white/15 text-white' : 'bg-white/5 text-white/45'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Liste de la tab active */}
          {currentItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-4 py-8 text-center">
              <CalendarDays className="mx-auto mb-2 h-5 w-5 text-violet-300/45" aria-hidden="true" />
              <p className="text-xs text-white/40">Aucun booking dans cette catégorie</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentItems.map(b => {
                const isSent   = b.direction === 'sent'
                const name     = personName(b, isSent ? 'target' : 'requester')
                const isFuture = new Date(b.startDate) > now2
                const hasCancelRequest   = !!b.cancellationRequestedBy
                const isMyCancel         = hasCancelRequest && b.cancellationRequestedBy === profileId
                const showCancelNoteForm = cancelNoteFor === b.id

                return (
                  <div key={`${b.direction}-${b.id}`} className="space-y-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.065] to-white/[0.025] p-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                    {/* Entête */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-1.5">
                          <span className={`inline-flex min-h-6 shrink-0 items-center gap-1 rounded-full border px-2 text-[10px] font-medium ${isSent ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200' : 'border-violet-400/20 bg-violet-400/10 text-violet-200'}`}>
                            <Send className="h-2.5 w-2.5" aria-hidden="true" />
                            {isSent ? 'Envoyé' : 'Reçu'}
                          </span>
                          <p className="text-sm font-medium text-white truncate">{name}</p>
                        </div>
                        <p className="flex items-center gap-1.5 text-xs text-white/55">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-violet-300/80" aria-hidden="true" />
                          {new Date(b.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {b.fee ? ` · ${Number(b.fee).toLocaleString('fr-FR')} €` : ''}
                        </p>
                      </div>
                      <BkStatusBadge status={b.status} />
                    </div>

                    {b.status === 'ACCEPTED' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <PayBadge status={b.paymentStatus} />
                        {/* Boutons changement statut paiement — organisateur seulement */}
                        {b.direction === 'sent' && (
                          <div className="flex gap-1 flex-wrap">
                            {[
                              { key: 'UNPAID',  label: 'Non payé',  cls: 'bg-white/5 text-white/40' },
                              { key: 'DEPOSIT', label: 'Acompte',   cls: 'bg-amber-600/20 text-amber-300' },
                              { key: 'PAID',    label: 'Payé',      cls: 'bg-green-600/20 text-green-300' },
                              { key: 'DIRECT',  label: 'En direct', cls: 'bg-blue-600/20 text-blue-300' },
                            ].map(opt => (
                              <button
                                key={opt.key}
                                onClick={() => updatePaymentStatus(b.id, opt.key)}
                                disabled={updatingPayment === b.id || b.paymentStatus === opt.key}
                                className={`min-h-8 rounded-full border border-white/10 px-2.5 text-[10px] transition disabled:opacity-40 ${
                                  b.paymentStatus === opt.key ? 'opacity-40 cursor-default' : 'hover:brightness-125'
                                } ${opt.cls}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lien conversation */}
                    {b.conversationId && (
                      <a href={`/messages?c=${b.conversationId}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-1 text-[11px] font-medium text-violet-300 transition hover:text-violet-200">
                        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> Voir la conversation
                      </a>
                    )}

                    {/* Annuler une demande PENDING envoyée */}
                    {b.status === 'PENDING' && isSent && (
                      <button
                        onClick={() => cancelBooking(b.id)}
                        disabled={cancelingId === b.id}
                        className="min-h-11 w-full rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 text-xs font-medium text-rose-200 transition hover:bg-rose-500/15 disabled:opacity-40"
                      >
                        {cancelingId === b.id ? 'Annulation…' : 'Annuler ma demande'}
                      </button>
                    )}

                    {/* Demander l'annulation d'un booking ACCEPTED futur */}
                    {b.status === 'ACCEPTED' && isFuture && !showCancelNoteForm && (
                      hasCancelRequest ? (
                        <p className={`flex items-start gap-1.5 rounded-xl border px-3 py-2 text-[11px] leading-relaxed ${isMyCancel ? 'border-white/8 bg-white/[0.025] text-white/45' : 'border-amber-400/15 bg-amber-400/5 text-amber-200'}`}>
                          {isMyCancel ? <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <BellRing className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                          {isMyCancel
                            ? 'Annulation demandée — en attente de l\'autre partie'
                            : 'Annulation demandée — voir la conversation'}
                        </p>
                      ) : (
                        <button
                          onClick={() => { setCancelNoteFor(b.id); setCancelNoteText('') }}
                          className="min-h-9 rounded-lg px-1 text-[11px] text-white/45 transition hover:text-amber-300"
                        >
                          Demander l&apos;annulation…
                        </button>
                      )
                    )}

                    {/* Formulaire note d'annulation */}
                    {showCancelNoteForm && (
                      <div className="space-y-2">
                        <textarea
                          value={cancelNoteText}
                          onChange={e => setCancelNoteText(e.target.value)}
                          placeholder="Raison (optionnel)…"
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-orange-500/40 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => requestCancellation(b.id)}
                            disabled={cancelRequestingId === b.id}
                          className="min-h-11 flex-1 rounded-xl bg-amber-500/85 px-3 text-xs font-medium text-slate-950 transition hover:bg-amber-400 disabled:opacity-40"
                          >
                            {cancelRequestingId === b.id ? 'Envoi…' : 'Envoyer la demande'}
                          </button>
                          <button
                            onClick={() => { setCancelNoteFor(null); setCancelNoteText('') }}
                            className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-xs text-white/55 transition hover:bg-white/10"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
