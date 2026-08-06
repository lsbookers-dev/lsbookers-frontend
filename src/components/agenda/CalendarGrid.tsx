// agenda/CalendarGrid.tsx — Grille calendrier (layout B+C : côté à côte + palette slate/indigo)

import { Send, X, Clock, MapPin } from 'lucide-react'
import { CalEvent, AvailDay } from './types'
import { DAYS_FR, AVAIL_OPTIONS, isSameDay, formatHour } from './helpers'

interface CalendarGridProps {
  cells: (Date | null)[]
  events: CalEvent[]
  availability: AvailDay[]
  selected: Date | null
  loading: boolean
  now: Date
  isOwner: boolean
  showAvailability: boolean
  savingAvail: boolean
  selectedEvents: CalEvent[]
  selectedAvail: AvailDay | undefined
  canBook: boolean
  bookingSent: boolean
  showBookingForm: boolean
  bookingMsg: string
  bookingFee: string
  bookingSending: boolean
  setSelected: (d: Date | null) => void
  setShowBookingForm: (v: boolean) => void
  setBookingMsg: (v: string) => void
  setBookingFee: (v: string) => void
  saveAvailability: (status: string) => void
  sendBookingRequest: () => void
  openEventFromCalendar: (id: number) => void
}

/* ── Couleur de la barre de disponibilité ── */
function availBarColor(status?: string) {
  if (status === 'AVAILABLE')   return '#4ade80'
  if (status === 'UNAVAILABLE') return '#f87171'
  if (status === 'TENTATIVE')   return '#fb923c'
  if (status === 'BOOKED')      return '#fbbf24'
  return 'transparent'
}

function availBgClass(status?: string) {
  if (status === 'AVAILABLE')   return 'bg-green-500/[0.06] border border-green-500/[0.15]'
  if (status === 'UNAVAILABLE') return 'bg-red-500/[0.06] border border-red-500/[0.12]'
  if (status === 'TENTATIVE')   return 'bg-orange-500/[0.06] border border-orange-500/[0.12]'
  if (status === 'BOOKED')      return 'bg-amber-500/[0.06] border border-amber-500/[0.12]'
  return ''
}

/* ── Couleur de barre verticale pour les événements ── */
function eventBarColor(cat?: string | null) {
  const map: Record<string, string> = {
    Club: '#a78bfa', Mariage: '#f472b6', Corporate: '#60a5fa',
    Festival: '#fbbf24', Concert: '#4ade80', Privé: '#fb7185',
  }
  return cat && map[cat] ? map[cat] : '#818cf8'
}

