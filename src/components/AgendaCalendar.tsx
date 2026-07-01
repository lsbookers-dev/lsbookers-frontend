'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, Clock, Send, X, BookOpen, Plus } from 'lucide-react'

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

type BookingItem = {
  id: number
  startDate: string
  fee?: number | null
  status: string
  paymentStatus?: string | null
  message?: string | null
  conversationId?: number | null
  cancellationRequestedBy?: number | null
  requester?: { id: number; avatar?: string | null; user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null } | null } | null
  target?:    { id: number; avatar?: string | null; user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null } | null } | null
}

type EventSummary = {
  id: number
  title: string
  start: string
  end?: string | null
  lieu?: string | null
  category?: string | null
  status: string
  isPrivate: boolean
  budget?: number | null
}

type StaffItem = {
  id: number
  role: string
  fee?: number | null
  status: string
  notes?: string | null
  profile?: { id: number; avatar?: string | null; user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null; role?: string | null } | null } | null
}

type ExpenseItem = {
  id: number
  label: string
  amount?: number | null
  category?: string | null
  paid: boolean
}

type PurchaseItem = {
  id: number
  item: string
  quantity?: number | null
  price?: number | null
  done: boolean
}

type BookingItem2 = {
  id: number
  startDate: string
  fee?: number | null
  status: string
  message?: string | null
  target?: { id: number; avatar?: string | null; user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null; role?: string | null } | null } | null
}

type EventDetail = {
  id: number
  title: string
  description?: string | null
  notes?: string | null
  start: string
  end?: string | null
  allDay: boolean
  lieu?: string | null
  category?: string | null
  isPrivate: boolean
  budget?: number | null
  maxCapacity?: number | null
  status: string
  staff: StaffItem[]
  expenses: ExpenseItem[]
  purchases: PurchaseItem[]
  bookingRequests: BookingItem2[]
}

