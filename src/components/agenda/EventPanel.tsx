// agenda/EventPanel.tsx — Panneau "Événements" (liste + détail avec 6 onglets)

import {
  BriefcaseBusiness,
  CalendarDays,
  CalendarRange,
  Handshake,
  ListChecks,
  MapPin,
  ReceiptText,
  Sparkles,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import {
  EventSummary, EventDetail, EventOffer, EventOfferForm,
  LinkedBooking, EventMode,
} from './types'
import EventTabDetail   from './EventTabDetail'
import EventTabStaff    from './EventTabStaff'
import EventTabNotes    from './EventTabNotes'
import EventTabBookings from './EventTabBookings'
import EventTabOffers   from './EventTabOffers'


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
  createWithEndDate: boolean; setCreateWithEndDate: (v: boolean) => void
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
  newStaffName: string;  setNewStaffName:  (v: string) => void
  newStaffRole: string;  setNewStaffRole:  (v: string) => void
  newStaffFee: string;   setNewStaffFee:   (v: string) => void
  newStaffNotes: string; setNewStaffNotes: (v: string) => void
  addingStaff: boolean
  staffError: string
  deletingStaffId: number | null
  staffSearchResults: { id: number; avatar?: string | null; user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null; role?: string | null } | null }[]
  staffSearchLoading: boolean
  updateStaffStatus: (staffId: number, status: string) => void
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
  /* Navigation */
  onCreateNew: () => void
  /* Callbacks actions */
  fetchAllEvents: () => void
  openEventDetail: (id: number) => void
  createEvent: () => void
  deleteEvent: () => void
  saveNotes: () => void
  addExpense: (paid?: boolean) => void
  toggleExpensePaid: (id: number, paid: boolean) => void
  deleteExpense: (id: number) => void
  addPurchase: () => void
  togglePurchaseDone: (id: number, done: boolean) => void
  deletePurchase: (id: number) => void
  saveEventDetails: () => void
  addStaff: (profileId?: number, roleOverride?: string) => void
  deleteStaff: (id: number) => void
  searchStaff: (q: string) => void
  addDocument: (file: File, type: string) => void
  deleteDocument: (id: number) => void
  fetchEventDetail: (id: number) => void
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
    createWithEndDate, setCreateWithEndDate,
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
    newStaffName, setNewStaffName,
    newStaffRole, setNewStaffRole, newStaffFee, setNewStaffFee,
    newStaffNotes, setNewStaffNotes, addingStaff, staffError, deletingStaffId,
    staffSearchResults, staffSearchLoading, updateStaffStatus,
    uploadingDoc, docError, docFilter, setDocFilter,
    eventOffers, showEventOfferForm, setShowEventOfferForm,
    submittingEventOffer, eventOfferError, setEventOfferError, eventOfferForm, setEventOfferForm,
    onCreateNew,
    fetchAllEvents, openEventDetail, createEvent, deleteEvent, saveNotes,
    addExpense, toggleExpensePaid, deleteExpense,
    addPurchase, togglePurchaseDone, deletePurchase,
    saveEventDetails, addStaff, deleteStaff, searchStaff,
    addDocument, deleteDocument, fetchEventDetail,
    submitEventOffer, deleteEventOffer,
  } = p

  void newPurchaseItem; void setNewPurchaseItem; void newPurchaseQty; void setNewPurchaseQty
  void newPurchasePrice; void setNewPurchasePrice; void addingPurchase
  void addPurchase; void togglePurchaseDone; void deletePurchase; void setDocFilter

  /* ── LIST MODE — liste des événements ── */
  if (eventMode === 'list') {
    void createCategory; void setCreateCategory; void createBudget; void setCreateBudget
    void createTitle; void setCreateTitle; void createDate; void setCreateDate
    void createEndDate; void setCreateEndDate; void createStartTime; void setCreateStartTime
    void createEndTime; void setCreateEndTime; void createLieu; void setCreateLieu
    void createWithEndDate; void setCreateWithEndDate; void creating; void createError; void createEvent

    return (
      <div className="p-3 sm:p-4 space-y-2.5">
        {eventsLoading && (
          <div className="text-center py-10 text-white/30 text-sm">Chargement…</div>
        )}
        {eventsError && !eventsLoading && (
          <div className="text-center py-10 space-y-2">
            <p className="text-red-400/70 text-sm">Impossible de charger les événements.</p>
            <button onClick={fetchAllEvents} className="text-xs text-white/40 hover:text-white/60 underline transition">Réessayer</button>
          </div>
        )}
        {!eventsLoading && !eventsError && allEvents.length === 0 && (
          <div className="text-center py-12 px-4 space-y-3 rounded-2xl border border-dashed border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-cyan-500/10">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-violet-400/20 bg-violet-500/15 text-violet-300">
              <CalendarDays className="h-4 w-4" />
            </div>
            <p className="text-white/55 text-sm">Aucun événement pour l&apos;instant.</p>
            <button onClick={onCreateNew}
              className="text-xs bg-violet-500/20 border border-violet-400/30 text-violet-200 px-4 py-2 rounded-xl hover:bg-violet-500/30 transition">
              Créer mon premier événement
            </button>
          </div>
        )}
        {!eventsLoading && !eventsError && allEvents.map(ev => (
          <button key={ev.id} onClick={() => openEventDetail(ev.id)}
            className={`group relative w-full overflow-hidden text-left rounded-2xl px-3.5 py-3.5 transition border ${
              ev.id === lastCreatedId
                ? 'bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-transparent border-emerald-400/30'
                : 'bg-gradient-to-r from-violet-500/[0.09] via-indigo-500/[0.05] to-cyan-500/[0.04] border-white/10 hover:border-violet-400/25 hover:from-violet-500/[0.14]'
            }`}>
            <span className={`absolute inset-y-3 left-0 w-0.5 rounded-r-full ${ev.id === lastCreatedId ? 'bg-emerald-400' : 'bg-violet-400/70'}`} />
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-400/20 bg-violet-500/15 text-violet-200">
                <span className="text-sm font-semibold tabular-nums">
                  {new Date(ev.start).toLocaleDateString('fr-FR', { day: '2-digit' })}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white/90 group-hover:text-white">{ev.title}</p>
                  {ev.category && (
                    <span className="hidden sm:inline rounded-full border border-cyan-400/15 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200/70">
                      {ev.category}
                    </span>
                  )}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/45">
                  <span className="inline-flex items-center gap-1">
                    <CalendarRange className="h-3 w-3 text-violet-300/70" />
                    {new Date(ev.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  {ev.lieu && (
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0 text-cyan-300/70" />
                      <span className="truncate">{ev.lieu}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    )
  }

  /* ── CREATE MODE — formulaire de création ── */
  if (eventMode === 'create') {
    void createCategory; void setCreateCategory; void createBudget; void setCreateBudget
    void allEvents; void eventsLoading; void eventsError; void lastCreatedId; void fetchAllEvents; void openEventDetail

    return (
      <div className="p-3 sm:p-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-500/15 via-indigo-500/[0.07] to-cyan-500/10 rounded-2xl border border-violet-400/20 p-4 space-y-3 shadow-[0_24px_70px_-42px_rgba(139,92,246,0.9)]">
          <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-violet-500/20 blur-3xl" />

          {/* En-tête */}
          <div className="relative flex items-center gap-3 pb-1">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-violet-300/20 bg-violet-500/20 text-violet-200">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Nouvel événement</p>
              <p className="text-[11px] text-white/45">Posez les informations essentielles, vous pourrez compléter ensuite.</p>
            </div>
          </div>

          {/* Nom */}
          <div>
            <p className="text-[11px] text-white/50 mb-1.5">
              Nom de l&apos;événement <span className="text-violet-300">*</span>
            </p>
            <input
              type="text" value={createTitle} onChange={e => setCreateTitle(e.target.value)}
              placeholder="Soirée anniversaire…"
              className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/75 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
            />
          </div>

          {/* Date + Heure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] text-white/50 mb-1.5">Date <span className="text-violet-300">*</span></p>
              <input type="date" value={createDate} onChange={e => setCreateDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/75 border border-white/10 text-sm text-white outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15" />
            </div>
            <div>
              <p className="text-[11px] text-white/50 mb-1.5">Heure</p>
              <input type="text" value={createStartTime} onChange={e => setCreateStartTime(e.target.value)}
                placeholder="20:00" maxLength={5}
                className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/75 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15" />
            </div>
          </div>

          {/* Checkbox date de fin */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" checked={createWithEndDate}
              onChange={e => {
                setCreateWithEndDate(e.target.checked)
                if (!e.target.checked) { setCreateEndDate(''); setCreateEndTime('') }
              }}
              className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer" />
            <span className="text-xs text-white/50 group-hover:text-white/70 transition select-none">Ajouter une date de fin</span>
          </label>

          {createWithEndDate && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <p className="text-[11px] text-white/50 mb-1.5">Date de fin</p>
                <input type="date" value={createEndDate} onChange={e => setCreateEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/75 border border-white/10 text-sm text-white outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15" />
              </div>
              <div>
                <p className="text-[11px] text-white/50 mb-1.5">Heure de fin</p>
                <input type="text" value={createEndTime} onChange={e => setCreateEndTime(e.target.value)}
                  placeholder="23:00" maxLength={5}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/75 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15" />
              </div>
            </div>
          )}

          {/* Lieu */}
          <div>
            <p className="text-[11px] text-white/50 mb-1.5">Lieu <span className="text-violet-300">*</span></p>
            <input type="text" value={createLieu} onChange={e => setCreateLieu(e.target.value)}
              placeholder="Salle des fêtes, Paris…"
              className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/75 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15" />
          </div>

          {createError && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{createError}</p>
          )}

          <button onClick={createEvent}
            disabled={creating || !createTitle.trim() || !createDate || !createLieu.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white text-sm font-semibold disabled:opacity-40 transition shadow-[0_12px_30px_-14px_rgba(139,92,246,0.9)]">
            {creating ? 'Création…' : 'Créer l\'événement'}
          </button>
        </div>
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

  const startTime = new Date(eventDetail.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const ORGANIZER_TABS = [
    { key: 'details'  as const, label: 'Détail', icon: ListChecks },
    { key: 'staff'    as const, label: 'Personnel', icon: UsersRound },
    { key: 'notes'    as const, label: 'Dépenses', icon: ReceiptText },
    { key: 'bookings' as const, label: 'Bookings', icon: Handshake },
    { key: 'offers'   as const, label: 'Offres', icon: BriefcaseBusiness },
  ]
  const BOOKED_TABS = [
    { key: 'details'  as const, label: 'Détails', icon: ListChecks },
    { key: 'staff'    as const, label: 'Matériel', icon: UsersRound },
    { key: 'notes'    as const, label: 'Contrat', icon: ReceiptText },
    { key: 'bookings' as const, label: 'Paiement', icon: WalletCards },
  ]
  const DETAIL_TABS = isBookedEvent ? BOOKED_TABS : ORGANIZER_TABS

  const totalExpenses = eventDetail.expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const paidExpenses  = eventDetail.expenses.filter(e => e.paid).reduce((s, e) => s + (e.amount || 0), 0)
  const totalStaffFee = eventDetail.staff.reduce((s, st) => s + (st.fee || 0), 0)

  const allDocs      = eventDetail.documents || []
  const filteredDocs = docFilter === 'ALL' ? allDocs : allDocs.filter(d => d.fileType === docFilter)
  void filteredDocs

  return (
    <div className="max-h-[min(680px,76vh)] overflow-y-auto bg-[#0b0a12]/70">
      {/* En-tête événement */}
      <div className="relative overflow-hidden border-b border-violet-300/15 bg-gradient-to-br from-violet-500/25 via-indigo-500/12 to-cyan-500/10 px-4 py-4 sm:px-5">
        <div className="pointer-events-none absolute -right-10 -top-16 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-300/20 bg-violet-500/20 text-violet-100 shadow-[0_12px_36px_-18px_rgba(139,92,246,0.9)]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-semibold text-white">{eventDetail.title}</p>
              {eventDetail.category && (
                <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-100/80">
                  {eventDetail.category}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/55">
              <span className="inline-flex items-center gap-1.5">
                <CalendarRange className="h-3.5 w-3.5 text-violet-200/80" />
                {new Date(eventDetail.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {startTime !== '00:00' ? ` · ${startTime}` : ''}
              </span>
              {eventDetail.lieu && (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan-200/80" />
                  <span className="truncate">{eventDetail.lieu}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/8 bg-[#11101a]/85 px-2 py-2 sm:px-3">
        {DETAIL_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setDetailTab(tab.key)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-2 text-[11px] font-medium transition sm:px-3 ${
              detailTab === tab.key
                ? 'border-violet-400/25 bg-gradient-to-r from-violet-500/25 to-indigo-500/15 text-violet-100 shadow-[0_8px_24px_-16px_rgba(139,92,246,0.8)]'
                : 'border-transparent text-white/45 hover:border-white/8 hover:bg-white/5 hover:text-white/75'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu onglets */}
      <div className="p-3 sm:p-4 space-y-3">

        {detailTab === 'details' && (
          <EventTabDetail
            isBookedEvent={isBookedEvent}
            eventDetail={eventDetail}
            linkedBooking={linkedBooking}
            editMode={editMode} setEditMode={setEditMode}
            editTitle={editTitle} setEditTitle={setEditTitle}
            editLieu={editLieu} setEditLieu={setEditLieu}
            editCategory={editCategory} setEditCategory={setEditCategory}
            editBudget={editBudget} setEditBudget={setEditBudget}
            editStatus={editStatus} setEditStatus={setEditStatus}
            editCapacity={editCapacity} setEditCapacity={setEditCapacity}
            editDescription={editDescription} setEditDescription={setEditDescription}
            editStart={editStart} setEditStart={setEditStart}
            editStartTime={editStartTime} setEditStartTime={setEditStartTime}
            editEnd={editEnd} setEditEnd={setEditEnd}
            editEndTime={editEndTime} setEditEndTime={setEditEndTime}
            editSaving={editSaving}
            editError={editError} setEditError={setEditError}
            confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete}
            deletingEvent={deletingEvent}
            saveEventDetails={saveEventDetails}
            deleteEvent={deleteEvent}
          />
        )}

        {detailTab === 'staff' && (
          <EventTabStaff
            isBookedEvent={isBookedEvent}
            staff={eventDetail.staff}
            totalStaffFee={totalStaffFee}
            eventOffers={eventOffers}
            notesText={notesText} setNotesText={setNotesText}
            notesSaving={notesSaving}
            saveNotes={saveNotes}
            newStaffName={newStaffName} setNewStaffName={setNewStaffName}
            newStaffRole={newStaffRole} setNewStaffRole={setNewStaffRole}
            newStaffFee={newStaffFee} setNewStaffFee={setNewStaffFee}
            newStaffNotes={newStaffNotes} setNewStaffNotes={setNewStaffNotes}
            addingStaff={addingStaff}
            staffError={staffError}
            deletingStaffId={deletingStaffId}
            staffSearchResults={staffSearchResults}
            staffSearchLoading={staffSearchLoading}
            addStaff={addStaff}
            deleteStaff={deleteStaff}
            searchStaff={searchStaff}
            updateStaffStatus={updateStaffStatus}
          />
        )}

        {detailTab === 'notes' && (
          <EventTabNotes
            isBookedEvent={isBookedEvent}
            expenses={eventDetail.expenses}
            totalExpenses={totalExpenses}
            paidExpenses={paidExpenses}
            allDocs={allDocs}
            notesText={notesText} setNotesText={setNotesText}
            notesSaving={notesSaving}
            saveNotes={saveNotes}
            newExpenseLabel={newExpenseLabel} setNewExpenseLabel={setNewExpenseLabel}
            newExpenseAmount={newExpenseAmount} setNewExpenseAmount={setNewExpenseAmount}
            newExpenseCategory={newExpenseCategory} setNewExpenseCategory={setNewExpenseCategory}
            addingExpense={addingExpense}
            expenseError={expenseError}
            uploadingDoc={uploadingDoc}
            docError={docError}
            addExpense={addExpense}
            toggleExpensePaid={toggleExpensePaid}
            deleteExpense={deleteExpense}
            addDocument={addDocument}
            deleteDocument={deleteDocument}
          />
        )}

        {detailTab === 'bookings' && (
          <EventTabBookings
            isBookedEvent={isBookedEvent}
            bookingRequests={eventDetail.bookingRequests}
            linkedBooking={linkedBooking}
            allDocs={allDocs}
            uploadingDoc={uploadingDoc}
            docError={docError}
            addDocument={addDocument}
          />
        )}

        {detailTab === 'offers' && !isBookedEvent && (
          <EventTabOffers
            eventStart={eventDetail.start}
            eventLieu={eventDetail.lieu}
            eventOffers={eventOffers}
            showEventOfferForm={showEventOfferForm} setShowEventOfferForm={setShowEventOfferForm}
            submittingEventOffer={submittingEventOffer}
            eventOfferError={eventOfferError} setEventOfferError={setEventOfferError}
            eventOfferForm={eventOfferForm} setEventOfferForm={setEventOfferForm}
            submitEventOffer={submitEventOffer}
            deleteEventOffer={deleteEventOffer}
          />
        )}

      </div>
    </div>
  )
}
