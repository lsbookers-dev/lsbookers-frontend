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

type DocumentItem = {
  id: number
  name: string
  url: string
  fileType: string
  createdAt: string
}

type LinkedBooking = {
  id: number
  startDate: string
  fee?: number | null
  paymentStatus?: string | null
  status: string
  requester?: { id: number; avatar?: string | null; user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null } | null } | null
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
  documents: DocumentItem[]
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
  if (status === 'PAID')    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">💳 Booking payé</span>
  if (status === 'DEPOSIT') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">💳 Acompte payé</span>
  if (status === 'DIRECT')  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">💵 Paiement en direct</span>
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/30">⏳ Non payé</span>
}

/* ── DocumentsSection — helper composant pour onglets Contrat / Transports (artiste) ── */
function DocumentsSection({
  docs, docType, label, uploadingDoc, docError, addDocument, deleteDocument
}: {
  docs: DocumentItem[]
  docType: string
  label: string
  uploadingDoc: boolean
  docError: string
  addDocument: (file: File, type: string) => void
  deleteDocument: (id: number) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40 uppercase tracking-wide">{label}</p>
      <div className="space-y-1.5">
        {docs.map(d => (
          <div key={d.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
            <a href={d.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0">
              <p className="text-xs text-violet-300 hover:text-violet-200 truncate">📎 {d.name}</p>
            </a>
            <button onClick={() => deleteDocument(d.id)} className="text-white/20 hover:text-red-400 transition text-xs shrink-0">✕</button>
          </div>
        ))}
        {docs.length === 0 && <p className="text-xs text-white/20 italic">Aucun document</p>}
      </div>
      <label className={`w-full py-2 rounded-xl text-xs font-medium text-center cursor-pointer transition block border ${
        uploadingDoc ? 'bg-white/5 border-white/10 text-white/30' : 'bg-violet-600/20 border-violet-500/30 text-violet-300 hover:bg-violet-600/30'
      }`}>
        {uploadingDoc ? 'Upload en cours…' : `📎 Ajouter ${label.toLowerCase()}`}
        <input type="file" className="hidden" disabled={uploadingDoc}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) addDocument(f, docType)
            e.target.value = ''
          }} />
      </label>
      {docError && <p className="text-xs text-red-400">{docError}</p>}
    </div>
  )
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
  const [eventsError, setEventsError] = useState(false)

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
  const [createError, setCreateError] = useState('')
  const [lastCreatedId, setLastCreatedId] = useState<number | null>(null)
  const [deletingEvent, setDeletingEvent] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Détail événement
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null)
  const [eventDetailLoading, setEventDetailLoading] = useState(false)
  const [eventDetailError, setEventDetailError] = useState(false)
  const [detailTab, setDetailTab] = useState<'details' | 'staff' | 'notes' | 'purchases' | 'bookings'>('details')

  // Formulaires inline dans le détail
  const [notesText, setNotesText] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [newExpenseLabel, setNewExpenseLabel] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState('')
  const [newExpenseCategory, setNewExpenseCategory] = useState('')
  const [addingExpense, setAddingExpense] = useState(false)
  const [expenseError, setExpenseError] = useState('')
  const [newPurchaseItem, setNewPurchaseItem] = useState('')
  const [newPurchaseQty, setNewPurchaseQty] = useState('')
  const [newPurchasePrice, setNewPurchasePrice] = useState('')
  const [addingPurchase, setAddingPurchase] = useState(false)

  // Édition des détails
  const [editMode, setEditMode] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editLieu, setEditLieu] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editBudget, setEditBudget] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editCapacity, setEditCapacity] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editStartTime, setEditStartTime] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // Personnel
  const [newStaffRole, setNewStaffRole] = useState('')
  const [newStaffFee, setNewStaffFee] = useState('')
  const [newStaffNotes, setNewStaffNotes] = useState('')
  const [addingStaff, setAddingStaff] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [deletingStaffId, setDeletingStaffId] = useState<number | null>(null)
  const [staffSearchQ, setStaffSearchQ] = useState('')
  const [staffSearchResults, setStaffSearchResults] = useState<{id:number;avatar?:string|null;user?:{pseudo?:string|null;firstName?:string|null;lastName?:string|null;role?:string|null}}[]>([])
  const [staffSearchLoading, setStaffSearchLoading] = useState(false)
  const [staffAddMode, setStaffAddMode] = useState<'manual' | 'pseudo'>('manual')

  // Documents
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [docError, setDocError] = useState('')
  const [docFilter, setDocFilter] = useState<'ALL'|'CONTRACT'|'TRANSPORT'|'HOTEL'|'OTHER'>('ALL')

  // Booking qui a engendré cet événement (vue artiste/prestataire)
  const [linkedBooking, setLinkedBooking] = useState<LinkedBooking | null>(null)

  // Mise à jour statut paiement
  const [updatingPayment, setUpdatingPayment] = useState<number | null>(null)

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
    setEventsError(false)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/events/all`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const d = await res.json(); setAllEvents(d.events || []) }
      else setEventsError(true)
    } catch {
      setEventsError(true)
    }
    finally { setEventsLoading(false) }
  }, [API])

  const fetchEventDetail = useCallback(async (id: number) => {
    setEventDetailLoading(true)
    setEventDetailError(false)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/events/${id}/detail`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const d = await res.json()
        setEventDetail(d.event)
        setLinkedBooking(d.linkedBooking || null)
        setNotesText(d.event.notes || '')
        // Initialiser les champs d'édition
        const ev = d.event
        setEditTitle(ev.title || '')
        setEditLieu(ev.lieu || '')
        setEditCategory(ev.category || '')
        setEditBudget(ev.budget != null ? String(ev.budget) : '')
        setEditStatus(ev.status || 'DRAFT')
        setEditCapacity(ev.maxCapacity != null ? String(ev.maxCapacity) : '')
        setEditDescription(ev.description || '')
        const startDate = new Date(ev.start)
        setEditStart(`${startDate.getFullYear()}-${String(startDate.getMonth()+1).padStart(2,'0')}-${String(startDate.getDate()).padStart(2,'0')}`)
        setEditStartTime(`${String(startDate.getHours()).padStart(2,'0')}:${String(startDate.getMinutes()).padStart(2,'0')}`)
        if (ev.end) {
          const endDate = new Date(ev.end)
          setEditEnd(`${endDate.getFullYear()}-${String(endDate.getMonth()+1).padStart(2,'0')}-${String(endDate.getDate()).padStart(2,'0')}`)
          setEditEndTime(`${String(endDate.getHours()).padStart(2,'0')}:${String(endDate.getMinutes()).padStart(2,'0')}`)
        } else { setEditEnd(''); setEditEndTime('') }
      } else {
        setEventDetailError(true)
      }
    } catch {
      setEventDetailError(true)
    }
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
    setEventDetail(null)
    setEventDetailError(false)
    setLinkedBooking(null)
    setEditMode(false)
    setEditError('')
    setStaffError('')
    setExpenseError('')
    setDocError('')
    fetchEventDetail(id)
  }, [fetchEventDetail])

  const createEvent = useCallback(async () => {
    if (!createTitle.trim() || !createDate) return
    setCreating(true)
    setCreateError('')
    try {
      const token = localStorage.getItem('token')
      // Construire la date en heure locale pour éviter le décalage UTC
      const startISO = createStartTime
        ? `${createDate}T${createStartTime}:00`
        : `${createDate}T12:00:00`
      const endISO = createEndDate
        ? (createEndTime ? `${createEndDate}T${createEndTime}:00` : `${createEndDate}T23:59:00`)
        : null
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
        setCreateTitle(''); setCreateDate(''); setCreateEndDate(''); setCreateStartTime('')
        setCreateEndTime(''); setCreateLieu(''); setCreateCategory(''); setCreateBudget('')
        setLastCreatedId(d.event.id)
        await fetchAllEvents()
        fetchData() // rafraîchir le calendrier
      } else {
        const err = await res.json().catch(() => ({}))
        setCreateError(err.error || 'Erreur lors de la création')
      }
    } catch {
      setCreateError('Impossible de joindre le serveur')
    }
    finally { setCreating(false) }
  }, [API, createTitle, createDate, createEndDate, createStartTime, createEndTime, createLieu, createCategory, createBudget, fetchAllEvents, fetchData])

  const deleteEvent = useCallback(async () => {
    if (!selectedEventId) return
    setDeletingEvent(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/events/${selectedEventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setShowEventPanel(false)
        setEventMode('list')
        setSelectedEventId(null)
        setEventDetail(null)
        setConfirmDelete(false)
        await fetchAllEvents()
        fetchData()
      }
    } catch {}
    finally { setDeletingEvent(false) }
  }, [API, selectedEventId, fetchAllEvents, fetchData])

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
    setExpenseError('')
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
      } else {
        const err = await res.json().catch(() => ({}))
        setExpenseError(err.error || `Erreur ${res.status}`)
      }
    } catch (err) {
      console.error('addExpense:', err)
      setExpenseError('Erreur réseau')
    }
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

  const saveEventDetails = useCallback(async () => {
    if (!selectedEventId || !editTitle.trim()) return
    setEditSaving(true)
    setEditError('')
    try {
      const token = localStorage.getItem('token')
      const startISO = editStartTime ? `${editStart}T${editStartTime}:00` : `${editStart}T12:00:00`
      const endISO = editEnd ? (editEndTime ? `${editEnd}T${editEndTime}:00` : `${editEnd}T23:59:00`) : null
      const res = await fetch(`${API}/api/events/${selectedEventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: editTitle.trim(),
          lieu: editLieu.trim() || null,
          category: editCategory || null,
          budget: editBudget ? parseFloat(editBudget) : null,
          status: editStatus,
          maxCapacity: editCapacity ? parseInt(editCapacity) : null,
          description: editDescription.trim() || null,
          start: startISO,
          end: endISO,
        }),
      })
      if (res.ok) {
        const d = await res.json()
        setEventDetail(prev => prev ? { ...prev, ...d.event } : prev)
        setEditMode(false)
        await fetchAllEvents()
        fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        setEditError(err.error || 'Erreur lors de la sauvegarde')
      }
    } catch {
      setEditError('Erreur réseau')
    }
    finally { setEditSaving(false) }
  }, [API, selectedEventId, editTitle, editLieu, editCategory, editBudget, editStatus, editCapacity, editDescription, editStart, editStartTime, editEnd, editEndTime, fetchAllEvents, fetchData])

  const addStaff = useCallback(async (staffProfileId?: number) => {
    if (!newStaffRole.trim() || !selectedEventId) return
    setAddingStaff(true)
    setStaffError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/events/${selectedEventId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          role: newStaffRole.trim(),
          fee: newStaffFee ? parseFloat(newStaffFee) : null,
          notes: newStaffNotes.trim() || null,
          profileId: staffProfileId || null,
        }),
      })
      if (res.ok) {
        const d = await res.json()
        setEventDetail(prev => prev ? { ...prev, staff: [...prev.staff, d.staff] } : prev)
        setNewStaffRole(''); setNewStaffFee(''); setNewStaffNotes('')
        setStaffSearchQ(''); setStaffSearchResults([])
      } else {
        const err = await res.json().catch(() => ({}))
        setStaffError(err.error || 'Erreur')
      }
    } catch {
      setStaffError('Erreur réseau')
    }
    finally { setAddingStaff(false) }
  }, [API, selectedEventId, newStaffRole, newStaffFee, newStaffNotes])

  const deleteStaff = useCallback(async (staffId: number) => {
    if (!selectedEventId) return
    setDeletingStaffId(staffId)
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API}/api/events/${selectedEventId}/staff/${staffId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setEventDetail(prev => prev ? { ...prev, staff: prev.staff.filter(s => s.id !== staffId) } : prev)
    } catch {}
    finally { setDeletingStaffId(null) }
  }, [API, selectedEventId])

  const searchStaff = useCallback(async (q: string) => {
    setStaffSearchQ(q)
    if (!q.trim() || q.trim().length < 2) { setStaffSearchResults([]); return }
    setStaffSearchLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/search?q=${encodeURIComponent(q.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const d = await res.json()
        setStaffSearchResults((d.results || d.profiles || []).slice(0, 5))
      }
    } catch {}
    finally { setStaffSearchLoading(false) }
  }, [API])

  const addDocument = useCallback(async (file: File, docType: string) => {
    if (!selectedEventId) return
    setUploadingDoc(true)
    setDocError('')
    try {
      const token = localStorage.getItem('token')
      // Upload vers Cloudinary via l'API
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!uploadRes.ok) { setDocError("Erreur d'upload"); return }
      const uploadData = await uploadRes.json()
      const url = uploadData.url || uploadData.secure_url
      if (!url) { setDocError("URL manquante après upload"); return }

      // Sauvegarder en base
      const res = await fetch(`${API}/api/events/${selectedEventId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: file.name, url, fileType: docType }),
      })
      if (res.ok) {
        const d = await res.json()
        setEventDetail(prev => prev ? { ...prev, documents: [...(prev.documents || []), d.document] } : prev)
      } else {
        const err = await res.json().catch(() => ({}))
        setDocError(err.error || 'Erreur lors de la sauvegarde')
      }
    } catch {
      setDocError('Erreur réseau')
    }
    finally { setUploadingDoc(false) }
  }, [API, selectedEventId])

  const deleteDocument = useCallback(async (docId: number) => {
    if (!selectedEventId) return
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API}/api/events/${selectedEventId}/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setEventDetail(prev => prev ? { ...prev, documents: prev.documents.filter(d => d.id !== docId) } : prev)
    } catch {}
  }, [API, selectedEventId])

  const updatePaymentStatus = useCallback(async (bookingId: number, paymentStatus: string) => {
    setUpdatingPayment(bookingId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/events/booking-request/${bookingId}/payment-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentStatus }),
      })
      if (res.ok) {
        // Rafraîchir les données du panneau bookings
        await refreshPanel()
      }
    } catch {}
    finally { setUpdatingPayment(null) }
  }, [API, refreshPanel])

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

                          {b.status === 'ACCEPTED' && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <PayBadge status={b.paymentStatus} />
                              {/* Boutons de changement de statut paiement — organisateur seulement */}
                              {b.direction === 'sent' && (
                                <div className="flex gap-1 flex-wrap">
                                  {[
                                    { key: 'UNPAID',  label: 'Non payé',      cls: 'bg-white/5 text-white/40' },
                                    { key: 'DEPOSIT', label: 'Acompte',        cls: 'bg-amber-600/20 text-amber-300' },
                                    { key: 'PAID',    label: 'Payé',           cls: 'bg-green-600/20 text-green-300' },
                                    { key: 'DIRECT',  label: 'En direct',      cls: 'bg-blue-600/20 text-blue-300' },
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
                {createError && (
                  <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{createError}</p>
                )}
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
              ) : eventsError ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-red-400/70">Impossible de charger les événements.</p>
                  <button onClick={fetchAllEvents} className="text-xs text-white/50 underline">Réessayer</button>
                </div>
              ) : allEvents.length === 0 ? (
                <p className="text-xs text-white/25 italic text-center py-2">Aucun événement créé</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-white/40 uppercase tracking-wide font-medium">Événements existants ({allEvents.length})</p>
                  {allEvents.map(ev => (
                    <div
                      key={ev.id}
                      className={`rounded-xl border overflow-hidden ${
                        ev.id === lastCreatedId
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
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
                        <button
                          onClick={() => openEventDetail(ev.id)}
                          className="w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs font-medium transition flex items-center justify-center gap-1"
                        >
                          Gérer l&apos;événement →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        }

        // ── DETAIL MODE ──
        if (eventMode === 'detail') {
          if (eventDetailLoading) {
            return <div className="p-8 text-center text-white/30 text-sm">Chargement…</div>
          }
          if (eventDetailError || !eventDetail) {
            return (
              <div className="p-8 text-center space-y-3">
                <p className="text-red-400/80 text-sm">Impossible de charger l&apos;événement.</p>
                <button
                  onClick={() => selectedEventId && fetchEventDetail(selectedEventId)}
                  className="text-xs bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white/70"
                >
                  Réessayer
                </button>
              </div>
            )
          }

          // Détecter si c'est un événement "booké" (artiste/prestataire) ou un événement "organisateur"
          const isBookedEvent = !!linkedBooking

          const ORGANIZER_TABS = [
            { key: 'details'   as const, label: 'Détail' },
            { key: 'staff'     as const, label: 'Personnel' },
            { key: 'notes'     as const, label: 'Notes & Frais' },
            { key: 'purchases' as const, label: 'Achats' },
            { key: 'bookings'  as const, label: 'Bookings' },
          ]
          const BOOKED_TABS = [
            { key: 'details'   as const, label: 'Détails' },
            { key: 'staff'     as const, label: 'Matériel' },
            { key: 'notes'     as const, label: 'Contrat' },
            { key: 'purchases' as const, label: 'Transports' },
            { key: 'bookings'  as const, label: 'Paiement' },
          ]
          const DETAIL_TABS = isBookedEvent ? BOOKED_TABS : ORGANIZER_TABS

          const totalExpenses = eventDetail.expenses.reduce((s, e) => s + (e.amount || 0), 0)
          const paidExpenses  = eventDetail.expenses.filter(e => e.paid).reduce((s, e) => s + (e.amount || 0), 0)
          const totalStaffFee = eventDetail.staff.reduce((s, st) => s + (st.fee || 0), 0)

          const personName = (p: StaffItem['profile']) => {
            if (!p) return 'Non assigné'
            return p.user?.pseudo || [p.user?.firstName, p.user?.lastName].filter(Boolean).join(' ') || '?'
          }

          const bookingStatusCls: Record<string, string> = {
            PENDING: 'text-yellow-300', ACCEPTED: 'text-green-300', DECLINED: 'text-red-300', CANCELLED: 'text-white/30',
          }

          // Documents filtrés
          const allDocs = eventDetail.documents || []
          const filteredDocs = docFilter === 'ALL' ? allDocs : allDocs.filter(d => d.fileType === docFilter)

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
                    {/* Vue artiste bookée — lecture seule */}
                    {isBookedEvent ? (
                      <>
                        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 space-y-1.5">
                          <p className="text-[10px] text-violet-300 font-medium uppercase tracking-wide">Organisateur</p>
                          <p className="text-sm font-medium text-white">
                            {linkedBooking?.requester?.user?.pseudo || [linkedBooking?.requester?.user?.firstName, linkedBooking?.requester?.user?.lastName].filter(Boolean).join(' ') || '?'}
                          </p>
                        </div>
                        {[
                          { label: 'Titre', value: eventDetail.title },
                          { label: 'Date', value: new Date(eventDetail.start).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                          { label: 'Lieu', value: eventDetail.lieu || '—' },
                          { label: 'Catégorie', value: eventDetail.category || '—' },
                          { label: 'Cachet', value: linkedBooking?.fee ? `${Number(linkedBooking.fee).toLocaleString('fr-FR')} €` : '—' },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-start justify-between gap-4">
                            <span className="text-xs text-white/40 shrink-0">{label}</span>
                            <span className="text-xs text-white text-right">{value}</span>
                          </div>
                        ))}
                      </>
                    ) : editMode ? (
                      /* Mode édition — organisateur */
                      <div className="space-y-2">
                        <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                          placeholder="Titre *"
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40" />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] text-white/35 mb-1">Date début *</p>
                            <input type="date" value={editStart} onChange={e => setEditStart(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none" />
                          </div>
                          <div>
                            <p className="text-[10px] text-white/35 mb-1">Heure début</p>
                            <input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none" />
                          </div>
                          <div>
                            <p className="text-[10px] text-white/35 mb-1">Date fin</p>
                            <input type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none" />
                          </div>
                          <div>
                            <p className="text-[10px] text-white/35 mb-1">Heure fin</p>
                            <input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none" />
                          </div>
                        </div>
                        <input type="text" value={editLieu} onChange={e => setEditLieu(e.target.value)}
                          placeholder="Lieu"
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40" />
                        <div className="grid grid-cols-2 gap-2">
                          <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none">
                            <option value="">Catégorie…</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none">
                            <option value="DRAFT">Brouillon</option>
                            <option value="PUBLISHED">Publié</option>
                            <option value="COMPLETED">Terminé</option>
                            <option value="CANCELLED">Annulé</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="number" value={editBudget} onChange={e => setEditBudget(e.target.value)}
                            placeholder="Budget (€)"
                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 outline-none" />
                          <input type="number" value={editCapacity} onChange={e => setEditCapacity(e.target.value)}
                            placeholder="Capacité max"
                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 outline-none" />
                        </div>
                        <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)}
                          placeholder="Description…" rows={3}
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40 resize-none" />
                        {editError && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{editError}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => { setEditMode(false); setEditError('') }}
                            className="flex-1 py-2 rounded-xl bg-white/10 text-white/60 text-xs hover:bg-white/15 transition">
                            Annuler
                          </button>
                          <button onClick={saveEventDetails} disabled={editSaving || !editTitle.trim() || !editStart}
                            className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 disabled:opacity-40 transition">
                            {editSaving ? 'Sauvegarde…' : 'Sauvegarder'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Mode lecture — organisateur */
                      <>
                        {[
                          { label: 'Titre', value: eventDetail.title },
                          { label: 'Date', value: new Date(eventDetail.start).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + (eventDetail.end ? ` → ${new Date(eventDetail.end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : '') },
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
                        <button onClick={() => setEditMode(true)}
                          className="w-full py-2 rounded-xl border border-white/15 text-white/60 text-xs hover:bg-white/8 transition mt-1">
                          ✏️ Modifier les informations
                        </button>
                      </>
                    )}

                    {/* Zone suppression — organisateur seulement */}
                    {!isBookedEvent && (
                      <div className="pt-3 border-t border-white/8 mt-3">
                        {!confirmDelete ? (
                          <button
                            onClick={() => setConfirmDelete(true)}
                            className="w-full py-2 rounded-xl border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition"
                          >
                            🗑 Supprimer l&apos;événement
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-red-400 text-center">Supprimer définitivement ?</p>
                            <div className="flex gap-2">
                              <button onClick={() => setConfirmDelete(false)}
                                className="flex-1 py-2 rounded-xl bg-white/10 text-white/60 text-xs hover:bg-white/15 transition">
                                Annuler
                              </button>
                              <button onClick={deleteEvent} disabled={deletingEvent}
                                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-500 disabled:opacity-50 transition">
                                {deletingEvent ? 'Suppression…' : 'Confirmer'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── PERSONNEL (organisateur) / MATÉRIEL (artiste) ── */}
                {detailTab === 'staff' && (
                  <div className="space-y-3">
                    {isBookedEvent ? (
                      /* Artiste — notes matériel/technique */
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Notes matériel / technique</p>
                        <textarea
                          value={notesText}
                          onChange={e => setNotesText(e.target.value)}
                          placeholder="Rider technique, matériel nécessaire, demandes spéciales…"
                          rows={5}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40 resize-none"
                        />
                        <button onClick={saveNotes} disabled={notesSaving}
                          className="mt-1.5 px-4 py-1.5 rounded-lg bg-violet-600/60 hover:bg-violet-600 text-white text-xs font-medium disabled:opacity-40 transition">
                          {notesSaving ? 'Sauvegarde…' : 'Sauvegarder'}
                        </button>
                      </div>
                    ) : (
                      /* Organisateur — liste du personnel + formulaire d'ajout */
                      <>
                        {/* Liste */}
                        {eventDetail.staff.length === 0 ? (
                          <p className="text-xs text-white/25 italic text-center py-2">Aucun personnel assigné</p>
                        ) : (
                          <div className="space-y-2">
                            {eventDetail.staff.map(s => (
                              <div key={s.id} className="bg-white/5 rounded-xl p-3 border border-white/8">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-medium text-white">{s.role}</p>
                                    <p className="text-xs text-white/50 mt-0.5">{personName(s.profile)}</p>
                                    {s.fee && <p className="text-xs text-white/40">{Number(s.fee).toLocaleString('fr-FR')} €</p>}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.status === 'BOOKED' ? 'bg-green-500/20 text-green-300' : s.status === 'NEEDED' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                                      {s.status === 'BOOKED' ? 'Confirmé' : s.status === 'NEEDED' ? 'À pourvoir' : 'Annulé'}
                                    </span>
                                    <button onClick={() => deleteStaff(s.id)} disabled={deletingStaffId === s.id}
                                      className="text-white/20 hover:text-red-400 transition text-xs disabled:opacity-40">✕</button>
                                  </div>
                                </div>
                                {s.notes && <p className="text-xs text-white/40 mt-1 italic">{s.notes}</p>}
                              </div>
                            ))}
                            {/* Total salaires */}
                            {totalStaffFee > 0 && (
                              <div className="flex items-center justify-between px-3 py-2 bg-white/[0.03] rounded-xl border border-white/8">
                                <span className="text-xs text-white/40">Total salaires</span>
                                <span className="text-xs font-semibold text-white">{totalStaffFee.toLocaleString('fr-FR')} €</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Formulaire d'ajout */}
                        <div className="bg-white/[0.03] rounded-xl border border-white/8 p-3 space-y-2">
                          <div className="flex gap-1 mb-2">
                            <button onClick={() => setStaffAddMode('manual')}
                              className={`flex-1 py-1 rounded-lg text-xs font-medium transition ${staffAddMode === 'manual' ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                              Manuel
                            </button>
                            <button onClick={() => setStaffAddMode('pseudo')}
                              className={`flex-1 py-1 rounded-lg text-xs font-medium transition ${staffAddMode === 'pseudo' ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                              @Pseudo
                            </button>
                          </div>

                          <input type="text" value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)}
                            placeholder="Rôle / Poste *" className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
                          <div className="flex gap-2">
                            <input type="number" value={newStaffFee} onChange={e => setNewStaffFee(e.target.value)}
                              placeholder="Salaire (€)" className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
                            <input type="text" value={newStaffNotes} onChange={e => setNewStaffNotes(e.target.value)}
                              placeholder="Notes" className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
                          </div>

                          {staffAddMode === 'pseudo' && (
                            <div className="relative">
                              <input type="text" value={staffSearchQ} onChange={e => searchStaff(e.target.value)}
                                placeholder="Rechercher par @pseudo…"
                                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
                              {staffSearchLoading && <p className="text-[10px] text-white/30 mt-1">Recherche…</p>}
                              {staffSearchResults.length > 0 && (
                                <div className="mt-1 bg-neutral-800 border border-white/10 rounded-xl overflow-hidden">
                                  {staffSearchResults.map((r: {id:number;avatar?:string|null;user?:{pseudo?:string|null;firstName?:string|null;lastName?:string|null;role?:string|null}}) => (
                                    <button key={r.id} type="button"
                                      onClick={() => { addStaff(r.id); setStaffSearchResults([]) }}
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition text-left">
                                      {r.avatar && <img src={r.avatar} className="h-6 w-6 rounded-full object-cover shrink-0" alt="" />}
                                      <div>
                                        <p className="text-xs text-white">{r.user?.pseudo || [r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ')}</p>
                                        <p className="text-[10px] text-white/30">{r.user?.role}</p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {staffError && <p className="text-xs text-red-400">{staffError}</p>}

                          {staffAddMode === 'manual' && (
                            <button onClick={() => addStaff()} disabled={addingStaff || !newStaffRole.trim()}
                              className="w-full py-1.5 rounded-lg bg-violet-600/60 hover:bg-violet-600 text-white text-xs font-medium disabled:opacity-40 transition">
                              {addingStaff ? 'Ajout…' : '+ Ajouter'}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── NOTES & FRAIS (organisateur) / CONTRAT (artiste) ── */}
                {detailTab === 'notes' && (
                  isBookedEvent ? (
                    /* Artiste — onglet Contrat */
                    <DocumentsSection
                      docs={allDocs.filter(d => d.fileType === 'CONTRACT')}
                      docType="CONTRACT"
                      label="Contrat"
                      uploadingDoc={uploadingDoc}
                      docError={docError}
                      addDocument={addDocument}
                      deleteDocument={deleteDocument}
                    />
                  ) : (
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
                          {expenseError && <p className="text-xs text-red-400">{expenseError}</p>}
                          <button onClick={addExpense} disabled={addingExpense || !newExpenseLabel.trim()}
                            className="w-full py-1.5 rounded-lg bg-violet-600/60 hover:bg-violet-600 text-white text-xs font-medium disabled:opacity-40 transition">
                            {addingExpense ? 'Ajout…' : '+ Ajouter une dépense'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {/* ── ACHATS (organisateur) / TRANSPORTS & LOGEMENTS (artiste) ── */}
                {detailTab === 'purchases' && (
                  isBookedEvent ? (
                    <DocumentsSection
                      docs={allDocs.filter(d => d.fileType === 'TRANSPORT' || d.fileType === 'HOTEL')}
                      docType="TRANSPORT"
                      label="Transport / Logement"
                      uploadingDoc={uploadingDoc}
                      docError={docError}
                      addDocument={addDocument}
                      deleteDocument={deleteDocument}
                    />
                  ) : (
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
                  )
                )}

                {/* ── BOOKINGS (organisateur) / PAIEMENT (artiste) ── */}
                {detailTab === 'bookings' && (
                  isBookedEvent ? (
                    /* Artiste — vue paiement */
                    <div className="space-y-4">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/8 space-y-3">
                        <p className="text-xs text-white/40 uppercase tracking-wide">Informations paiement</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/50">Cachet convenu</span>
                          <span className="text-sm font-semibold text-white">
                            {linkedBooking?.fee ? `${Number(linkedBooking.fee).toLocaleString('fr-FR')} €` : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/50">Statut</span>
                          <PayBadge status={linkedBooking?.paymentStatus} />
                        </div>
                      </div>
                      <p className="text-[10px] text-white/25 text-center">Le statut de paiement est géré par l&apos;organisateur.</p>
                    </div>
                  ) : (
                    /* Organisateur — liste des bookings + documents */
                    <div className="space-y-4">
                      {/* Bookings liés */}
                      <div className="space-y-2">
                        {eventDetail.bookingRequests.length === 0 ? (
                          <p className="text-xs text-white/25 italic text-center py-2">Aucune demande de booking liée à cet événement</p>
                        ) : (
                          eventDetail.bookingRequests.map(b => {
                            const name = b.target?.user?.pseudo || [b.target?.user?.firstName, b.target?.user?.lastName].filter(Boolean).join(' ') || '?'
                            return (
                              <div key={b.id} className="bg-white/5 rounded-xl p-3 border border-white/8 space-y-1.5">
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
                                {b.message && <p className="text-xs text-white/40 italic">&ldquo;{b.message}&rdquo;</p>}
                              </div>
                            )
                          })
                        )}
                        <p className="text-[10px] text-white/25 text-center">
                          Pour envoyer une offre, utilisez le profil de l&apos;artiste ou prestataire.
                        </p>
                      </div>

                      {/* Documents de l'événement */}
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Documents</p>
                        {/* Filtres */}
                        <div className="flex gap-1 mb-2 flex-wrap">
                          {(['ALL','CONTRACT','TRANSPORT','HOTEL','OTHER'] as const).map(f => (
                            <button key={f} onClick={() => setDocFilter(f)}
                              className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                                docFilter === f ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                              }`}>
                              {{ ALL: 'Tous', CONTRACT: 'Contrats', TRANSPORT: 'Transport', HOTEL: 'Logement', OTHER: 'Autres' }[f]}
                            </button>
                          ))}
                        </div>
                        {/* Liste */}
                        <div className="space-y-1.5 mb-2">
                          {filteredDocs.map(d => (
                            <div key={d.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                              <a href={d.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0">
                                <p className="text-xs text-violet-300 hover:text-violet-200 truncate">📎 {d.name}</p>
                                <p className="text-[10px] text-white/30">{{ CONTRACT: 'Contrat', TRANSPORT: 'Transport', HOTEL: 'Logement', OTHER: 'Autre' }[d.fileType] || d.fileType}</p>
                              </a>
                              <button onClick={() => deleteDocument(d.id)} className="text-white/20 hover:text-red-400 transition text-xs shrink-0">✕</button>
                            </div>
                          ))}
                          {filteredDocs.length === 0 && <p className="text-xs text-white/20 italic">Aucun document</p>}
                        </div>
                        {/* Upload */}
                        <div className="bg-white/[0.03] rounded-xl border border-white/8 p-3 space-y-2">
                          <select defaultValue="CONTRACT" id="docTypeSelect"
                            className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none">
                            <option value="CONTRACT">Contrat</option>
                            <option value="TRANSPORT">Billet de transport</option>
                            <option value="HOTEL">Réservation hôtel</option>
                            <option value="OTHER">Autre</option>
                          </select>
                          <label className={`w-full py-1.5 rounded-lg text-xs font-medium text-center cursor-pointer transition block ${
                            uploadingDoc ? 'bg-white/10 text-white/30' : 'bg-violet-600/60 hover:bg-violet-600 text-white'
                          }`}>
                            {uploadingDoc ? 'Upload en cours…' : '📎 Joindre un fichier'}
                            <input type="file" className="hidden" disabled={uploadingDoc}
                              onChange={e => {
                                const f = e.target.files?.[0]
                                const sel = document.getElementById('docTypeSelect') as HTMLSelectElement
                                if (f) addDocument(f, sel?.value || 'OTHER')
                                e.target.value = ''
                              }} />
                          </label>
                          {docError && <p className="text-xs text-red-400">{docError}</p>}
                        </div>
                      </div>
                    </div>
                  )
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
                      onClick={() => {
                        setShowPanel(false)
                        setShowEventPanel(true)
                        openEventDetail(e.id)
                      }}
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

      </>)}
    </div>
  )
}