export default function CalendarGrid({
  cells, events, availability, selected, loading, now,
  isOwner, showAvailability,
  savingAvail, selectedEvents, selectedAvail,
  canBook, bookingSent, showBookingForm, bookingMsg, bookingFee, bookingSending,
  setSelected, setShowBookingForm, setBookingMsg, setBookingFee,
  saveAvailability, sendBookingRequest, openEventFromCalendar,
}: CalendarGridProps) {

  function dayInfo(date: Date) {
    const dayEvents = events.filter(e => isSameDay(new Date(e.start), date))
    const avail     = availability.find(a => isSameDay(new Date(a.date), date))
    return { dayEvents, avail }
  }

  const totalEvents = events.length

  return (
    <div className="flex min-h-0" style={{ minHeight: 320 }}>

      {/* ── Grille gauche ── */}
      <div className="flex-1 min-w-0 p-4" style={{ borderRight: '0.5px solid #1c2030' }}>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_FR.map((d, i) => (
            <div key={i} className="text-center font-medium py-1" style={{ fontSize: 10, color: '#8892b0', letterSpacing: '0.05em' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Cellules */}
        {loading ? (
          <div className="h-40 flex items-center justify-center" style={{ color: '#8892b0', fontSize: 13 }}>
            Chargement…
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((date, i) => {
              if (!date) return <div key={i} />
              const { dayEvents, avail } = dayInfo(date)
              const isToday    = isSameDay(date, now)
              const isSelected = selected && isSameDay(date, selected)
              const isPast     = date < now && !isToday

              let cellStyle: React.CSSProperties = {}
              let numColor = '#8892b0'

              if (isSelected) {
                cellStyle = { background: '#4f46e5', outline: '2px solid #6366f1', outlineOffset: 1, borderRadius: 10 }
                numColor = '#ffffff'
              } else if (isToday) {
                cellStyle = { background: 'rgba(79,70,229,0.12)', border: '1px solid #4f46e5', borderRadius: 10 }
                numColor = '#a5b4fc'
              } else if (avail) {
                cellStyle = { borderRadius: 10 }
                numColor = isPast ? '#6b7a9a' : '#e2e8f8'
              } else {
                numColor = isPast ? '#5a6580' : '#8892b0'
              }

              return (
                <button
                  key={i}
                  onClick={() => setSelected(isSelected ? null : date)}
                  className={`relative flex flex-col items-center transition-all ${!isSelected && avail ? availBgClass(avail.status) : ''}`}
                  style={{ padding: '7px 2px 5px', borderRadius: isSelected || isToday ? undefined : 10, ...cellStyle }}
                >
                  <span style={{ fontSize: 12, fontWeight: isSelected || isToday ? 600 : 500, color: numColor, lineHeight: 1 }}>
                    {date.getDate()}
                  </span>

                  {/* Points d'événements */}
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((e, j) => (
                        <span
                          key={j}
                          style={{
                            width: 3, height: 3, borderRadius: '50%',
                            background: isSelected ? 'rgba(255,255,255,0.7)' : isToday ? '#a5b4fc' : eventBarColor(e.category),
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Barre de disponibilité en bas */}
                  {!isSelected && avail && (
                    <span
                      style={{
                        position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                        width: 14, height: 2, borderRadius: 1,
                        background: availBarColor(avail.status),
                        opacity: 0.8,
                        display: dayEvents.length > 0 ? 'none' : 'block',
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Légende */}
        <div className="flex items-center gap-4 mt-3 pt-3 flex-wrap" style={{ borderTop: '0.5px solid #1c2030' }}>
          <span className="flex items-center gap-1.5" style={{ fontSize: 10, color: '#8892b0' }}>
            <span style={{ display: 'inline-block', width: 12, height: 2, background: '#4ade80', borderRadius: 1 }} />
            Disponible
          </span>
          <span className="flex items-center gap-1.5" style={{ fontSize: 10, color: '#8892b0' }}>
            <span style={{ display: 'inline-block', width: 12, height: 2, background: '#fb923c', borderRadius: 1 }} />
            En discussion
          </span>
          <span className="flex items-center gap-1.5" style={{ fontSize: 10, color: '#8892b0' }}>
            <span style={{ display: 'inline-block', width: 12, height: 2, background: '#f87171', borderRadius: 1 }} />
            Indisponible
          </span>
          {totalEvents > 0 && (
            <span className="ml-auto" style={{ fontSize: 10, color: '#8892b0' }}>
              {totalEvents} événement{totalEvents > 1 ? 's' : ''} ce mois
            </span>
          )}
        </div>
      </div>

      {/* ── Panneau droit — détail du jour ── */}
      <div className="flex flex-col" style={{ width: 210, minWidth: 180, background: '#0d1020', padding: '14px 14px' }}>

        {selected ? (
          <>
            {/* En-tête */}
            <div className="flex items-center justify-between mb-3">
              <p style={{ fontSize: 11, color: '#485272', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                {selected.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
              <button onClick={() => setSelected(null)} style={{ color: '#2d3554', background: 'transparent', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
                <X size={13} />
              </button>
            </div>

            {/* Statut dispo (visiteur) */}
            {!isOwner && selectedAvail && (
              <div className="mb-3 rounded-lg px-2.5 py-1.5" style={{
                fontSize: 11, fontWeight: 500,
                background: selectedAvail.status === 'AVAILABLE' ? 'rgba(74,222,128,0.08)' : selectedAvail.status === 'UNAVAILABLE' ? 'rgba(248,113,113,0.08)' : 'rgba(251,146,60,0.08)',
                border: `0.5px solid ${selectedAvail.status === 'AVAILABLE' ? 'rgba(74,222,128,0.2)' : selectedAvail.status === 'UNAVAILABLE' ? 'rgba(248,113,113,0.2)' : 'rgba(251,146,60,0.2)'}`,
                color: selectedAvail.status === 'AVAILABLE' ? '#4ade80' : selectedAvail.status === 'UNAVAILABLE' ? '#f87171' : '#fb923c',
              }}>
                {selectedAvail.status === 'AVAILABLE' ? '● Disponible' :
                 selectedAvail.status === 'UNAVAILABLE' ? '● Indisponible' :
                 selectedAvail.status === 'TENTATIVE' ? '● En discussion' : '● Booké'}
              </div>
            )}

            {/* Propriétaire : gestion des dispos */}
            {isOwner && showAvailability && (
              <div className="mb-3">
                <p style={{ fontSize: 10, color: '#485272', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ma disponibilité</p>
                <div className="flex flex-col gap-1.5">
                  {AVAIL_OPTIONS.map(opt => (
                    <button
                      key={opt.status}
                      onClick={() => saveAvailability(opt.status)}
                      disabled={savingAvail}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 500,
                        cursor: 'pointer', transition: 'all .15s',
                        background: selectedAvail?.status === opt.status ? 'rgba(255,255,255,0.08)' : 'transparent',
                        border: selectedAvail?.status === opt.status ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid transparent',
                        color: opt.status === 'AVAILABLE' ? '#4ade80' : opt.status === 'UNAVAILABLE' ? '#f87171' : '#fb923c',
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: availBarColor(opt.status), flexShrink: 0 }} />
                      {opt.label}
                      {selectedAvail?.status === opt.status && <span style={{ marginLeft: 'auto', opacity: 0.5 }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Booking (organisateur visiteur) */}
            {canBook && !bookingSent && (
              <div className="mb-3">
                {!showBookingForm ? (
                  <button
                    onClick={() => setShowBookingForm(true)}
                    style={{
                      width: '100%', padding: '6px 0', borderRadius: 8, fontSize: 11, fontWeight: 500,
                      background: 'rgba(99,102,241,0.12)', border: '0.5px solid rgba(99,102,241,0.3)',
                      color: '#a5b4fc', cursor: 'pointer',
                    }}
                  >
                    Proposer un booking
                  </button>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid #1c2030', borderRadius: 10, padding: 10 }}>
                    <p style={{ fontSize: 10, color: '#485272', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Demande de booking</p>
                    <textarea
                      value={bookingMsg}
                      onChange={e => setBookingMsg(e.target.value)}
                      placeholder="Type d'événement, lieu, horaires…"
                      rows={3}
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.04)', border: '0.5px solid #1c2030',
                        borderRadius: 8, padding: '6px 8px', fontSize: 11, color: '#d0daf0',
                        resize: 'none', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="number"
                      value={bookingFee}
                      onChange={e => setBookingFee(e.target.value)}
                      placeholder="Cachet (€) — optionnel"
                      style={{
                        width: '100%', marginTop: 6, background: 'rgba(255,255,255,0.04)', border: '0.5px solid #1c2030',
                        borderRadius: 8, padding: '5px 8px', fontSize: 11, color: '#d0daf0',
                        outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button
                        onClick={sendBookingRequest}
                        disabled={bookingSending}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          padding: '6px 0', borderRadius: 8, fontSize: 11, fontWeight: 500,
                          background: '#4f46e5', border: 'none', color: '#fff', cursor: 'pointer', opacity: bookingSending ? 0.5 : 1,
                        }}
                      >
                        <Send size={11} />{bookingSending ? 'Envoi…' : 'Envoyer'}
                      </button>
                      <button
                        onClick={() => setShowBookingForm(false)}
                        style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '0.5px solid #1c2030', color: '#485272', cursor: 'pointer' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Confirmation booking */}
            {bookingSent && (
              <div className="mb-3 rounded-lg px-2.5 py-1.5" style={{ fontSize: 11, background: 'rgba(74,222,128,0.08)', border: '0.5px solid rgba(74,222,128,0.2)', color: '#4ade80' }}>
                ✓ Demande envoyée !
              </div>
            )}

            {/* Séparateur */}
            <div style={{ borderTop: '0.5px solid #1c2030', marginBottom: 10 }} />

            {/* Événements du jour */}
            {selectedEvents.length === 0 ? (
              <p style={{ fontSize: 11, color: '#2d3554', fontStyle: 'italic' }}>Aucun événement</p>
            ) : (
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                {selectedEvents.map(e => {
                  const barColor = eventBarColor(e.category)
                  return (
                    <div
                      key={e.id}
                      style={{ display: 'flex', alignItems: 'stretch', gap: 0, background: 'rgba(255,255,255,0.03)', border: '0.5px solid #1c2030', borderRadius: 8, overflow: 'hidden' }}
                    >
                      <div style={{ width: 3, background: barColor, flexShrink: 0 }} />
                      <div style={{ padding: '7px 9px', flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 500, color: '#d0daf0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.title}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          {!e.allDay && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#9ea8c8' }}>
                              <Clock style={{ width: 10, height: 10 }} />{formatHour(e.start)}{e.end ? ` – ${formatHour(e.end)}` : ''}
                            </span>
                          )}
                          {e.lieu && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#9ea8c8' }}>
                              <MapPin style={{ width: 10, height: 10 }} />{e.lieu}
                            </span>
                          )}
                        </div>
                        {isOwner && (
                          <button
                            onClick={() => openEventFromCalendar(e.id)}
                            style={{ marginTop: 5, fontSize: 10, color: '#6366f1', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            Gérer →
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          /* Aucun jour sélectionné */
          <div className="flex flex-col items-center justify-center h-full gap-2" style={{ opacity: 0.35 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p style={{ fontSize: 11, color: '#9ea8c8', textAlign: 'center', lineHeight: 1.5 }}>Sélectionnez<br />un jour</p>
          </div>
        )}
      </div>
    </div>
  )
}
