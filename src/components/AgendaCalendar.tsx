'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, Clock, Send, X } from 'lucide-react'

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type CalEvent = {
  id: number
  title: string
  start: string
  end?: string | null
  allDay: boolean
  lieu?: string | null
  category?: string | null
  status: string
}

type AvailDay = {
  date: string
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'BOOKED' | 'TENTATIVE'
  note?: string | null
}

interface Props {
  profileId: number
  isOwner?: boolean
  showAvailability?: boolean
  viewerRole?: string | null        // rôle du visiteur connecté
  viewerProfileId?: number | null   // profileId du visiteur (pour envoyer une demande)
}

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS_FR   = ['L','M','M','J','V','S','D']

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

function formatHour(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function categoryColor(cat?: string | null) {
  const map: Record<string, string> = {
    Club: 'bg-purple-500', Mariage: 'bg-pink-400', Corporate: 'bg-blue-400',
    Festival: 'bg-amber-400', Concert: 'bg-green-400', Privé: 'bg-rose-400',
  }
  return cat && map[cat] ? map[cat] : 'bg-purple-400'
}

function availBg(status?: string) {
  if (status === 'AVAILABLE')   return 'bg-green-500/20 ring-1 ring-green-500/30'
  if (status === 'UNAVAILABLE') return 'bg-red-500/20   ring-1 ring-red-500/30'
  if (status === 'TENTATIVE')   return 'bg-orange-500/20 ring-1 ring-orange-500/30'
  if (status === 'BOOKED')      return 'bg-amber-500/20  ring-1 ring-amber-500/30'
  return ''
}

const AVAIL_OPTIONS = [
  { status: 'AVAILABLE',   label: 'Disponible',       color: 'bg-green-500',  ring: 'ring-green-500/50',  text: 'text-green-400'  },
  { status: 'TENTATIVE',   label: 'Booking en cours', color: 'bg-orange-500', ring: 'ring-orange-500/50', text: 'text-orange-400' },
  { status: 'UNAVAILABLE', label: 'Indisponible',     color: 'bg-red-500',    ring: 'ring-red-500/50',    text: 'text-red-400'    },
]

/* ─────────────────────────────────────────────────────────
   COMPOSANT
───────────────────────────────────────────────────────── */
export default function AgendaCalendar({
  profileId,
  isOwner = false,
  showAvailability = false,
  viewerRole = null,
  viewerProfileId = null,
}: Props) {
  const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year,  setYear]  = useState(now.getFullYear())
  const [events,       setEvents]       = useState<CalEvent[]>([])
  const [availability, setAvailability] = useState<AvailDay[]>([])
  const [selected, setSelected] = useState<Date | null>(null)
  const [loading,  setLoading]  = useState(true)

  // UI states
  const [savingAvail, setSavingAvail] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingMsg, setBookingMsg] = useState('')
  const [bookingFee, setBookingFee] = useState('')
  const [bookingSending, setBookingSending] = useState(false)
  const [bookingSent, setBookingSent] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const endpoint = isOwner
        ? `${API}/api/events/my?month=${month}&year=${year}`
        : `${API}/api/events/profile/${profileId}?month=${month}&year=${year}`

      const [evRes, avRes] = await Promise.all([
        fetch(endpoint, { headers }),
        showAvailability
          ? fetch(`${API}/api/events/availability/${profileId}?month=${month}&year=${year}`)
          : Promise.resolve(null),
      ])

      if (evRes.ok) {
        const d = await evRes.json()
        setEvents(d.events || [])
      }
      if (avRes?.ok) {
        const d = await avRes.json()
        setAvailability(d.availability || [])
      }
    } catch { /* silencieux */ }
    finally { setLoading(false) }
  }, [API, profileId, isOwner, showAvailability, month, year])

  useEffect(() => { fetchData() }, [fetchData])

  /* Réinitialiser le formulaire de booking quand on change de jour */
  useEffect(() => {
    setShowBookingForm(false)
    setBookingMsg('')
    setBookingFee('')
    setBookingSent(false)
  }, [selected])

  /* Construire la grille du mois */
  const firstDay  = new Date(year, month - 1, 1)
  const lastDay   = new Date(year, month, 0)
  const startDow  = (firstDay.getDay() + 6) % 7
  const totalDays = lastDay.getDate()

  const cells: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => new Date(year, month - 1, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const selectedEvents = selected
    ? events.filter(e => isSameDay(new Date(e.start), selected))
    : []

  const selectedAvail = selected
    ? availability.find(a => isSameDay(new Date(a.date), selected))
    : undefined

  /* Navigation */
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1)
    setSelected(null)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1)
    setSelected(null)
  }

  function dayInfo(date: Date) {
    const dayEvents = events.filter(e => isSameDay(new Date(e.start), date))
    const avail     = availability.find(a => isSameDay(new Date(a.date), date))
    return { dayEvents, avail }
  }

  /* Sauvegarder une dispo (propriétaire) */
  const saveAvailability = async (status: string) => {
    if (!selected || !isOwner) return
    setSavingAvail(true)
    try {
      const token = localStorage.getItem('token')

      // Normaliser la date à minuit UTC pour éviter les décalages de fuseau
      const d = selected
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T00:00:00.000Z`

      const res = await fetch(`${API}/api/events/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: dateStr, status }),
      })
      if (res.ok) {
        const d2 = await res.json()
        setAvailability(prev => {
          const filtered = prev.filter(a => !isSameDay(new Date(a.date), selected))
          return [...filtered, d2.availability]
        })
      }
    } catch { /* silencieux */ }
    finally { setSavingAvail(false) }
  }

  /* Envoyer une demande de booking (organisateur) */
  const sendBookingRequest = async () => {
    if (!selected || !viewerProfileId) return
    setBookingSending(true)
    try {
      const token = localStorage.getItem('token')
      const d = selected
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T00:00:00.000Z`

      const res = await fetch(`${API}/api/events/booking-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          targetProfileId: profileId,
          date: dateStr,
          message: bookingMsg.trim() || null,
          fee: bookingFee ? parseFloat(bookingFee) : null,
        }),
      })
      if (res.ok) {
        setBookingSent(true)
        setShowBookingForm(false)
        // Marquer la dispo comme TENTATIVE localement
        setAvailability(prev => {
          const filtered = prev.filter(a => !isSameDay(new Date(a.date), selected))
          return [...filtered, { date: dateStr, status: 'TENTATIVE' }]
        })
      }
    } catch { /* silencieux */ }
    finally { setBookingSending(false) }
  }

  const upcoming = events.filter(e => new Date(e.start) >= now).slice(0, 4)
  const canBook  = !isOwner && viewerRole === 'ORGANIZER' && selectedAvail?.status === 'AVAILABLE'

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 overflow-hidden">

      {/* En-tête */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-purple-400" />
          <span className="font-semibold text-sm">Agenda</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/8 transition text-white/50 hover:text-white">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium w-36 text-center">
            {MONTHS_FR[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/8 transition text-white/50 hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grille */}
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

        {/* Légende */}
        {showAvailability && (
          <div className="flex items-center gap-3 mt-3 text-[10px] text-white/35 flex-wrap">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-green-500/60" />Disponible</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-orange-500/60" />Booking en cours</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-500/60" />Indisponible</span>
          </div>
        )}
      </div>

      {/* ─── Panneau jour sélectionné ─── */}
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

          {/* ── PROPRIÉTAIRE : gestion des dispos ── */}
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

          {/* ── ORGANISATEUR sur dispo verte : proposer un booking ── */}
          {canBook && !bookingSent && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <p className="text-xs text-green-400 font-medium">Ce créneau est disponible</p>
              </div>
              {!showBookingForm ? (
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full py-2 rounded-xl bg-green-600/20 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-600/30 transition"
                >
                  Proposer un booking
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={bookingMsg}
                    onChange={e => setBookingMsg(e.target.value)}
                    placeholder="Votre message (type d'événement, lieu, horaires…)"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-green-500/40 resize-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={bookingFee}
                      onChange={e => setBookingFee(e.target.value)}
                      placeholder="Budget proposé (€)"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-green-500/40"
                    />
                    <button
                      onClick={sendBookingRequest}
                      disabled={bookingSending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-sm font-medium disabled:opacity-50 transition"
                    >
                      <Send size={13} />
                      {bookingSending ? 'Envoi…' : 'Envoyer'}
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

          {/* Statut actuel si pas propriétaire */}
          {!isOwner && selectedAvail && selectedAvail.status !== 'AVAILABLE' && (
            <div className={`mb-3 rounded-xl px-3 py-2 text-xs font-medium ${
              selectedAvail.status === 'UNAVAILABLE' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
              selectedAvail.status === 'TENTATIVE'   ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' :
              'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}>
              {selectedAvail.status === 'UNAVAILABLE' ? '🔴 Indisponible ce jour' :
               selectedAvail.status === 'TENTATIVE'   ? '🟠 Booking en cours de confirmation' :
               '🟡 Déjà booké'}
            </div>
          )}

          {/* Événements du jour */}
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-white/25 italic">Aucun événement ce jour</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map(e => (
                <div key={e.id} className="flex items-start gap-2 rounded-xl bg-white/5 p-2.5">
                  <span className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${categoryColor(e.category)}`} />
                  <div className="min-w-0">
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prochains événements */}
      {!selected && upcoming.length > 0 && (
        <div className="border-t border-white/8 px-4 pb-4 pt-3">
          <p className="text-xs text-white/40 mb-2 font-medium uppercase tracking-wide">À venir</p>
          <div className="space-y-2">
            {upcoming.map(e => (
              <div key={e.id} className="flex items-start gap-2">
                <div className="flex-shrink-0 text-center w-9 bg-white/5 rounded-lg py-1">
                  <div className="text-[10px] text-white/40 uppercase">
                    {new Date(e.start).toLocaleDateString('fr-FR', { month: 'short' })}
                  </div>
                  <div className="text-sm font-bold text-white leading-none">
                    {new Date(e.start).getDate()}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{e.title}</p>
                  {e.lieu && <p className="text-[11px] text-white/40 truncate">{e.lieu}</p>}
                </div>
                {e.category && (
                  <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full text-white/80 ${categoryColor(e.category)}`}>
                    {e.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!selected && upcoming.length === 0 && !loading && (
        <div className="border-t border-white/8 px-4 py-4 text-center text-xs text-white/25 italic">
          Aucun événement à venir
        </div>
      )}
    </div>
  )
}
