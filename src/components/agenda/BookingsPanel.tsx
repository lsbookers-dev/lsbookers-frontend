// agenda/BookingsPanel.tsx — Panneau "Mes Bookings"

import { BookingItem } from './types'
import { BkStatusBadge, PayBadge } from './helpers'

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
    <div className="p-4 max-h-[580px] overflow-y-auto space-y-4">
      {panelLoading ? (
        <p className="text-center text-white/30 text-sm py-8">Chargement…</p>
      ) : (
        <>
          {/* Stats financières */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Ce mois',     value: fmt(thisMonthEarnings) },
              { label: 'Cette année', value: fmt(thisYearEarnings)  },
              { label: 'Total',       value: fmt(totalEarnings)     },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-[10px] text-white/40 mb-1">{label}</p>
                <p className="text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Sous-onglets */}
          <div className="grid grid-cols-4 gap-1 bg-white/5 rounded-xl p-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setPanelTab(tab.key)}
                className={`flex flex-col items-center py-1.5 px-1 rounded-lg text-[10px] font-medium transition ${
                  panelTab === tab.key ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <span className="truncate w-full text-center">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`mt-0.5 text-[9px] ${panelTab === tab.key ? 'text-white/70' : 'text-white/30'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Liste de la tab active */}
          {currentItems.length === 0 ? (
            <p className="text-xs text-white/25 italic text-center py-4">Aucun booking dans cette catégorie</p>
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
                  <div key={`${b.direction}-${b.id}`} className="bg-white/5 rounded-xl p-3 border border-white/8 space-y-2">
                    {/* Entête */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${isSent ? 'bg-blue-500/20 text-blue-300' : 'bg-violet-500/20 text-violet-300'}`}>
                            {isSent ? 'Envoyé' : 'Reçu'}
                          </span>
                          <p className="text-sm font-medium text-white truncate">{name}</p>
                        </div>
                        <p className="text-xs text-white/50">
                          📅 {new Date(b.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                                className={`text-[9px] px-1.5 py-0.5 rounded-full border border-white/10 transition disabled:opacity-40 ${
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
                      <a href={`/messages?c=${b.conversationId}`} className="text-[10px] text-violet-400 hover:text-violet-300 transition block">
                        → Voir la conversation
                      </a>
                    )}

                    {/* Annuler une demande PENDING envoyée */}
                    {b.status === 'PENDING' && isSent && (
                      <button
                        onClick={() => cancelBooking(b.id)}
                        disabled={cancelingId === b.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/20 text-red-400 hover:bg-red-600/30 disabled:opacity-40 transition w-full"
                      >
                        {cancelingId === b.id ? 'Annulation…' : 'Annuler ma demande'}
                      </button>
                    )}

                    {/* Demander l'annulation d'un booking ACCEPTED futur */}
                    {b.status === 'ACCEPTED' && isFuture && !showCancelNoteForm && (
                      hasCancelRequest ? (
                        <p className={`text-[10px] ${isMyCancel ? 'text-white/30' : 'text-orange-400'}`}>
                          {isMyCancel
                            ? '🔄 Annulation demandée — en attente de l\'autre partie'
                            : '🔔 Annulation demandée — voir la conversation'}
                        </p>
                      ) : (
                        <button
                          onClick={() => { setCancelNoteFor(b.id); setCancelNoteText('') }}
                          className="text-[10px] text-white/35 hover:text-orange-400 transition block"
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
                            className="flex-1 py-1.5 rounded-lg bg-orange-600/80 text-white text-xs font-medium hover:bg-orange-500/80 disabled:opacity-40 transition"
                          >
                            {cancelRequestingId === b.id ? 'Envoi…' : 'Envoyer la demande'}
                          </button>
                          <button
                            onClick={() => { setCancelNoteFor(null); setCancelNoteText('') }}
                            className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs hover:bg-white/10 transition"
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
