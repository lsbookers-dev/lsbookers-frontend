// agenda/CalendarGrid.tsx — Grille du calendrier et panneau du jour sélectionné

import { Send, X, Clock, MapPin } from 'lucide-react'
import { CalEvent, AvailDay } from './types'
import { DAYS_FR, AVAIL_OPTIONS, isSameDay, formatHour, categoryColor, availBg } from './helpers'

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

  return (
    <>
      {/* Grille calendrier */}
      <div className="p-4">
        <div className="grid grid-cols-7 mb-1">
          {DAYS_FR.map((d, i) => (
            <div key={i} className="text-center text-[11px] text-white/30 font-medium py-1">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-white/30 text-sm">Chargement…</div>
        ) : (
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((date, i) => {
              if (!date) return <div key={i} />
              const { dayEvents, avail } = dayInfo(date)
              const isToday    = isSameDay(date, now)
              const isSelected = selected && isSameDay(date, selected)
              const isPast     = date < now && !isToday

              return (
                <button
                  key={i}
                  onClick={() => setSelected(isSelected ? null : date)}
                  className={`relative flex flex-col items-center py-1.5 rounded-lg transition-all text-sm
                    ${isSelected ? 'bg-purple-600 text-white ring-2 ring-purple-400' : ''}
                    ${!isSelected && isToday ? 'ring-1 ring-purple-500 text-white' : ''}
                    ${!isSelected && !isToday && isPast ? 'text-white/25' : ''}
                    ${!isSelected && !isToday && !isPast ? 'text-white/70 hover:bg-white/8' : ''}
                    ${!isSelected && avail ? availBg(avail.status) : ''}
                  `}
                >
                  <span className="font-medium leading-none">{date.getDate()}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((e, j) => (
                        <span key={j} className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : categoryColor(e.category)}`} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Légende disponibilité */}
        {showAvailability && (
          <div className="flex items-center gap-3 mt-3 text-[10px] text-white/35 flex-wrap">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-green-500/60" />Disponible</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-orange-500/60" />Booking en cours</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-500/60" />Indisponible</span>
          </div>
        )}
      </div>

      {/* Panneau jour sélectionné */}
      {selected && (
        <div className="border-t border-white/8 px-4 pb-4 pt-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/50 font-medium">
              {selected.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white">
              <X size={14} />
            </button>
          </div>

          {/* Propriétaire : gestion des dispos */}
          {isOwner && showAvailability && (
            <div className="mb-3">
              <p className="text-[11px] text-white/40 mb-2">Définir ma disponibilité :</p>
              <div className="flex gap-2 flex-wrap">
                {AVAIL_OPTIONS.map(opt => (
                  <button
                    key={opt.status}
                    onClick={() => saveAvailability(opt.status)}
                    disabled={savingAvail}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition
                      ${selectedAvail?.status === opt.status
                        ? `${opt.color} text-white border-transparent`
                        : `bg-white/5 border-white/10 ${opt.text} hover:bg-white/10`
                      }
                      disabled:opacity-50`}
                  >
                    <span className={`h-2 w-2 rounded-full ${opt.color}`} />
                    {opt.label}
                    {selectedAvail?.status === opt.status && ' ✓'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Badge disponibilité (visiteur) */}
          {!isOwner && selectedAvail && (
            <div className={`mb-3 rounded-xl px-3 py-2 text-xs font-medium ${
              selectedAvail.status === 'AVAILABLE'   ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
              selectedAvail.status === 'UNAVAILABLE' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
              selectedAvail.status === 'TENTATIVE'   ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' :
              'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}>
              {selectedAvail.status === 'AVAILABLE'   ? '🟢 Disponible' :
               selectedAvail.status === 'UNAVAILABLE' ? '🔴 Indisponible ce jour' :
               selectedAvail.status === 'TENTATIVE'   ? '🟠 Booking en cours de confirmation' :
               '🟡 Déjà booké'}
            </div>
          )}

          {/* Organisateur : proposer un booking (tout jour non-bloqué) */}
          {canBook && !bookingSent && (
            <div className="mb-3">
              {!selectedAvail && (
                <p className="text-[11px] text-white/30 mb-2">📅 Aucune disponibilité renseignée — vous pouvez tout de même envoyer une demande.</p>
              )}
              {!showBookingForm ? (
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-medium hover:bg-violet-600/30 transition"
                >
                  📩 Proposer un booking
                </button>
              ) : (
                <div className="space-y-2 bg-white/[0.03] border border-white/10 rounded-xl p-3">
                  <p className="text-[11px] text-white/40 font-medium uppercase tracking-wide">Demande de booking</p>
                  <textarea
                    value={bookingMsg}
                    onChange={e => setBookingMsg(e.target.value)}
                    placeholder="Type d'événement, lieu, horaires, demandes particulières…"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40 resize-none"
                  />
                  <input
                    type="number"
                    value={bookingFee}
                    onChange={e => setBookingFee(e.target.value)}
                    placeholder="Cachet proposé (€) — optionnel"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={sendBookingRequest}
                      disabled={bookingSending}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium disabled:opacity-50 transition"
                    >
                      <Send size={13} />
                      {bookingSending ? 'Envoi…' : 'Envoyer la demande'}
                    </button>
                    <button
                      onClick={() => setShowBookingForm(false)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 text-sm"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confirmation booking envoyé */}
          {bookingSent && (
            <div className="mb-3 bg-green-600/10 border border-green-500/20 rounded-xl px-3 py-2 text-xs text-green-400">
              ✓ Demande de booking envoyée avec succès !
            </div>
          )}

          {/* Événements du jour */}
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-white/25 italic">Aucun événement ce jour</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map(e => (
                <div key={e.id} className="rounded-xl bg-white/5 p-2.5">
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${categoryColor(e.category)}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{e.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {!e.allDay && (
                          <span className="flex items-center gap-1 text-[11px] text-white/40">
                            <Clock className="h-3 w-3" />{formatHour(e.start)}{e.end ? ` – ${formatHour(e.end)}` : ''}
                          </span>
                        )}
                        {e.lieu && (
                          <span className="flex items-center gap-1 text-[11px] text-white/40">
                            <MapPin className="h-3 w-3" />{e.lieu}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => openEventFromCalendar(e.id)}
                      className="mt-2 w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-xs font-medium transition"
                    >
                      Gérer l&apos;événement →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
