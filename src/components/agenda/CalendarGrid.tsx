import { CalendarCheck, Clock, MapPin, Send, X, CheckSquare } from 'lucide-react'
import { CalEvent, AvailDay } from './types'
import { AVAIL_OPTIONS, isSameDay, formatHour, availCellStyle, availDotColor } from './helpers'

interface CalendarGridProps {
  focusDate: Date
  viewMode: 'week' | 'month'
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
  // Multi-select
  multiSelectMode: boolean
  bulkDates: Set<string>
  setMultiSelectMode: (v: boolean) => void
  toggleBulkDate: (d: Date) => void
  saveBulkAvailability: (status: string) => void
  // Actions
  setSelected: (d: Date | null) => void
  setShowBookingForm: (v: boolean) => void
  setBookingMsg: (v: string) => void
  setBookingFee: (v: string) => void
  saveAvailability: (status: string) => void
  sendBookingRequest: () => void
  openEventFromCalendar: (id: number) => void
}

const START_HOUR = 8
const END_HOUR = 24
const HOURS = [8, 10, 12, 14, 16, 18, 20, 22, 24]

function statusLabel(status?: string) {
  if (status === 'AVAILABLE') return 'Disponible'
  if (status === 'UNAVAILABLE') return 'Indisponible'
  if (status === 'TENTATIVE') return 'Booking en cours'
  if (status === 'BOOKED') return 'Booké'
  return null
}