/* ── Badges ── */
function BkStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: 'En attente',     cls: 'bg-yellow-500/20 text-yellow-300' },
    ACCEPTED:  { label: 'Accepté',        cls: 'bg-green-500/20 text-green-300' },
    DECLINED:  { label: 'Refusé',         cls: 'bg-red-500/20 text-red-300' },
    CANCELLED: { label: 'Annulé',         cls: 'bg-white/10 text-white/40' },
    COMPLETED: { label: 'Terminé',        cls: 'bg-blue-500/20 text-blue-300' },
  }
  const s = map[status] || map.PENDING
  return <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${s.cls}`}>{s.label}</span>
}

function PayBadge({ status }: { status?: string | null }) {
  if (status === 'PAID')    return <span className="text-[10px] text-green-400">💳 Payé</span>
  if (status === 'DEPOSIT') return <span className="text-[10px] text-amber-400">💳 Acompte reçu</span>
  return <span className="text-[10px] text-white/30">💳 Non payé</span>
}

interface Props {
  profileId: number
  isOwner?: boolean
  showAvailability?: boolean
  viewerRole?: string | null        // rôle du visiteur connecté
  viewerProfileId?: number | null   // profileId du visiteur (pour envoyer une demande)
  ownerRole?: string | null         // rôle du propriétaire du profil
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
  ownerRole = null,
}: Props) {
  // ownerRole is available for future use (e.g. restrict event panel to ORGANIZER role)
  void ownerRole
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

  // Panneau "Mes Bookings"
  const [showPanel, setShowPanel] = useState(false)
  const [panelData, setPanelData] = useState<{ received: BookingItem[]; sent: BookingItem[] } | null>(null)
  const [panelLoading, setPanelLoading] = useState(false)
  const [panelTab, setPanelTab] = useState<'pending' | 'upcoming' | 'past' | 'cancelled'>('pending')
  const [cancelingId, setCancelingId] = useState<number | null>(null)
  const [cancelNoteFor, setCancelNoteFor] = useState<number | null>(null)
  const [cancelNoteText, setCancelNoteText] = useState('')
  const [cancelRequestingId, setCancelRequestingId] = useState<number | null>(null)

  // Panel événements
  type EventMode = 'list' | 'create' | 'detail'
  const [showEventPanel, setShowEventPanel] = useState(false)
  const [eventMode, setEventMode] = useState<EventMode>('list')
  const [allEvents, setAllEvents] = useState<EventSummary[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)

  // Création d'événement
  const [createTitle, setCreateTitle] = useState('')
  const [createDate, setCreateDate] = useState('')
  const [createEndDate, setCreateEndDate] = useState('')
  const [createStartTime, setCreateStartTime] = useState('')
  const [createEndTime, setCreateEndTime] = useState('')
  const [createLieu, setCreateLieu] = useState('')
  const [createCategory, setCreateCategory] = useState('')
  const [createBudget, setCreateBudget] = useState('')
  const [creating, setCreating] = useState(false)

  // Détail événement
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null)
  const [eventDetailLoading, setEventDetailLoading] = useState(false)
  const [detailTab, setDetailTab] = useState<'details' | 'staff' | 'notes' | 'purchases' | 'bookings'>('details')

  // Formulaires inline dans le détail
  const [notesText, setNotesText] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [newExpenseLabel, setNewExpenseLabel] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState('')
  const [newExpenseCategory, setNewExpenseCategory] = useState('')
  const [addingExpense, setAddingExpense] = useState(false)
  const [newPurchaseItem, setNewPurchaseItem] = useState('')
  const [newPurchaseQty, setNewPurchaseQty] = useState('')
  const [newPurchasePrice, setNewPurchasePrice] = useState('')
  const [addingPurchase, setAddingPurchase] = useState(false)

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

  const refreshPanel = useCallback(async () => {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/api/events/booking-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setPanelData(await res.json())
  }, [API])

  const openPanel = useCallback(async () => {
    setShowPanel(true)
    if (panelData) return // déjà chargé
    setPanelLoading(true)
    try {
      await refreshPanel()
    } catch {}
    finally { setPanelLoading(false) }
  }, [panelData, refreshPanel])

  const cancelBooking = useCallback(async (id: number) => {
    setCancelingId(id)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/events/booking-request/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (res.ok) await refreshPanel()
    } catch {}
    finally { setCancelingId(null) }
  }, [API, refreshPanel])

  const requestCancellation = useCallback(async (id: number) => {
    setCancelRequestingId(id)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/events/booking-request/${id}/cancel-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note: cancelNoteText.trim() || undefined }),
      })
      if (res.ok) {
        setCancelNoteFor(null)
        setCancelNoteText('')
        await refreshPanel()
      }
    } catch {}
    finally { setCancelRequestingId(null) }
  }, [API, cancelNoteText, refreshPanel])

  const fetchAllEvents = useCallback(async () => {
    setEventsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/events/all`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const d = await res.json(); setAllEvents(d.events || []) }
    } catch {}
    finally { setEventsLoading(false) }
  }, [API])

  const fetchEventDetail = useCallback(async (id: number) => {
    setEventDetailLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/events/${id}/detail`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const d = await res.json()
        setEventDetail(d.event)
        setNotesText(d.event.notes || '')
      }
    } catch {}
    finally { setEventDetailLoading(false) }
  }, [API])

  const openEventPanel = useCallback(() => {
    setShowEventPanel(true)
    setShowPanel(false)
    setEventMode('list')
    setSelectedEventId(null)
    setEventDetail(null)
    fetchAllEvents()
  }, [fetchAllEvents])

  const openEventDetail = useCallback((id: number) => {
    setSelectedEventId(id)
    setEventMode('detail')
    setDetailTab('details')
    fetchEventDetail(id)
  }, [fetchEventDetail])

  const createEvent = useCallback(async () => {
    if (!createTitle.trim() || !createDate) return
    setCreating(true)
    try {
      const token = localStorage.getItem('token')
      const startISO = createStartTime ? `${createDate}T${createStartTime}:00.000Z` : `${createDate}T00:00:00.000Z`
      const endISO = createEndDate && createEndTime ? `${createEndDate}T${createEndTime}:00.000Z` : null
      const res = await fetch(`${API}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: createTitle.trim(),
          start: startISO,
          end: endISO,
          lieu: createLieu.trim() || null,
          category: createCategory || null,
          budget: createBudget ? parseFloat(createBudget) : null,
          isPrivate: true,
          status: 'DRAFT',
        }),
      })
      if (res.ok) {
        const d = await res.json()
        setCreateTitle(''); setCreateDate(''); setCreateEndDate(''); setCreateStartTime(''); setCreateEndTime(''); setCreateLieu(''); setCreateCategory(''); setCreateBudget('')
        await fetchAllEvents()
        openEventDetail(d.event.id)
      }
    } catch {}
    finally { setCreating(false) }
  }, [API, createTitle, createDate, createEndDate, createStartTime, createEndTime, createLieu, createCategory, createBudget, fetchAllEvents, openEventDetail])

  const saveNotes = useCallback(async () => {
    if (!selectedEventId) return
    setNotesSaving(true)
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API}/api/events/${selectedEventId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: notesText }),
      })
    } catch {}
    finally { setNotesSaving(false) }
  }, [API, selectedEventId, notesText])

  const addExpense = useCallback(async () => {
    if (!newExpenseLabel.trim() || !selectedEventId) return
    setAddingExpense(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/events/${selectedEventId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label: newExpenseLabel.trim(), amount: newExpenseAmount || null, category: newExpenseCategory || null }),
      })
      if (res.ok) {
        const d = await res.json()
        setEventDetail(prev => prev ? { ...prev, expenses: [...prev.expenses, d.expense] } : prev)
        setNewExpenseLabel(''); setNewExpenseAmount(''); setNewExpenseCategory('')
      }
    } catch {}
    finally { setAddingExpense(false) }
  }, [API, selectedEventId, newExpenseLabel, newExpenseAmount, newExpenseCategory])

  const toggleExpensePaid = useCallback(async (expenseId: number, paid: boolean) => {
    if (!selectedEventId) return
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API}/api/events/${selectedEventId}/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paid }),
      })
      setEventDetail(prev => prev ? { ...prev, expenses: prev.expenses.map(e => e.id === expenseId ? { ...e, paid } : e) } : prev)
    } catch {}
  }, [API, selectedEventId])

  const deleteExpense = useCallback(async (expenseId: number) => {
    if (!selectedEventId) return
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API}/api/events/${selectedEventId}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setEventDetail(prev => prev ? { ...prev, expenses: prev.expenses.filter(e => e.id !== expenseId) } : prev)
    } catch {}
  }, [API, selectedEventId])

  const addPurchase = useCallback(async () => {
    if (!newPurchaseItem.trim() || !selectedEventId) return
    setAddingPurchase(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/events/${selectedEventId}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ item: newPurchaseItem.trim(), quantity: newPurchaseQty || null, price: newPurchasePrice || null }),
      })
      if (res.ok) {
        const d = await res.json()
        setEventDetail(prev => prev ? { ...prev, purchases: [...prev.purchases, d.purchase] } : prev)
        setNewPurchaseItem(''); setNewPurchaseQty(''); setNewPurchasePrice('')
      }
    } catch {}
    finally { setAddingPurchase(false) }
  }, [API, selectedEventId, newPurchaseItem, newPurchaseQty, newPurchasePrice])

  const togglePurchaseDone = useCallback(async (purchaseId: number, done: boolean) => {
    if (!selectedEventId) return
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API}/api/events/${selectedEventId}/purchases/${purchaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ done }),
      })
      setEventDetail(prev => prev ? { ...prev, purchases: prev.purchases.map(p => p.id === purchaseId ? { ...p, done } : p) } : prev)
    } catch {}
  }, [API, selectedEventId])

  const deletePurchase = useCallback(async (purchaseId: number) => {
    if (!selectedEventId) return
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API}/api/events/${selectedEventId}/purchases/${purchaseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setEventDetail(prev => prev ? { ...prev, purchases: prev.purchases.filter(p => p.id !== purchaseId) } : prev)
    } catch {}
  }, [API, selectedEventId])

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
        {showEventPanel ? (
          <div className="flex items-center gap-2">
            {eventMode === 'detail' && (
              <button
                onClick={() => { setEventMode('list'); setSelectedEventId(null); setEventDetail(null) }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 transition"
              >
                ← Retour
              </button>
            )}
            <button
              onClick={() => { setShowEventPanel(false); setEventMode('list') }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 transition"
            >
              <X className="h-3 w-3" /> Fermer
            </button>
          </div>
        ) : !showPanel ? (
          <div className="flex items-center gap-1">
            {isOwner && (
              <button
                onClick={openEventPanel}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-600/20 border border-green-500/30 text-green-300 text-xs hover:bg-green-600/30 transition mr-1"
              >
                <Plus className="h-3 w-3" /> Événement
              </button>
            )}
            {isOwner && (
              <button
                onClick={openPanel}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs hover:bg-purple-600/30 transition mr-2"
              >
                <BookOpen className="h-3 w-3" />
                Mes bookings
              </button>
            )}
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
        ) : (
          <button
            onClick={() => setShowPanel(false)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 transition"
          >
            <X className="h-3 w-3" />
            Fermer
          </button>
        )}
      </div>

      {/* ─── Panneau "Mes Bookings" ─── */}
      {showPanel && (() => {
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
          { key: 'pending'   as const, label: 'Offres', count: tabItems.pending.length },
          { key: 'upcoming'  as const, label: 'À venir',  count: tabItems.upcoming.length },
          { key: 'past'      as const, label: 'Passés',   count: tabItems.past.length },
          { key: 'cancelled' as const, label: 'Annulés',  count: tabItems.cancelled.length },
        ]

        const fmt = (n: number) => n === 0 ? '—' : `${n.toLocaleString('fr-FR')} €`
        const personName = (b: BookingItem, side: 'requester' | 'target') => {
          const p = b[side]
          return p?.user?.pseudo || [p?.user?.firstName, p?.user?.lastName].filter(Boolean).join(' ') || '?'
        }

        const acceptedReceived = received.filter(b => b.status === 'ACCEPTED')
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
                      const hasCancelRequest = !!b.cancellationRequestedBy
                      const isMyCancel       = hasCancelRequest && b.cancellationRequestedBy === profileId
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

                          {b.status === 'ACCEPTED' && <PayBadge status={b.paymentStatus} />}

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
      })()}

      {/* ─── Panneau "Événements" ─── */}
      {showEventPanel && (() => {
        const statusLabel: Record<string, string> = { DRAFT: 'Brouillon', PUBLISHED: 'Publié', CANCELLED: 'Annulé', COMPLETED: 'Terminé' }
        const statusCls: Record<string, string> = {
          DRAFT: 'bg-white/10 text-white/40', PUBLISHED: 'bg-green-500/20 text-green-300',
          CANCELLED: 'bg-red-500/20 text-red-300', COMPLETED: 'bg-blue-500/20 text-blue-300',
        }
        const CATEGORIES = ['Club', 'Mariage', 'Corporate', 'Festival', 'Concert', 'Privé', 'Autre']
        const EXPENSE_CATEGORIES = ['Technique', 'Catering', 'Décor', 'Communication', 'Personnel', 'Autre']

        // ── LIST MODE ──
        if (eventMode === 'list') {
          return (
            <div className="p-4 max-h-[580px] overflow-y-auto space-y-3">
              {/* Formulaire de création */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-3 space-y-2">
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">Nouvel événement</p>
                <input
                  type="text" value={createTitle} onChange={e => setCreateTitle(e.target.value)}
                  placeholder="Titre de l'événement *"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-green-500/40"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-white/35 mb-1">Date début *</p>
                    <input type="date" value={createDate} onChange={e => setCreateDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:ring-1 focus:ring-green-500/40" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/35 mb-1">Heure début</p>
                    <input type="time" value={createStartTime} onChange={e => setCreateStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:ring-1 focus:ring-green-500/40" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/35 mb-1">Date fin</p>
                    <input type="date" value={createEndDate} onChange={e => setCreateEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:ring-1 focus:ring-green-500/40" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/35 mb-1">Heure fin</p>
                    <input type="time" value={createEndTime} onChange={e => setCreateEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:ring-1 focus:ring-green-500/40" />
                  </div>
                </div>
                <input type="text" value={createLieu} onChange={e => setCreateLieu(e.target.value)}
                  placeholder="Lieu (optionnel)"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-green-500/40" />
                <div className="flex gap-2">
                  <select value={createCategory} onChange={e => setCreateCategory(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:ring-1 focus:ring-green-500/40">
                    <option value="">Catégorie…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="number" value={createBudget} onChange={e => setCreateBudget(e.target.value)}
                    placeholder="Budget (€)"
                    className="w-28 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-green-500/40" />
                </div>
                <button
                  onClick={createEvent}
                  disabled={creating || !createTitle.trim() || !createDate}
                  className="w-full py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium disabled:opacity-40 transition"
                >
                  {creating ? 'Création…' : '+ Créer l\'événement'}
                </button>
              </div>

              {/* Liste des événements existants */}
              {eventsLoading ? (
                <p className="text-center text-white/30 text-sm py-4">Chargement…</p>
              ) : allEvents.length === 0 ? (
                <p className="text-xs text-white/25 italic text-center py-2">Aucun événement créé</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-white/40 uppercase tracking-wide font-medium">Événements existants ({allEvents.length})</p>
                  {allEvents.map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => openEventDetail(ev.id)}
                      className="w-full text-left bg-white/5 rounded-xl p-3 border border-white/8 hover:bg-white/10 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{ev.title}</p>
                          <p className="text-xs text-white/40 mt-0.5">
                            📅 {new Date(ev.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {ev.lieu ? ` · ${ev.lieu}` : ''}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${statusCls[ev.status] || 'bg-white/10 text-white/40'}`}>
                          {statusLabel[ev.status] || ev.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        }

        // ── DETAIL MODE ──
        if (eventMode === 'detail') {
          if (eventDetailLoading || !eventDetail) {
            return <div className="p-8 text-center text-white/30 text-sm">Chargement…</div>
          }

          const DETAIL_TABS = [
            { key: 'details'   as const, label: 'Détails' },
            { key: 'staff'     as const, label: 'Personnel' },
            { key: 'notes'     as const, label: 'Notes & Frais' },
            { key: 'purchases' as const, label: 'Achats' },
            { key: 'bookings'  as const, label: 'Bookings' },
          ]

          const totalExpenses = eventDetail.expenses.reduce((s, e) => s + (e.amount || 0), 0)
          const paidExpenses  = eventDetail.expenses.filter(e => e.paid).reduce((s, e) => s + (e.amount || 0), 0)

          const personName = (p: StaffItem['profile']) => {
            if (!p) return 'Non assigné'
            return p.user?.pseudo || [p.user?.firstName, p.user?.lastName].filter(Boolean).join(' ') || '?'
          }

          const bookingStatusCls: Record<string, string> = {
            PENDING: 'text-yellow-300', ACCEPTED: 'text-green-300', DECLINED: 'text-red-300', CANCELLED: 'text-white/30',
          }

          return (
            <div className="max-h-[600px] overflow-y-auto">
              {/* En-tête événement */}
              <div className="px-4 pt-3 pb-2 border-b border-white/8">
                <p className="text-sm font-semibold text-white truncate">{eventDetail.title}</p>
                <p className="text-xs text-white/40 mt-0.5">
                  📅 {new Date(eventDetail.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {eventDetail.lieu ? ` · ${eventDetail.lieu}` : ''}
                </p>
              </div>

              {/* Onglets */}
              <div className="flex border-b border-white/8 overflow-x-auto">
                {DETAIL_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setDetailTab(tab.key)}
                    className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition ${
                      detailTab === tab.key ? 'border-violet-500 text-violet-300' : 'border-transparent text-white/40 hover:text-white/70'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4 space-y-3">

                {/* ── DÉTAILS ── */}
                {detailTab === 'details' && (
                  <div className="space-y-3">
                    {[
                      { label: 'Titre', value: eventDetail.title },
                      { label: 'Lieu', value: eventDetail.lieu || '—' },
                      { label: 'Catégorie', value: eventDetail.category || '—' },
                      { label: 'Budget', value: eventDetail.budget ? `${Number(eventDetail.budget).toLocaleString('fr-FR')} €` : '—' },
                      { label: 'Statut', value: statusLabel[eventDetail.status] || eventDetail.status },
                      { label: 'Capacité max', value: eventDetail.maxCapacity?.toString() || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-start justify-between gap-4">
                        <span className="text-xs text-white/40 shrink-0">{label}</span>
                        <span className="text-xs text-white text-right">{value}</span>
                      </div>
                    ))}
                    {eventDetail.description && (
                      <div>
                        <p className="text-xs text-white/40 mb-1">Description</p>
                        <p className="text-xs text-white/70">{eventDetail.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── PERSONNEL ── */}
                {detailTab === 'staff' && (
                  <div className="space-y-2">
                    {eventDetail.staff.length === 0 ? (
                      <p className="text-xs text-white/25 italic text-center py-4">Aucun personnel assigné</p>
                    ) : (
                      eventDetail.staff.map(s => (
                        <div key={s.id} className="bg-white/5 rounded-xl p-3 border border-white/8">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-white">{s.role}</p>
                              <p className="text-xs text-white/50 mt-0.5">{personName(s.profile)}</p>
                              {s.fee && <p className="text-xs text-white/40">{Number(s.fee).toLocaleString('fr-FR')} €</p>}
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.status === 'BOOKED' ? 'bg-green-500/20 text-green-300' : s.status === 'NEEDED' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                              {s.status === 'BOOKED' ? 'Confirmé' : s.status === 'NEEDED' ? 'À pourvoir' : 'Annulé'}
                            </span>
                          </div>
                          {s.notes && <p className="text-xs text-white/40 mt-1 italic">{s.notes}</p>}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ── NOTES & FRAIS ── */}
                {detailTab === 'notes' && (
                  <div className="space-y-4">
                    {/* Notes privées */}
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Notes privées</p>
                      <textarea
                        value={notesText}
                        onChange={e => setNotesText(e.target.value)}
                        placeholder="Vos notes pour cet événement…"
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40 resize-none"
                      />
                      <button
                        onClick={saveNotes}
                        disabled={notesSaving}
                        className="mt-1.5 px-4 py-1.5 rounded-lg bg-violet-600/60 hover:bg-violet-600 text-white text-xs font-medium disabled:opacity-40 transition"
                      >
                        {notesSaving ? 'Sauvegarde…' : 'Sauvegarder'}
                      </button>
                    </div>

                    {/* Dépenses */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-white/40 uppercase tracking-wide">Frais</p>
                        <p className="text-xs text-white/50">{paidExpenses.toLocaleString('fr-FR')} € / {totalExpenses.toLocaleString('fr-FR')} € payés</p>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        {eventDetail.expenses.map(e => (
                          <div key={e.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                            <input
                              type="checkbox" checked={e.paid}
                              onChange={ev => toggleExpensePaid(e.id, ev.target.checked)}
                              className="accent-violet-500 w-3.5 h-3.5 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs ${e.paid ? 'line-through text-white/30' : 'text-white'}`}>{e.label}</p>
                              {e.category && <p className="text-[10px] text-white/30">{e.category}</p>}
                            </div>
                            {e.amount != null && (
                              <span className="text-xs text-white/60 shrink-0">{Number(e.amount).toLocaleString('fr-FR')} €</span>
                            )}
                            <button onClick={() => deleteExpense(e.id)} className="text-white/20 hover:text-red-400 transition text-xs shrink-0">✕</button>
                          </div>
                        ))}
                        {eventDetail.expenses.length === 0 && (
                          <p className="text-xs text-white/20 italic">Aucune dépense enregistrée</p>
                        )}
                      </div>
                      {/* Formulaire ajout dépense */}
                      <div className="bg-white/[0.03] rounded-xl border border-white/8 p-3 space-y-2">
                        <input type="text" value={newExpenseLabel} onChange={e => setNewExpenseLabel(e.target.value)}
                          placeholder="Libellé *"
                          className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
                        <div className="flex gap-2">
                          <input type="number" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)}
                            placeholder="Montant (€)"
                            className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
                          <select value={newExpenseCategory} onChange={e => setNewExpenseCategory(e.target.value)}
                            className="flex-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none">
                            <option value="">Catégorie…</option>
                            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <button onClick={addExpense} disabled={addingExpense || !newExpenseLabel.trim()}
                          className="w-full py-1.5 rounded-lg bg-violet-600/60 hover:bg-violet-600 text-white text-xs font-medium disabled:opacity-40 transition">
                          {addingExpense ? 'Ajout…' : '+ Ajouter une dépense'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── ACHATS ── */}
                {detailTab === 'purchases' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      {eventDetail.purchases.map(p => (
                        <div key={p.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                          <input
                            type="checkbox" checked={p.done}
                            onChange={ev => togglePurchaseDone(p.id, ev.target.checked)}
                            className="accent-green-500 w-3.5 h-3.5 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${p.done ? 'line-through text-white/30' : 'text-white'}`}>{p.item}</p>
                            {(p.quantity || p.price) && (
                              <p className="text-[10px] text-white/30">
                                {p.quantity ? `x${p.quantity}` : ''}{p.quantity && p.price ? ' · ' : ''}{p.price ? `${Number(p.price).toLocaleString('fr-FR')} €` : ''}
                              </p>
                            )}
                          </div>
                          <button onClick={() => deletePurchase(p.id)} className="text-white/20 hover:text-red-400 transition text-xs shrink-0">✕</button>
                        </div>
                      ))}
                      {eventDetail.purchases.length === 0 && (
                        <p className="text-xs text-white/20 italic">Liste vide</p>
                      )}
                    </div>
                    {/* Formulaire ajout achat */}
                    <div className="bg-white/[0.03] rounded-xl border border-white/8 p-3 space-y-2">
                      <input type="text" value={newPurchaseItem} onChange={e => setNewPurchaseItem(e.target.value)}
                        placeholder="Article *"
                        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
                      <div className="flex gap-2">
                        <input type="number" value={newPurchaseQty} onChange={e => setNewPurchaseQty(e.target.value)}
                          placeholder="Qté" className="w-20 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
                        <input type="number" value={newPurchasePrice} onChange={e => setNewPurchasePrice(e.target.value)}
                          placeholder="Prix unitaire (€)" className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
                      </div>
                      <button onClick={addPurchase} disabled={addingPurchase || !newPurchaseItem.trim()}
                        className="w-full py-1.5 rounded-lg bg-green-600/60 hover:bg-green-600 text-white text-xs font-medium disabled:opacity-40 transition">
                        {addingPurchase ? 'Ajout…' : '+ Ajouter un article'}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── BOOKINGS ── */}
                {detailTab === 'bookings' && (
                  <div className="space-y-2">
                    {eventDetail.bookingRequests.length === 0 ? (
                      <p className="text-xs text-white/25 italic text-center py-4">Aucune demande de booking liée à cet événement</p>
                    ) : (
                      eventDetail.bookingRequests.map(b => {
                        const name = b.target?.user?.pseudo || [b.target?.user?.firstName, b.target?.user?.lastName].filter(Boolean).join(' ') || '?'
                        return (
                          <div key={b.id} className="bg-white/5 rounded-xl p-3 border border-white/8">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-white">{name}</p>
                                <p className="text-xs text-white/40 mt-0.5">
                                  📅 {new Date(b.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  {b.fee ? ` · ${Number(b.fee).toLocaleString('fr-FR')} €` : ''}
                                </p>
                              </div>
                              <span className={`text-xs font-medium ${bookingStatusCls[b.status] || 'text-white/40'}`}>{b.status}</span>
                            </div>
                            {b.message && <p className="text-xs text-white/40 mt-1 italic">&ldquo;{b.message}&rdquo;</p>}
                          </div>
                        )
                      })
                    )}
                    <p className="text-[10px] text-white/25 text-center mt-2">
                      Pour envoyer une offre, utilisez le profil de l&apos;artiste ou prestataire.
                    </p>
                  </div>
                )}

              </div>
            </div>
          )
        }

        return null
      })()}

      {/* Grille + sections calendrier (masquées quand le panneau bookings est ouvert) */}
      {!showPanel && !showEventPanel && (<><div className="p-4">
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
      </>)}
    </div>
  )
}
