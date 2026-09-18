import React from 'react'
import { CalendarCheck, Clock, MapPin, Send, X, Plus } from 'lucide-react'
import { CalEvent, AvailDay } from './types'
import { AVAIL_OPTIONS, isSameDay, formatHour, availCellStyle, availDotColor, isWeekend, getFrenchHolidays } from './helpers'

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
  onCreateFromDate?: (date: Date) => void
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
  if (event.staffStatus === 'PENDING') return 'staff-pending'
  if (event.staffStatus === 'BOOKED')  return 'staff-booked'
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
    onCreateFromDate, setSelected, setShowBookingForm, setBookingMsg, setBookingFee,
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

  /* ── Jours fériés — calculés pour l'année en cours et la suivante (semaine peut chevauchner) ── */
  const year = focusDate.getFullYear()
  const holidays = new Map([...getFrenchHolidays(year), ...getFrenchHolidays(year + 1)])
  function dateKey2(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }
  function getHolidayName(d: Date): string | undefined {
    return holidays.get(dateKey2(d))
  }

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
                const weekend = isWeekend(date)
                const holidayName = getHolidayName(date)
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    className={`${today ? 'is-today' : ''} ${active ? 'is-selected' : ''} ${inBulk ? 'is-selected' : ''} ${weekend ? 'is-weekend' : ''} ${holidayName ? 'is-holiday' : ''}`}
                    onClick={() => handleDayClick(date)}
                  >
                    <span>{date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}</span>
                    <strong>{date.getDate()}</strong>
                    {holidayName && (
                      <em className="lsb-week-holiday-label">
                        {holidayName}
                      </em>
                    )}
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
                    {HOURS.map((hour) => {
                      const topPct = ((hour - START_HOUR) / (END_HOUR - START_HOUR)) * 100
                      const isLast = hour === END_HOUR
                      const label = hour === 24 ? '00:00' : `${String(hour).padStart(2, '0')}:00`
                      return (
                        <span key={hour} style={{ top: `${topPct}%`, transform: isLast ? 'translateY(-115%)' : 'translateY(3px)' }}>
                          {label}
                        </span>
                      )
                    })}
                  </div>
                  {days.map((date) => {
                    const dayEvents = events.filter((event) => isSameDay(new Date(event.start), date))
                    const avail = availability.find((item) => isSameDay(new Date(item.date), date))
                    const weekend = isWeekend(date)
                    const holidayName = getHolidayName(date)
                    return (
                      <div key={date.toISOString()} className={`lsb-week-column ${!multiSelectMode && selected && isSameDay(date, selected) ? 'is-selected' : ''} ${weekend ? 'is-weekend' : ''} ${holidayName ? 'is-holiday' : ''}`}>
                        <button type="button" aria-label={`Sélectionner le ${date.toLocaleDateString('fr-FR')}`} className="lsb-week-day-hit" onClick={() => handleDayClick(date)} />
                        {holidayName && (
                          <span className="lsb-week-holiday-marker">
                            {holidayName}
                          </span>
                        )}
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
                  const availStyle = availCellStyle(avail?.status)
                  const dotColor = availDotColor(avail?.status)
                  const weekend = isWeekend(date)
                  const holidayName = getHolidayName(date)
                  return (
                    <div
                      key={date.toISOString()}
                      className={`lsb-month-day ${isSameDay(date, now) ? 'is-today' : ''} ${active ? 'is-selected' : ''} ${inBulk ? 'is-selected' : ''} ${weekend ? 'is-weekend' : ''} ${holidayName ? 'is-holiday' : ''} ${avail ? 'has-availability' : ''}`}
                      style={availStyle}
                    >
                      <button type="button" className="lsb-month-day-hit" aria-label={`Sélectionner le ${date.toLocaleDateString('fr-FR')}`} onClick={() => handleDayClick(date)} />
                      <span className="lsb-month-day-number">{date.getDate()}</span>
                      {holidayName && (
                        <span className="lsb-month-holiday-label">
                          {holidayName}
                        </span>
                      )}
                      {/* Indicateur de disponibilité — point coloré */}
                      {avail && dotColor !== 'transparent' && (
                        <span
                          title={statusLabel(avail.status) || ''}
                          className="lsb-month-availability-dot"
                          style={{ background: dotColor }}
                        />
                      )}
                      {/* Coche multi-sélection */}
                      {inBulk && (
                        <span className="lsb-month-selection-check">
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
          <span><i className="is-available" />Disponible</span>
          <span><i className="is-booking" />Booking</span>
          <span><i className="is-unavailable" />Indisponible</span>
        </div>
      </div>


      <aside className="lsb-week-detail">
        {multiSelectMode ? (
          <div className="lsb-bulk-editor">
            <div className="lsb-bulk-kicker">SÉLECTION MULTIPLE</div>
            <p className="lsb-bulk-copy">
              Clique sur les jours pour les sélectionner, puis applique un statut à tous d&apos;un coup.
            </p>

            {/* Compteur */}
            <div className={`lsb-bulk-count ${bulkDates.size > 0 ? 'has-selection' : ''}`}>
              {bulkDates.size === 0 ? 'Aucun jour sélectionné' : `${bulkDates.size} jour${bulkDates.size > 1 ? 's' : ''} sélectionné${bulkDates.size > 1 ? 's' : ''}`}
            </div>

            {/* Boutons statut */}
            <div className="lsb-bulk-options">
              {AVAIL_OPTIONS.map(opt => (
                <button
                  key={opt.status}
                  onClick={() => saveBulkAvailability(opt.status)}
                  disabled={savingAvail || bulkDates.size === 0}
                  className={`lsb-bulk-option ${opt.status.toLowerCase()}`}
                >
                  <span />
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Actions secondaires */}
            <div className="lsb-bulk-actions">
              <button
                onClick={() => saveBulkAvailability('NONE')}
                disabled={savingAvail || bulkDates.size === 0}
              >
                Réinitialiser
              </button>
              <button
                onClick={() => setMultiSelectMode(false)}
              >
                Annuler
              </button>
            </div>
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

            {isOwner && onCreateFromDate && selected && (
              <button
                type="button"
                onClick={() => onCreateFromDate(selected)}
                className="lsb-day-create"
              >
                <Plus size={14} /> Créer un événement
              </button>
            )}

            {isOwner && showAvailability && (
              <div className="lsb-availability-editor">
                <div className="lsb-availability-heading">
                  <span>MA DISPONIBILITÉ</span>
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
                      <X className="lsb-availability-reset" size={11} aria-hidden="true" />
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