function eventTone(event: CalEvent) {
  if (event.status === 'CONFIRMED' || event.status === 'PUBLISHED') return 'confirmed'
  if (/festival|concert|club/i.test(event.category || '')) return 'booking'
  if (/tentative|pending|draft/i.test(event.status || '')) return 'pending'
  return 'personal'
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function CalendarGrid(props: CalendarGridProps) {
  const {
    focusDate, viewMode, events, availability, selected, loading, now, isOwner, showAvailability,
    savingAvail, selectedEvents, selectedAvail, canBook, bookingSent, showBookingForm,
    bookingMsg, bookingFee, bookingSending,
    multiSelectMode, bulkDates, setMultiSelectMode, toggleBulkDate, saveBulkAvailability,
    setSelected, setShowBookingForm, setBookingMsg, setBookingFee,
    saveAvailability, sendBookingRequest, openEventFromCalendar,
  } = props

  const monday = new Date(focusDate)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return date
  })

  const firstOfMonth = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1)
  const lastOfMonth = new Date(focusDate.getFullYear(), focusDate.getMonth() + 1, 0)
  const monthCells: Array<Date | null> = [
    ...Array.from({ length: (firstOfMonth.getDay() + 6) % 7 }, () => null),
    ...Array.from({ length: lastOfMonth.getDate() }, (_, index) => new Date(focusDate.getFullYear(), focusDate.getMonth(), index + 1)),
  ]
  while (monthCells.length % 7 !== 0) monthCells.push(null)

  const positionFor = (dateValue: string) => {
    const date = new Date(dateValue)
    const minutes = date.getHours() * 60 + date.getMinutes()
    return Math.max(0, Math.min(100, ((minutes - START_HOUR * 60) / ((END_HOUR - START_HOUR) * 60)) * 100))
  }

  const handleDayClick = (date: Date) => {
    if (multiSelectMode) {
      toggleBulkDate(date)
    } else {
      setSelected(date)
    }
  }

  return (
    <div className={`lsb-week-agenda ${isOwner ? 'is-owner' : 'is-public'}`}>
      <div className="lsb-week-calendar">
        {viewMode === 'week' ? (
          <>
            <div className="lsb-week-days">
              <div className="lsb-week-corner">HEURE</div>
              {days.map((date) => {
                const today = isSameDay(date, now)
                const active = !multiSelectMode && !!selected && isSameDay(date, selected)
                const inBulk = multiSelectMode && bulkDates.has(dateKey(date))
                return (
                  <button key={date.toISOString()} type="button" className={`${today ? 'is-today' : ''} ${active ? 'is-selected' : ''} ${inBulk ? 'is-selected' : ''}`} onClick={() => handleDayClick(date)}>
                    <span>{date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}</span><strong>{date.getDate()}</strong>
                  </button>
                )
              })}
            </div>

            {loading ? (
              <div className="lsb-week-loading">Chargement du planning…</div>
            ) : (
              <div className="lsb-week-scroll">
                <div className="lsb-week-timeline">
                  <div className="lsb-week-hours">
                    {HOURS.map((hour) => <span key={hour} style={{ top: `${((hour - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }}>{String(hour).padStart(2, '0')}:00</span>)}
                  </div>
                  {days.map((date) => {
                    const dayEvents = events.filter((event) => isSameDay(new Date(event.start), date))
                    const avail = availability.find((item) => isSameDay(new Date(item.date), date))
                    return (
                      <div key={date.toISOString()} className={`lsb-week-column ${!multiSelectMode && selected && isSameDay(date, selected) ? 'is-selected' : ''}`}>
                        <button type="button" aria-label={`Sélectionner le ${date.toLocaleDateString('fr-FR')}`} className="lsb-week-day-hit" onClick={() => handleDayClick(date)} />
                        {avail && <span className={`lsb-week-availability ${avail.status.toLowerCase()}`}>{statusLabel(avail.status)}</span>}
                        {dayEvents.map((event) => {
                          const start = positionFor(event.start)
                          const end = event.end ? positionFor(event.end) : Math.min(100, start + 9)
                          return (
                            <button
                              type="button"
                              key={event.id}
                              className={`lsb-week-event ${eventTone(event)}`}
                              style={{ top: `${start}%`, height: `${Math.max(8, end - start)}%` }}
                              onClick={() => { setSelected(date); if (isOwner) openEventFromCalendar(event.id) }}
                            >
                              <time>{formatHour(event.start)}{event.end ? ` – ${formatHour(event.end)}` : ''}</time>
                              <strong>{event.title}</strong>
                              {event.lieu && <span>{event.lieu}</span>}
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                  {isSameDay(now, days.find((day) => isSameDay(day, now)) || new Date(0)) && now.getHours() >= START_HOUR && now.getHours() <= END_HOUR && (
                    <div className="lsb-week-now" style={{ top: `${positionFor(now.toISOString())}%` }} />
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="lsb-month-calendar">
            <div className="lsb-month-weekdays">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((label) => <span key={label}>{label}</span>)}
            </div>
            {loading ? (
              <div className="lsb-week-loading">Chargement du mois…</div>
            ) : (
              <div className="lsb-month-grid">
                {monthCells.map((date, index) => {
                  if (!date) return <div key={`empty-${index}`} className="lsb-month-day is-empty" aria-hidden="true" />
                  const dayEvents = events.filter((event) => isSameDay(new Date(event.start), date))
                  const avail = availability.find((item) => isSameDay(new Date(item.date), date))
                  const active = !multiSelectMode && !!selected && isSameDay(date, selected)
                  const inBulk = multiSelectMode && bulkDates.has(dateKey(date))
                  const cellStyle = availCellStyle(avail?.status)
                  const dotColor = availDotColor(avail?.status)
                  return (
                    <div
                      key={date.toISOString()}
                      className={`lsb-month-day ${isSameDay(date, now) ? 'is-today' : ''} ${active ? 'is-selected' : ''} ${inBulk ? 'is-selected' : ''}`}
                      style={cellStyle}
                    >
                      <button type="button" className="lsb-month-day-hit" aria-label={`Sélectionner le ${date.toLocaleDateString('fr-FR')}`} onClick={() => handleDayClick(date)} />
                      <span className="lsb-month-day-number">{date.getDate()}</span>
                      {/* Indicateur de disponibilité — point coloré */}
                      {avail && dotColor !== 'transparent' && (
                        <span
                          title={statusLabel(avail.status) || ''}
                          style={{
                            position: 'absolute', top: 5, right: 5,
                            width: 7, height: 7, borderRadius: '50%',
                            background: dotColor, flexShrink: 0,
                          }}
                        />
                      )}
                      {/* Coche multi-sélection */}
                      {inBulk && (
                        <span style={{
                          position: 'absolute', top: 3, left: 3,
                          background: 'rgba(99,102,241,0.9)', borderRadius: 4,
                          width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                      )}
                      <div className="lsb-month-events">
                        {dayEvents.slice(0, 3).map((event) => (
                          <button type="button" key={event.id} className={`lsb-month-event ${eventTone(event)}`} onClick={() => { if (!multiSelectMode) { setSelected(date); if (isOwner) openEventFromCalendar(event.id) } }}>
                            <time>{formatHour(event.start)}</time><strong>{event.title}</strong>
                          </button>
                        ))}
                        {dayEvents.length > 3 && <button type="button" className="lsb-month-more" onClick={() => { if (!multiSelectMode) setSelected(date) }}>+ {dayEvents.length - 3} autre{dayEvents.length - 3 > 1 ? 's' : ''}</button>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="lsb-week-legend">
          <span><i style={{ background:'#22c55e', width:8, height:8, borderRadius:'50%', display:'inline-block', marginRight:4 }} />Disponible</span>
          <span><i style={{ background:'#3b82f6', width:8, height:8, borderRadius:'50%', display:'inline-block', marginRight:4 }} />Booking</span>
          <span><i style={{ background:'#ef4444', width:8, height:8, borderRadius:'50%', display:'inline-block', marginRight:4 }} />Indisponible</span>
        </div>
      </div>

      {/* Barre de sélection multiple flottante */}
      {multiSelectMode && (
        <div style={{
          position: 'sticky', bottom: 0,
          background: '#181c28', borderTop: '1px solid #2a3050',
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 12, color: '#8891b0', marginRight: 4 }}>
            {bulkDates.size} jour{bulkDates.size > 1 ? 's' : ''} sélectionné{bulkDates.size > 1 ? 's' : ''}
          </span>
          {AVAIL_OPTIONS.map(opt => (
            <button
              key={opt.status}
              onClick={() => saveBulkAvailability(opt.status)}
              disabled={savingAvail || bulkDates.size === 0}
              style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                border: 'none', cursor: bulkDates.size === 0 ? 'not-allowed' : 'pointer',
                background: opt.status === 'AVAILABLE' ? 'rgba(34,197,94,0.2)'
                           : opt.status === 'UNAVAILABLE' ? 'rgba(239,68,68,0.2)'
                           : 'rgba(59,130,246,0.2)',
                color: opt.status === 'AVAILABLE' ? '#86efac'
                     : opt.status === 'UNAVAILABLE' ? '#fca5a5'
                     : '#93c5fd',
                opacity: bulkDates.size === 0 ? 0.5 : 1,
              }}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => saveBulkAvailability('NONE')}
            disabled={savingAvail || bulkDates.size === 0}
            style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(255,255,255,0.06)', color: '#8891b0', border: 'none', cursor: 'pointer' }}
          >
            Réinitialiser
          </button>
          <button
            onClick={() => { setMultiSelectMode(false) }}
            style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 8, fontSize: 12, color: '#8891b0', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3050', cursor: 'pointer' }}
          >
            Annuler
          </button>
        </div>
      )}

      <aside className="lsb-week-detail">
        {multiSelectMode ? (
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: '#6b7494', letterSpacing: '0.08em', marginBottom: 12 }}>SÉLECTION MULTIPLE</div>
            <p style={{ fontSize: 13, color: '#9ea8c8', marginBottom: 16 }}>
              Clique sur les jours du calendrier pour les sélectionner, puis applique un statut à tous d'un coup.
            </p>
            <p style={{ fontSize: 12, color: '#6b7494' }}>
              {bulkDates.size === 0 ? 'Aucun jour sélectionné' : `${bulkDates.size} jour${bulkDates.size > 1 ? 's' : ''} sélectionné${bulkDates.size > 1 ? 's' : ''}`}
            </p>
            <button
              onClick={() => setMultiSelectMode(false)}
              style={{ marginTop: 16, padding: '7px 14px', borderRadius: 8, fontSize: 12, color: '#8891b0', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3050', cursor: 'pointer' }}
            >
              Annuler
            </button>
          </div>
        ) : selected ? (
          <>
            <div className="lsb-week-detail-head">
              <div>
                <span>JOUR SÉLECTIONNÉ</span>
                <h3>{selected.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Fermer"><X size={15} /></button>
            </div>

            {selectedAvail && (
              <div className={`lsb-selected-status ${selectedAvail.status.toLowerCase()}`}>
                {statusLabel(selectedAvail.status)}
              </div>
            )}

            {isOwner && showAvailability && (
              <div className="lsb-availability-editor">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>MA DISPONIBILITÉ</span>
                  {/* Bouton multi-sélection */}
                  <button
                    onClick={() => { setMultiSelectMode(true); setSelected(null) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 10, color: '#6b7494', background: 'rgba(255,255,255,0.04)',
                      border: '1px solid #2a3050', borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
                    }}
                  >
                    <CheckSquare size={11} /> Multi
                  </button>
                </div>
                {AVAIL_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.status}
                    onClick={() => saveAvailability(option.status)}
                    disabled={savingAvail}
                    className={selectedAvail?.status === option.status ? 'is-active' : ''}
                    title={selectedAvail?.status === option.status ? 'Cliquer pour réinitialiser' : option.label}
                  >
                    <i className={option.status.toLowerCase()} />
                    {option.label}
                    {selectedAvail?.status === option.status && (
                      <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>✕</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {canBook && !bookingSent && (
              <div className="lsb-public-booking">
                {!showBookingForm ? (
                  <button type="button" className="lsb-booking-primary" onClick={() => setShowBookingForm(true)}>
                    Demander un booking
                  </button>
                ) : (
                  <>
                    <span>DEMANDE DE BOOKING</span>
                    <textarea value={bookingMsg} onChange={(event) => setBookingMsg(event.target.value)} placeholder="Type d'événement, lieu, horaires…" rows={3} />
                    <input type="number" value={bookingFee} onChange={(event) => setBookingFee(event.target.value)} placeholder="Cachet proposé (€)" />
                    <button type="button" className="lsb-booking-primary" onClick={sendBookingRequest} disabled={bookingSending}>
                      <Send size={14} />{bookingSending ? 'Envoi…' : 'Envoyer la demande'}
                    </button>
                  </>
                )}
              </div>
            )}
            {bookingSent && <div className="lsb-booking-success"><CalendarCheck size={16} />Demande envoyée</div>}

            <div className="lsb-day-events">
              <span>PROGRAMME</span>
              {selectedEvents.length === 0 ? (
                <p>Aucun événement ce jour.</p>
              ) : (
                selectedEvents.map((event) => (
                  <button type="button" key={event.id} onClick={() => isOwner && openEventFromCalendar(event.id)}>
                    <i className={eventTone(event)} />
                    <div>
                      <strong>{event.title}</strong>
                      <p><Clock size={12} />{formatHour(event.start)}{event.end ? ` – ${formatHour(event.end)}` : ''}</p>
                      {event.lieu && <p><MapPin size={12} />{event.lieu}</p>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="lsb-week-detail-empty">
            <CalendarCheck size={30} />
            <h3>Sélectionnez un jour</h3>
            <p>Consultez le programme, gérez vos disponibilités ou envoyez une demande de booking.</p>
          </div>
        )}
      </aside>
    </div>
  )
}
