'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, BookOpen, Plus, X } from 'lucide-react'

import {
  CalEvent, AvailDay, BookingItem, EventSummary, EventDetail,
  EventOffer, EventOfferForm, LinkedBooking, EventMode,
} from './agenda/types'
import { MONTHS_FR, isSameDay } from './agenda/helpers'
import BookingsPanel  from './agenda/BookingsPanel'
import EventPanel     from './agenda/EventPanel'
import CalendarGrid   from './agenda/CalendarGrid'
import { getAuthToken } from '@/utils/auth'

/* ─────────────────────────────────────────────────────────
   PROPS
───────────────────────────────────────────────────────── */
interface Props {
  profileId: number
  isOwner?: boolean
  showAvailability?: boolean
  viewerRole?: string | null
  viewerProfileId?: number | null
  ownerRole?: string | null
  defaultCountry?: string | null
}

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
  defaultCountry = null,
}: Props) {
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
  const [detailTab, setDetailTab] = useState<'details' | 'staff' | 'notes' | 'purchases' | 'bookings' | 'offers'>('details')

  // Offres liées à l'événement
  const [eventOffers, setEventOffers] = useState<EventOffer[]>([])
  const [showEventOfferForm, setShowEventOfferForm] = useState(false)
  const [submittingEventOffer, setSubmittingEventOffer] = useState(false)
  const [eventOfferError, setEventOfferError] = useState<string | null>(null)
  const [eventOfferForm, setEventOfferForm] = useState<EventOfferForm>({
    title: '', description: '', type: 'ARTIST', specialty: '', date: '', time: '20:00', location: '', country: '', fee: '',
  })

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

  // Booking lié (vue artiste/prestataire)
  const [linkedBooking, setLinkedBooking] = useState<LinkedBooking | null>(null)

  // Mise à jour statut paiement
  const [updatingPayment, setUpdatingPayment] = useState<number | null>(null)

  /* ── fetchData ── */
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const token = getAuthToken()
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

      if (evRes.ok) { const d = await evRes.json(); setEvents(d.events || []) }
      if (avRes?.ok) { const d = await avRes.json(); setAvailability(d.availability || []) }
    } catch { /* silencieux */ }
    finally { setLoading(false) }
  }, [API, profileId, isOwner, showAvailability, month, year])

  useEffect(() => { fetchData() }, [fetchData])

  /* ── refreshPanel ── */
  const refreshPanel = useCallback(async () => {
    const token = getAuthToken()
    const res = await fetch(`${API}/api/events/booking-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setPanelData(await res.json())
  }, [API])

  /* ── openPanel ── */
  const openPanel = useCallback(async () => {
    setShowPanel(true)
    if (panelData) return
    setPanelLoading(true)
    try { await refreshPanel() } catch {}
    finally { setPanelLoading(false) }
  }, [panelData, refreshPanel])

  /* ── cancelBooking ── */
  const cancelBooking = useCallback(async (id: number) => {
    setCancelingId(id)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API}/api/events/booking-request/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (res.ok) await refreshPanel()
    } catch {}
    finally { setCancelingId(null) }
  }, [API, refreshPanel])

  /* ── requestCancellation ── */
  const requestCancellation = useCallback(async (id: number) => {
    setCancelRequestingId(id)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API}/api/events/booking-request/${id}/cancel-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note: cancelNoteText.trim() || undefined }),
      })
      if (res.ok) {
        setCancelNoteFor(null); setCancelNoteText('')
        await refreshPanel()
      }
    } catch {}
    finally { setCancelRequestingId(null) }
  }, [API, cancelNoteText, refreshPanel])

  /* ── fetchAllEvents ── */
  const fetchAllEvents = useCallback(async () => {
    setEventsLoading(true); setEventsError(false)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API}/api/events/all`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const d = await res.json(); setAllEvents(d.events || []) }
      else setEventsError(true)
    } catch { setEventsError(true) }
    finally { setEventsLoading(false) }
  }, [API])

  /* ── fetchEventDetail ── */
  const fetchEventDetail = useCallback(async (id: number) => {
    setEventDetailLoading(true); setEventDetailError(false)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API}/api/events/${id}/detail`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const d = await res.json()
        setEventDetail(d.event)
        setLinkedBooking(d.linkedBooking || null)
        setNotesText(d.event.notes || '')
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
      } else { setEventDetailError(true) }
    } catch { setEventDetailError(true) }
    finally { setEventDetailLoading(false) }
  }, [API])

  /* ── openEventPanel ── */
  const openEventPanel = useCallback(() => {
    setShowEventPanel(true); setShowPanel(false)
    setEventMode('list'); setSelectedEventId(null); setEventDetail(null)
    fetchAllEvents()
  }, [fetchAllEvents])

  /* ── openEventDetail ── */
  const openEventDetail = useCallback((id: number) => {
    setSelectedEventId(id); setEventMode('detail')
    setDetailTab('details'); setEventDetail(null); setEventDetailError(false)
    setEventOffers([]); setShowEventOfferForm(false)
    setEventOfferForm({ title: '', description: '', type: 'ARTIST', specialty: '', date: '', time: '20:00', location: '', country: defaultCountry || '', fee: '' })
    fetch(`${API}/api/offers?eventId=${id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setEventOffers(data) })
      .catch(() => {})
    setLinkedBooking(null); setEditMode(false); setEditError('')
    setStaffError(''); setExpenseError(''); setDocError('')
    fetchEventDetail(id)
  }, [API, fetchEventDetail])

  /* ── openEventFromCalendar (pour CalendarGrid) ── */
  const openEventFromCalendar = useCallback((id: number) => {
    setShowPanel(false); setShowEventPanel(true)
    openEventDetail(id)
  }, [openEventDetail])

  /* ── createEvent ── */
  const createEvent = useCallback(async () => {
    if (!createTitle.trim() || !createDate) return
    setCreating(true); setCreateError('')
    try {
      const token = getAuthToken()
      const startISO = createStartTime ? `${createDate}T${createStartTime}:00` : `${createDate}T12:00:00`
      const endISO   = createEndDate ? (createEndTime ? `${createEndDate}T${createEndTime}:00` : `${createEndDate}T23:59:00`) : null
      const res = await fetch(`${API}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: createTitle.trim(), start: startISO, end: endISO,
          lieu: createLieu.trim() || null, category: createCategory || null,
          budget: createBudget ? parseFloat(createBudget) : null,
          isPrivate: true, status: 'DRAFT',
        }),
      })
      if (res.ok) {
        const d = await res.json()
        setCreateTitle(''); setCreateDate(''); setCreateEndDate(''); setCreateStartTime('')
        setCreateEndTime(''); setCreateLieu(''); setCreateCategory(''); setCreateBudget('')
        setLastCreatedId(d.event.id)
        await fetchAllEvents(); fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        setCreateError(err.error || 'Erreur lors de la création')
      }
    } catch { setCreateError('Impossible de joindre le serveur') }
    finally { setCreating(false) }
  }, [API, createTitle, createDate, createEndDate, createStartTime, createEndTime, createLieu, createCategory, createBudget, fetchAllEvents, fetchData])

  /* ── deleteEvent ── */
  const deleteEvent = useCallback(async () => {
    if (!selectedEventId) return
    setDeletingEvent(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API}/api/events/${selectedEventId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setShowEventPanel(false); setEventMode('list'); setSelectedEventId(null)
        setEventDetail(null); setConfirmDelete(false)
        await fetchAllEvents(); fetchData()
      }
    } catch {}
    finally { setDeletingEvent(false) }
  }, [API, selectedEventId, fetchAllEvents, fetchData])

  /* ── saveNotes ── */
  const saveNotes = useCallback(async () => {
    if (!selectedEventId) return
    setNotesSaving(true)
    try {
      const token = getAuthToken()
      await fetch(`${API}/api/events/${selectedEventId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: notesText }),
      })
    } catch {}
    finally { setNotesSaving(false) }
  }, [API, selectedEventId, notesText])

  /* ── addExpense ── */
  const addExpense = useCallback(async () => {
    if (!newExpenseLabel.trim() || !selectedEventId) return
    setAddingExpense(true); setExpenseError('')
    try {
      const token = getAuthToken()
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
    } catch { setExpenseError('Erreur réseau') }
    finally { setAddingExpense(false) }
  }, [API, selectedEventId, newExpenseLabel, newExpenseAmount, newExpenseCategory])

  /* ── toggleExpensePaid ── */
  const toggleExpensePaid = useCallback(async (expenseId: number, paid: boolean) => {
    if (!selectedEventId) return
    try {
      const token = getAuthToken()
      await fetch(`${API}/api/events/${selectedEventId}/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paid }),
      })
      setEventDetail(prev => prev ? { ...prev, expenses: prev.expenses.map(e => e.id === expenseId ? { ...e, paid } : e) } : prev)
    } catch {}
  }, [API, selectedEventId])

  /* ── deleteExpense ── */
  const deleteExpense = useCallback(async (expenseId: number) => {
    if (!selectedEventId) return
    try {
      const token = getAuthToken()
      await fetch(`${API}/api/events/${selectedEventId}/expenses/${expenseId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      setEventDetail(prev => prev ? { ...prev, expenses: prev.expenses.filter(e => e.id !== expenseId) } : prev)
    } catch {}
  }, [API, selectedEventId])

  /* ── addPurchase ── */
  const addPurchase = useCallback(async () => {
    if (!newPurchaseItem.trim() || !selectedEventId) return
    setAddingPurchase(true)
    try {
      const token = getAuthToken()
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

  /* ── togglePurchaseDone ── */
  const togglePurchaseDone = useCallback(async (purchaseId: number, done: boolean) => {
    if (!selectedEventId) return
    try {
      const token = getAuthToken()
      await fetch(`${API}/api/events/${selectedEventId}/purchases/${purchaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ done }),
      })
      setEventDetail(prev => prev ? { ...prev, purchases: prev.purchases.map(p => p.id === purchaseId ? { ...p, done } : p) } : prev)
    } catch {}
  }, [API, selectedEventId])

  /* ── deletePurchase ── */
  const deletePurchase = useCallback(async (purchaseId: number) => {
    if (!selectedEventId) return
    try {
      const token = getAuthToken()
      await fetch(`${API}/api/events/${selectedEventId}/purchases/${purchaseId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      setEventDetail(prev => prev ? { ...prev, purchases: prev.purchases.filter(p => p.id !== purchaseId) } : prev)
    } catch {}
  }, [API, selectedEventId])

  /* ── saveEventDetails ── */
  const saveEventDetails = useCallback(async () => {
    if (!selectedEventId || !editTitle.trim()) return
    setEditSaving(true); setEditError('')
    try {
      const token = getAuthToken()
      const startISO = editStartTime ? `${editStart}T${editStartTime}:00` : `${editStart}T12:00:00`
      const endISO   = editEnd ? (editEndTime ? `${editEnd}T${editEndTime}:00` : `${editEnd}T23:59:00`) : null
      const res = await fetch(`${API}/api/events/${selectedEventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: editTitle.trim(), lieu: editLieu.trim() || null, category: editCategory || null,
          budget: editBudget ? parseFloat(editBudget) : null, status: editStatus,
          maxCapacity: editCapacity ? parseInt(editCapacity) : null,
          description: editDescription.trim() || null, start: startISO, end: endISO,
        }),
      })
      if (res.ok) {
        const d = await res.json()
        setEventDetail(prev => prev ? { ...prev, ...d.event } : prev)
        setEditMode(false)
        await fetchAllEvents(); fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        setEditError(err.error || 'Erreur lors de la sauvegarde')
      }
    } catch { setEditError('Erreur réseau') }
    finally { setEditSaving(false) }
  }, [API, selectedEventId, editTitle, editLieu, editCategory, editBudget, editStatus, editCapacity, editDescription, editStart, editStartTime, editEnd, editEndTime, fetchAllEvents, fetchData])

  /* ── addStaff ── */
  const addStaff = useCallback(async (staffProfileId?: number) => {
    if (!newStaffRole.trim() || !selectedEventId) return
    setAddingStaff(true); setStaffError('')
    try {
      const token = getAuthToken()
      const res = await fetch(`${API}/api/events/${selectedEventId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          role: newStaffRole.trim(), fee: newStaffFee ? parseFloat(newStaffFee) : null,
          notes: newStaffNotes.trim() || null, profileId: staffProfileId || null,
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
    } catch { setStaffError('Erreur réseau') }
    finally { setAddingStaff(false) }
  }, [API, selectedEventId, newStaffRole, newStaffFee, newStaffNotes])

  /* ── deleteStaff ── */
  const deleteStaff = useCallback(async (staffId: number) => {
    if (!selectedEventId) return
    setDeletingStaffId(staffId)
    try {
      const token = getAuthToken()
      await fetch(`${API}/api/events/${selectedEventId}/staff/${staffId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      setEventDetail(prev => prev ? { ...prev, staff: prev.staff.filter(s => s.id !== staffId) } : prev)
    } catch {}
    finally { setDeletingStaffId(null) }
  }, [API, selectedEventId])

  /* ── searchStaff ── */
  const searchStaff = useCallback(async (q: string) => {
    setStaffSearchQ(q)
    if (!q.trim() || q.trim().length < 2) { setStaffSearchResults([]); return }
    setStaffSearchLoading(true)
    try {
      const token = getAuthToken()
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

  /* ── addDocument ── */
  const addDocument = useCallback(async (file: File, docType: string) => {
    if (!selectedEventId) return
    setUploadingDoc(true); setDocError('')
    try {
      const token = getAuthToken()
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch(`${API}/api/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      })
      if (!uploadRes.ok) { setDocError("Erreur d'upload"); return }
      const uploadData = await uploadRes.json()
      const url = uploadData.url || uploadData.secure_url
      if (!url) { setDocError("URL manquante après upload"); return }
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
    } catch { setDocError('Erreur réseau') }
    finally { setUploadingDoc(false) }
  }, [API, selectedEventId])

  /* ── deleteDocument ── */
  const deleteDocument = useCallback(async (docId: number) => {
    if (!selectedEventId) return
    try {
      const token = getAuthToken()
      await fetch(`${API}/api/events/${selectedEventId}/documents/${docId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      setEventDetail(prev => prev ? { ...prev, documents: prev.documents.filter(d => d.id !== docId) } : prev)
    } catch {}
  }, [API, selectedEventId])

  /* ── updatePaymentStatus ── */
  const updatePaymentStatus = useCallback(async (bookingId: number, paymentStatus: string) => {
    setUpdatingPayment(bookingId)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API}/api/events/booking-request/${bookingId}/payment-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentStatus }),
      })
      if (res.ok) await refreshPanel()
    } catch {}
    finally { setUpdatingPayment(null) }
  }, [API, refreshPanel])

  /* ── submitEventOffer (extrait de l'inline JSX) ── */
  const submitEventOffer = useCallback(async (form: EventOfferForm) => {
    setEventOfferError(null)
    if (!form.title || !form.description || !form.date || !form.location || !form.country) {
      setEventOfferError('Remplis tous les champs obligatoires.')
      return
    }
    setSubmittingEventOffer(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API}/api/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title, description: form.description, type: form.type,
          specialty: form.specialty || null,
          date: `${form.date}T${form.time || '00:00'}:00`,
          location: form.location, country: form.country,
          fee: form.fee ? parseFloat(form.fee) : null,
          eventId: selectedEventId,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur')
      const created = await res.json()
      setEventOffers(prev => [created, ...prev])
      setShowEventOfferForm(false)
      setEventOfferForm({ title: '', description: '', type: 'ARTIST', specialty: '', date: '', time: '20:00', location: '', country: defaultCountry || '', fee: '' })
    } catch (err: unknown) {
      setEventOfferError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSubmittingEventOffer(false)
    }
  }, [API, selectedEventId])

  /* ── deleteEventOffer (extrait de l'inline JSX) ── */
  const deleteEventOffer = useCallback(async (offerId: number) => {
    const token = getAuthToken()
    await fetch(`${API}/api/offers/${offerId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setEventOffers(prev => prev.filter(x => x.id !== offerId))
  }, [API])

  /* ── Reset form booking quand on change de jour ── */
  useEffect(() => {
    setShowBookingForm(false); setBookingMsg(''); setBookingFee(''); setBookingSent(false)
  }, [selected])

  /* ── Grille du mois ── */
  const firstDay  = new Date(year, month - 1, 1)
  const lastDay   = new Date(year, month, 0)
  const startDow  = (firstDay.getDay() + 6) % 7
  const totalDays = lastDay.getDate()
  const cells: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => new Date(year, month - 1, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const selectedEvents = selected ? events.filter(e => isSameDay(new Date(e.start), selected)) : []
  const selectedAvail  = selected ? availability.find(a => isSameDay(new Date(a.date), selected)) : undefined
  // Un organisateur peut proposer un booking sur tout jour qui n'est pas explicitement bloqué
  const canBook = !isOwner && viewerRole === 'ORGANIZER'
    && selected !== null
    && selectedAvail?.status !== 'UNAVAILABLE'
    && selectedAvail?.status !== 'BOOKED'

  /* ── Navigation mois ── */
  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1); setSelected(null) }
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1); setSelected(null) }

  /* ── Sauvegarder disponibilité ── */
  const saveAvailability = async (status: string) => {
    if (!selected || !isOwner) return
    setSavingAvail(true)
    try {
      const token = getAuthToken()
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
    } catch {}
    finally { setSavingAvail(false) }
  }

  /* ── Envoyer demande de booking ── */
  const sendBookingRequest = async () => {
    if (!selected || !viewerProfileId) return
    setBookingSending(true)
    try {
      const token = getAuthToken()
      const d = selected
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T00:00:00.000Z`
      const res = await fetch(`${API}/api/events/booking-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          targetProfileId: profileId, date: dateStr,
          message: bookingMsg.trim() || null,
          fee: bookingFee ? parseFloat(bookingFee) : null,
        }),
      })
      if (res.ok) {
        setBookingSent(true); setShowBookingForm(false)
        setAvailability(prev => {
          const filtered = prev.filter(a => !isSameDay(new Date(a.date), selected))
          return [...filtered, { date: dateStr, status: 'TENTATIVE' }]
        })
      }
    } catch {}
    finally { setBookingSending(false) }
  }

  /* ─────────────────────────────────────────────────────────
     RENDU
  ───────────────────────────────────────────────────────── */
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '0.5px solid #1c2030', background: '#0c0f18' }}>

      {/* En-tête */}
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '0.5px solid #1c2030', background: '#111318' }}>
        {showEventPanel ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" style={{ color: '#6366f1' }} />
              <span className="font-medium text-sm" style={{ color: '#d0daf0' }}>Mes événements</span>
            </div>
            <div className="flex items-center gap-2">
              {eventMode === 'detail' && (
                <button
                  onClick={() => { setEventMode('list'); setSelectedEventId(null); setEventDetail(null) }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid #2a3050', color: '#8891b0' }}
                >
                  ← Retour
                </button>
              )}
              <button
                onClick={() => { setShowEventPanel(false); setEventMode('list') }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid #2a3050', color: '#8891b0' }}
              >
                <X className="h-3 w-3" /> Fermer
              </button>
            </div>
          </div>
        ) : showPanel ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" style={{ color: '#6366f1' }} />
              <span className="font-medium text-sm" style={{ color: '#d0daf0' }}>Mes bookings</span>
            </div>
            <button
              onClick={() => setShowPanel(false)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid #2a3050', color: '#8891b0' }}
            >
              <X className="h-3 w-3" /> Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <span className="font-medium" style={{ fontSize: 16, color: '#d0daf0' }}>
                {MONTHS_FR[month - 1]} {year}
              </span>
              {events.length > 0 && (
                <span style={{ fontSize: 11, color: '#485272' }}>
                  {events.length} événement{events.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {isOwner && (
                <button
                  onClick={openEventPanel}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition hover:opacity-80"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '0.5px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}
                >
                  <Plus className="h-3 w-3" /> Événement
                </button>
              )}
              {isOwner && (
                <button
                  onClick={openPanel}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition hover:opacity-80"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '0.5px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}
                >
                  <BookOpen className="h-3 w-3" /> Bookings
                </button>
              )}
              <div style={{ width: '0.5px', height: 16, background: '#1c2030', margin: '0 2px' }} />
              <button
                onClick={prevMonth}
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '0.5px solid #2a3050', borderRadius: 8, color: '#485272', cursor: 'pointer' }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextMonth}
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '0.5px solid #2a3050', borderRadius: 8, color: '#485272', cursor: 'pointer' }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Panneau "Mes Bookings" */}
      {showPanel && (
        <BookingsPanel
          panelData={panelData}
          panelLoading={panelLoading}
          panelTab={panelTab}
          profileId={profileId}
          cancelingId={cancelingId}
          cancelNoteFor={cancelNoteFor}
          cancelNoteText={cancelNoteText}
          cancelRequestingId={cancelRequestingId}
          updatingPayment={updatingPayment}
          setPanelTab={setPanelTab}
          setCancelNoteFor={setCancelNoteFor}
          setCancelNoteText={setCancelNoteText}
          cancelBooking={cancelBooking}
          requestCancellation={requestCancellation}
          updatePaymentStatus={updatePaymentStatus}
        />
      )}

      {/* Panneau "Événements" */}
      {showEventPanel && (
        <EventPanel
          eventMode={eventMode}
          allEvents={allEvents}
          eventsLoading={eventsLoading}
          eventsError={eventsError}
          lastCreatedId={lastCreatedId}
          createTitle={createTitle}     setCreateTitle={setCreateTitle}
          createDate={createDate}       setCreateDate={setCreateDate}
          createEndDate={createEndDate} setCreateEndDate={setCreateEndDate}
          createStartTime={createStartTime} setCreateStartTime={setCreateStartTime}
          createEndTime={createEndTime}     setCreateEndTime={setCreateEndTime}
          createLieu={createLieu}       setCreateLieu={setCreateLieu}
          createCategory={createCategory} setCreateCategory={setCreateCategory}
          createBudget={createBudget}   setCreateBudget={setCreateBudget}
          creating={creating}
          createError={createError}
          selectedEventId={selectedEventId}
          eventDetail={eventDetail}
          eventDetailLoading={eventDetailLoading}
          eventDetailError={eventDetailError}
          linkedBooking={linkedBooking}
          detailTab={detailTab}         setDetailTab={setDetailTab}
          editMode={editMode}           setEditMode={setEditMode}
          editTitle={editTitle}         setEditTitle={setEditTitle}
          editLieu={editLieu}           setEditLieu={setEditLieu}
          editCategory={editCategory}   setEditCategory={setEditCategory}
          editBudget={editBudget}       setEditBudget={setEditBudget}
          editStatus={editStatus}       setEditStatus={setEditStatus}
          editCapacity={editCapacity}   setEditCapacity={setEditCapacity}
          editDescription={editDescription} setEditDescription={setEditDescription}
          editStart={editStart}         setEditStart={setEditStart}
          editStartTime={editStartTime} setEditStartTime={setEditStartTime}
          editEnd={editEnd}             setEditEnd={setEditEnd}
          editEndTime={editEndTime}     setEditEndTime={setEditEndTime}
          editSaving={editSaving}
          editError={editError}         setEditError={setEditError}
          confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete}
          deletingEvent={deletingEvent}
          notesText={notesText}         setNotesText={setNotesText}
          notesSaving={notesSaving}
          newExpenseLabel={newExpenseLabel}       setNewExpenseLabel={setNewExpenseLabel}
          newExpenseAmount={newExpenseAmount}     setNewExpenseAmount={setNewExpenseAmount}
          newExpenseCategory={newExpenseCategory} setNewExpenseCategory={setNewExpenseCategory}
          addingExpense={addingExpense}
          expenseError={expenseError}
          newPurchaseItem={newPurchaseItem}   setNewPurchaseItem={setNewPurchaseItem}
          newPurchaseQty={newPurchaseQty}     setNewPurchaseQty={setNewPurchaseQty}
          newPurchasePrice={newPurchasePrice} setNewPurchasePrice={setNewPurchasePrice}
          addingPurchase={addingPurchase}
          newStaffRole={newStaffRole}   setNewStaffRole={setNewStaffRole}
          newStaffFee={newStaffFee}     setNewStaffFee={setNewStaffFee}
          newStaffNotes={newStaffNotes} setNewStaffNotes={setNewStaffNotes}
          addingStaff={addingStaff}
          staffError={staffError}
          deletingStaffId={deletingStaffId}
          staffSearchQ={staffSearchQ}
          staffSearchResults={staffSearchResults}
          staffSearchLoading={staffSearchLoading}
          staffAddMode={staffAddMode}   setStaffAddMode={setStaffAddMode}
          uploadingDoc={uploadingDoc}
          docError={docError}
          docFilter={docFilter}         setDocFilter={setDocFilter}
          eventOffers={eventOffers}     setEventOffers={setEventOffers}
          showEventOfferForm={showEventOfferForm} setShowEventOfferForm={setShowEventOfferForm}
          submittingEventOffer={submittingEventOffer}
          eventOfferError={eventOfferError}       setEventOfferError={setEventOfferError}
          eventOfferForm={eventOfferForm}         setEventOfferForm={setEventOfferForm}
          fetchAllEvents={fetchAllEvents}
          openEventDetail={openEventDetail}
          createEvent={createEvent}
          deleteEvent={deleteEvent}
          saveNotes={saveNotes}
          addExpense={addExpense}
          toggleExpensePaid={toggleExpensePaid}
          deleteExpense={deleteExpense}
          addPurchase={addPurchase}
          togglePurchaseDone={togglePurchaseDone}
          deletePurchase={deletePurchase}
          saveEventDetails={saveEventDetails}
          addStaff={addStaff}
          deleteStaff={deleteStaff}
          searchStaff={searchStaff}
          addDocument={addDocument}
          deleteDocument={deleteDocument}
          fetchEventDetail={fetchEventDetail}
          submitEventOffer={submitEventOffer}
          deleteEventOffer={deleteEventOffer}
        />
      )}

      {/* Grille calendrier + panneau jour (masqués quand un panneau est ouvert) */}
      {!showPanel && !showEventPanel && (
        <CalendarGrid
          cells={cells}
          events={events}
          availability={availability}
          selected={selected}
          loading={loading}
          now={now}
          isOwner={isOwner}
          showAvailability={showAvailability}
          savingAvail={savingAvail}
          selectedEvents={selectedEvents}
          selectedAvail={selectedAvail}
          canBook={canBook}
          bookingSent={bookingSent}
          showBookingForm={showBookingForm}
          bookingMsg={bookingMsg}
          bookingFee={bookingFee}
          bookingSending={bookingSending}
          setSelected={setSelected}
          setShowBookingForm={setShowBookingForm}
          setBookingMsg={setBookingMsg}
          setBookingFee={setBookingFee}
          saveAvailability={saveAvailability}
          sendBookingRequest={sendBookingRequest}
          openEventFromCalendar={openEventFromCalendar}
        />
      )}

    </div>
  )
}
