'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, Clock } from 'lucide-react'

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
}

interface Props {
  profileId: number
  isOwner?: boolean        // true = on voit aussi les événements privés
  showAvailability?: boolean  // true = afficher les dispos (artiste/prestataire)
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

/* ─────────────────────────────────────────────────────────
   COMPOSANT
───────────────────────────────────────────────────────── */
export default function AgendaCalendar({ profileId, isOwner = false, showAvailability = false }: Props) {
  const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year,  setYear]  = useState(now.getFullYear())
  const [events,       setEvents]       = useState<CalEvent[]>([])
  const [availability, setAvailability] = useState<AvailDay[]>([])
  const [selected, setSelected] = useState<Date | null>(null)
  const [loading,  setLoading]  = useState(true)

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

  /* Construire la grille du mois */
  const firstDay = new Date(year, month - 1, 1)
  const lastDay  = new Date(year, month, 0)
  const startDow = (firstDay.getDay() + 6) % 7  // Lundi = 0
  const totalDays = lastDay.getDate()

  const cells: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => new Date(year, month - 1, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  /* Événements du jour sélectionné */
  const selectedEvents = selected
    ? events.filter(e => isSameDay(new Date(e.start), selected))
    : []

  /* Navigation */
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelected(null)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  /* Infos d'un jour */
  function dayInfo(date: Date) {
    const dayEvents = events.filter(e => isSameDay(new Date(e.start), date))
    const avail     = availability.find(a => isSameDay(new Date(a.date), date))
    return { dayEvents, avail }
  }

  function availBg(status?: string) {
    if (status === 'UNAVAILABLE') return 'bg-red-500/15'
    if (status === 'BOOKED')      return 'bg-amber-500/15'
    if (status === 'TENTATIVE')   return 'bg-yellow-500/15'
    return ''
  }

  /* ── Prochain événement à venir ───────────────────── */
  const upcoming = events
    .filter(e => new Date(e.start) >= now)
    .slice(0, 4)

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
        {/* Jours de la semaine */}
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
                    ${isSelected ? 'bg-purple-600 text-white' : ''}
                    ${!isSelected && isToday ? 'ring-1 ring-purple-500 text-white' : ''}
                    ${!isSelected && !isToday && isPast ? 'text-white/25' : ''}
                    ${!isSelected && !isToday && !isPast ? 'text-white/70 hover:bg-white/8' : ''}
                    ${!isSelected && avail ? availBg(avail.status) : ''}
                  `}
                >
                  <span className="font-medium leading-none">{date.getDate()}</span>
                  {/* Dots événements */}
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

        {/* Légende dispos */}
        {showAvailability && (
          <div className="flex items-center gap-3 mt-3 text-[10px] text-white/35 flex-wrap">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-500/50" />Indisponible</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-amber-500/50" />Booké</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-yellow-500/50" />Tentative</span>
          </div>
        )}
      </div>

      {/* Détail du jour sélectionné */}
      {selected && (
        <div className="border-t border-white/8 px-4 pb-4 pt-3">
          <p className="text-xs text-white/40 mb-2 font-medium">
            {selected.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
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
