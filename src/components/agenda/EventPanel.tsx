// agenda/EventPanel.tsx — Panneau "Événements" (liste + détail avec 6 onglets)

import {
  EventSummary, EventDetail, EventOffer, EventOfferForm,
  LinkedBooking, StaffItem, EventMode,
} from './types'
import { DocumentsSection, PayBadge } from './helpers'

const CATEGORIES      = ['Club', 'Mariage', 'Corporate', 'Festival', 'Concert', 'Privé', 'Autre']
const EXPENSE_CATS    = ['Technique', 'Catering', 'Décor', 'Communication', 'Personnel', 'Autre']
const STATUS_LABEL: Record<string, string> = { DRAFT: 'Brouillon', PUBLISHED: 'Publié', CANCELLED: 'Annulé', COMPLETED: 'Terminé' }
const STATUS_CLS: Record<string, string>   = {
  DRAFT: 'bg-white/10 text-white/40', PUBLISHED: 'bg-green-500/20 text-green-300',
  CANCELLED: 'bg-red-500/20 text-red-300', COMPLETED: 'bg-blue-500/20 text-blue-300',
}

interface EventPanelProps {
  /* Mode */
  eventMode: EventMode
  /* Liste */
  allEvents: EventSummary[]
  eventsLoading: boolean
  eventsError: boolean
  lastCreatedId: number | null
  /* Formulaire création */
  createTitle: string; setCreateTitle: (v: string) => void
  createDate: string;  setCreateDate:  (v: string) => void
  createEndDate: string; setCreateEndDate: (v: string) => void
  createStartTime: string; setCreateStartTime: (v: string) => void
  createEndTime: string;   setCreateEndTime:   (v: string) => void
  createLieu: string;     setCreateLieu:     (v: string) => void
  createCategory: string; setCreateCategory: (v: string) => void
  createBudget: string;   setCreateBudget:   (v: string) => void
  creating: boolean
  createError: string
  /* Détail événement */
  selectedEventId: number | null
  eventDetail: EventDetail | null
  eventDetailLoading: boolean
  eventDetailError: boolean
  linkedBooking: LinkedBooking | null
  detailTab: 'details' | 'staff' | 'notes' | 'purchases' | 'bookings' | 'offers'
  setDetailTab: (tab: 'details' | 'staff' | 'notes' | 'purchases' | 'bookings' | 'offers') => void
  /* Mode édition détail */
  editMode: boolean; setEditMode: (v: boolean) => void
  editTitle: string; setEditTitle: (v: string) => void
  editLieu: string;  setEditLieu:  (v: string) => void
  editCategory: string; setEditCategory: (v: string) => void
  editBudget: string;   setEditBudget:   (v: string) => void
  editStatus: string;   setEditStatus:   (v: string) => void
  editCapacity: string; setEditCapacity: (v: string) => void
  editDescription: string; setEditDescription: (v: string) => void
  editStart: string;    setEditStart:    (v: string) => void
  editStartTime: string; setEditStartTime: (v: string) => void
  editEnd: string;     setEditEnd:      (v: string) => void
  editEndTime: string; setEditEndTime:  (v: string) => void
  editSaving: boolean
  editError: string; setEditError: (v: string) => void
  /* Suppression */
  confirmDelete: boolean; setConfirmDelete: (v: boolean) => void
  deletingEvent: boolean
  /* Notes */
  notesText: string; setNotesText: (v: string) => void
  notesSaving: boolean
  /* Dépenses */
  newExpenseLabel: string;    setNewExpenseLabel:    (v: string) => void
  newExpenseAmount: string;   setNewExpenseAmount:   (v: string) => void
  newExpenseCategory: string; setNewExpenseCategory: (v: string) => void
  addingExpense: boolean
  expenseError: string
  /* Achats */
  newPurchaseItem: string;  setNewPurchaseItem:  (v: string) => void
  newPurchaseQty: string;   setNewPurchaseQty:   (v: string) => void
  newPurchasePrice: string; setNewPurchasePrice: (v: string) => void
  addingPurchase: boolean
  /* Personnel */
  newStaffRole: string;  setNewStaffRole:  (v: string) => void
  newStaffFee: string;   setNewStaffFee:   (v: string) => void
  newStaffNotes: string; setNewStaffNotes: (v: string) => void
  addingStaff: boolean
  staffError: string
  deletingStaffId: number | null
  staffSearchQ: string
  staffSearchResults: { id: number; avatar?: string | null; user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null; role?: string | null } | null }[]
  staffSearchLoading: boolean
  staffAddMode: 'manual' | 'pseudo'; setStaffAddMode: (v: 'manual' | 'pseudo') => void
  /* Documents */
  uploadingDoc: boolean
  docError: string
  docFilter: 'ALL' | 'CONTRACT' | 'TRANSPORT' | 'HOTEL' | 'OTHER'
  setDocFilter: (v: 'ALL' | 'CONTRACT' | 'TRANSPORT' | 'HOTEL' | 'OTHER') => void
  /* Offres liées */
  eventOffers: EventOffer[]
  setEventOffers: (fn: (prev: EventOffer[]) => EventOffer[]) => void
  showEventOfferForm: boolean; setShowEventOfferForm: (v: boolean) => void
  submittingEventOffer: boolean
  eventOfferError: string | null; setEventOfferError: (v: string | null) => void
  eventOfferForm: EventOfferForm; setEventOfferForm: (fn: (prev: EventOfferForm) => EventOfferForm) => void
  /* Callbacks actions */
  fetchAllEvents: () => void
  openEventDetail: (id: number) => void
  createEvent: () => void
  deleteEvent: () => void
  saveNotes: () => void
  addExpense: () => void
  toggleExpensePaid: (id: number, paid: boolean) => void
  deleteExpense: (id: number) => void
  addPurchase: () => void
  togglePurchaseDone: (id: number, done: boolean) => void
  deletePurchase: (id: number) => void
  saveEventDetails: () => void
  addStaff: (profileId?: number) => void
  deleteStaff: (id: number) => void
  searchStaff: (q: string) => void
  addDocument: (file: File, type: string) => void
  deleteDocument: (id: number) => void
  fetchEventDetail: (id: number) => void
  setEventMode: (mode: EventMode) => void
  setSelectedEventId: (id: number | null) => void
  setEventDetail: (d: EventDetail | null) => void
  submitEventOffer: (form: EventOfferForm) => Promise<void>
  deleteEventOffer: (offerId: number) => Promise<void>
}

export default function EventPanel(p: EventPanelProps) {
  const {
    eventMode, allEvents, eventsLoading, eventsError, lastCreatedId,
    createTitle, setCreateTitle, createDate, setCreateDate,
    createEndDate, setCreateEndDate, createStartTime, setCreateStartTime,
    createEndTime, setCreateEndTime, createLieu, setCreateLieu,
    createCategory, setCreateCategory, createBudget, setCreateBudget,
    creating, createError,
    selectedEventId, eventDetail, eventDetailLoading, eventDetailError,
    linkedBooking, detailTab, setDetailTab,
    editMode, setEditMode, editTitle, setEditTitle, editLieu, setEditLieu,
    editCategory, setEditCategory, editBudget, setEditBudget, editStatus, setEditStatus,
    editCapacity, setEditCapacity, editDescription, setEditDescription,
    editStart, setEditStart, editStartTime, setEditStartTime,
    editEnd, setEditEnd, editEndTime, setEditEndTime,
    editSaving, editError, setEditError,
    confirmDelete, setConfirmDelete, deletingEvent,
    notesText, setNotesText, notesSaving,
    newExpenseLabel, setNewExpenseLabel, newExpenseAmount, setNewExpenseAmount,
    newExpenseCategory, setNewExpenseCategory, addingExpense, expenseError,
    newPurchaseItem, setNewPurchaseItem, newPurchaseQty, setNewPurchaseQty,
    newPurchasePrice, setNewPurchasePrice, addingPurchase,
    newStaffRole, setNewStaffRole, newStaffFee, setNewStaffFee,
    newStaffNotes, setNewStaffNotes, addingStaff, staffError, deletingStaffId,
    staffSearchQ, staffSearchResults, staffSearchLoading, staffAddMode, setStaffAddMode,
    uploadingDoc, docError, docFilter, setDocFilter,
    eventOffers, showEventOfferForm, setShowEventOfferForm,
    submittingEventOffer, eventOfferError, eventOfferForm, setEventOfferForm,
    fetchAllEvents, openEventDetail, createEvent, deleteEvent, saveNotes,
    addExpense, toggleExpensePaid, deleteExpense,
    addPurchase, togglePurchaseDone, deletePurchase,
    saveEventDetails, addStaff, deleteStaff, searchStaff,
    addDocument, deleteDocument, fetchEventDetail,
    setEventMode, setSelectedEventId, setEventDetail,
    submitEventOffer, deleteEventOffer,
  } = p

  /* ── LIST MODE ── */
  if (eventMode === 'list') {
    return (
      <div className="p-4 max-h-[580px] overflow-y-auto space-y-3">
        {/* Formulaire création */}
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

        {/* Liste des événements */}
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
                  ev.id === lastCreatedId ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'
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
                    <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${STATUS_CLS[ev.status] || 'bg-white/10 text-white/40'}`}>
                      {STATUS_LABEL[ev.status] || ev.status}
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

  /* ── DETAIL MODE ── */
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

  const isBookedEvent = !!linkedBooking

  const ORGANIZER_TABS = [
    { key: 'details'   as const, label: 'Détail' },
    { key: 'staff'     as const, label: 'Personnel' },
    { key: 'notes'     as const, label: 'Notes & Frais' },
    { key: 'purchases' as const, label: 'Achats' },
    { key: 'bookings'  as const, label: 'Bookings' },
    { key: 'offers'    as const, label: 'Offres' },
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

  const personName = (pr: StaffItem['profile']) => {
    if (!pr) return 'Non assigné'
    return pr.user?.pseudo || [pr.user?.firstName, pr.user?.lastName].filter(Boolean).join(' ') || '?'
  }

  const bookingStatusCls: Record<string, string> = {
    PENDING: 'text-yellow-300', ACCEPTED: 'text-green-300',
    DECLINED: 'text-red-300',   CANCELLED: 'text-white/30',
  }

  const allDocs      = eventDetail.documents || []
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
            {isBookedEvent ? (
              /* Vue artiste — lecture seule */
              <>
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 space-y-1.5">
                  <p className="text-[10px] text-violet-300 font-medium uppercase tracking-wide">Organisateur</p>
                  <p className="text-sm font-medium text-white">
                    {linkedBooking?.requester?.user?.pseudo || [linkedBooking?.requester?.user?.firstName, linkedBooking?.requester?.user?.lastName].filter(Boolean).join(' ') || '?'}
                  </p>
                </div>
                {[
                  { label: 'Titre',     value: eventDetail.title },
                  { label: 'Date',      value: new Date(eventDetail.start).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                  { label: 'Lieu',      value: eventDetail.lieu || '—' },
                  { label: 'Catégorie', value: eventDetail.category || '—' },
                  { label: 'Cachet',    value: linkedBooking?.fee ? `${Number(linkedBooking.fee).toLocaleString('fr-FR')} €` : '—' },
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
                  { label: 'Titre',        value: eventDetail.title },
                  { label: 'Date',         value: new Date(eventDetail.start).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + (eventDetail.end ? ` → ${new Date(eventDetail.end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : '') },
                  { label: 'Lieu',         value: eventDetail.lieu || '—' },
                  { label: 'Catégorie',    value: eventDetail.category || '—' },
                  { label: 'Budget',       value: eventDetail.budget ? `${Number(eventDetail.budget).toLocaleString('fr-FR')} €` : '—' },
                  { label: 'Statut',       value: STATUS_LABEL[eventDetail.status] || eventDetail.status },
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
              <>
                {/* Liste personnel */}
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
                    {totalStaffFee > 0 && (
                      <div className="flex items-center justify-between px-3 py-2 bg-white/[0.03] rounded-xl border border-white/8">
                        <span className="text-xs text-white/40">Total salaires</span>
                        <span className="text-xs font-semibold text-white">{totalStaffFee.toLocaleString('fr-FR')} €</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Formulaire ajout personnel */}
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
                          {staffSearchResults.map(r => (
                            <button key={r.id} type="button"
                              onClick={() => { addStaff(r.id); }}
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
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Notes privées</p>
                <textarea
                  value={notesText}
                  onChange={e => setNotesText(e.target.value)}
                  placeholder="Vos notes pour cet événement…"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40 resize-none"
                />
                <button onClick={saveNotes} disabled={notesSaving}
                  className="mt-1.5 px-4 py-1.5 rounded-lg bg-violet-600/60 hover:bg-violet-600 text-white text-xs font-medium disabled:opacity-40 transition">
                  {notesSaving ? 'Sauvegarde…' : 'Sauvegarder'}
                </button>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/40 uppercase tracking-wide">Frais</p>
                  <p className="text-xs text-white/50">{paidExpenses.toLocaleString('fr-FR')} € / {totalExpenses.toLocaleString('fr-FR')} € payés</p>
                </div>
                <div className="space-y-1.5 mb-3">
                  {eventDetail.expenses.map(e => (
                    <div key={e.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                      <input type="checkbox" checked={e.paid}
                        onChange={ev => toggleExpensePaid(e.id, ev.target.checked)}
                        className="accent-violet-500 w-3.5 h-3.5 shrink-0" />
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
                      {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
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
                    <input type="checkbox" checked={p.done}
                      onChange={ev => togglePurchaseDone(p.id, ev.target.checked)}
                      className="accent-green-500 w-3.5 h-3.5 shrink-0" />
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
            <div className="space-y-4">
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

        {/* ── OFFRES (organisateur uniquement) ── */}
        {detailTab === 'offers' && !isBookedEvent && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40">Offres liées à cet événement</p>
              <button
                onClick={() => {
                  if (!showEventOfferForm && eventDetail) {
                    const d = new Date(eventDetail.start)
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                    setEventOfferForm(prev => ({
                      ...prev,
                      date: dateStr,
                      time: timeStr,
                      location: eventDetail.lieu || prev.location,
                    }))
                  }
                  setShowEventOfferForm(!showEventOfferForm)
                }}
                className="flex items-center gap-1 text-[11px] bg-violet-600 hover:bg-violet-500 text-white px-2.5 py-1 rounded-full transition-colors"
              >
                + Publier une offre
              </button>
            </div>

            {showEventOfferForm && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  await submitEventOffer(eventOfferForm)
                }}
                className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-2"
              >
                <input required value={eventOfferForm.title}
                  onChange={e => setEventOfferForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Titre de l'offre *"
                  className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40"
                />
                <textarea required rows={2} value={eventOfferForm.description}
                  onChange={e => setEventOfferForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Description *"
                  className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40 resize-none"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <select value={eventOfferForm.type}
                    onChange={e => setEventOfferForm(p => ({ ...p, type: e.target.value as typeof eventOfferForm.type }))}
                    className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none"
                  >
                    <option value="ARTIST">Artiste</option>
                    <option value="PROVIDER">Prestataire</option>
                    <option value="ALL">Tous profils</option>
                  </select>
                  <input value={eventOfferForm.specialty}
                    onChange={e => setEventOfferForm(p => ({ ...p, specialty: e.target.value }))}
                    placeholder="Spécialité"
                    className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none"
                  />
                  <input required type="date" value={eventOfferForm.date}
                    onChange={e => setEventOfferForm(p => ({ ...p, date: e.target.value }))}
                    className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none"
                  />
                  <input type="time" value={eventOfferForm.time}
                    onChange={e => setEventOfferForm(p => ({ ...p, time: e.target.value }))}
                    className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none"
                  />
                  <input required value={eventOfferForm.location}
                    onChange={e => setEventOfferForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="Ville *"
                    className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none"
                  />
                  <input required value={eventOfferForm.country}
                    onChange={e => setEventOfferForm(p => ({ ...p, country: e.target.value }))}
                    placeholder="Pays *"
                    className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none"
                  />
                </div>
                <input type="number" min="0" step="0.01" value={eventOfferForm.fee}
                  onChange={e => setEventOfferForm(p => ({ ...p, fee: e.target.value }))}
                  placeholder="Tarif proposé (optionnel)"
                  className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none"
                />
                {eventOfferError && <p className="text-xs text-red-400">{eventOfferError}</p>}
                <button type="submit" disabled={submittingEventOffer}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                >
                  {submittingEventOffer ? 'Publication…' : 'Publier'}
                </button>
              </form>
            )}

            {eventOffers.length === 0 ? (
              <p className="text-xs text-white/25 italic text-center py-3">Aucune offre publiée pour cet événement</p>
            ) : (
              <div className="space-y-2">
                {eventOffers.map(o => (
                  <div key={o.id} className="bg-white/5 rounded-xl p-3 border border-white/8">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">{o.title}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          {new Date(o.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}{o.location}
                          {o.fee != null ? ` · ${Number(o.fee).toLocaleString('fr-FR')} €` : ''}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm('Supprimer cette offre ?')) return
                          await deleteEventOffer(o.id)
                        }}
                        className="text-white/20 hover:text-red-400 transition text-xs flex-shrink-0"
                      >✕</button>
                    </div>
                    <p className="text-[10px] text-white/50 mt-1 line-clamp-2">{o.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
