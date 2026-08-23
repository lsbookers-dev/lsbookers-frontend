// agenda/EventPanel.tsx — Panneau "Événements" (liste + détail avec 6 onglets)

import {
  EventSummary, EventDetail, EventOffer, EventOfferForm,
  LinkedBooking, EventMode,
} from './types'
import EventTabDetail    from './EventTabDetail'
import EventTabStaff     from './EventTabStaff'
import EventTabNotes     from './EventTabNotes'
import EventTabPurchases from './EventTabPurchases'
import EventTabBookings  from './EventTabBookings'
import EventTabOffers    from './EventTabOffers'

const CATEGORIES   = ['Club', 'Mariage', 'Corporate', 'Festival', 'Concert', 'Privé', 'Autre']
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
    submittingEventOffer, eventOfferError, setEventOfferError, eventOfferForm, setEventOfferForm,
    fetchAllEvents, openEventDetail, createEvent, deleteEvent, saveNotes,
    addExpense, toggleExpensePaid, deleteExpense,
    addPurchase, togglePurchaseDone, deletePurchase,
    saveEventDetails, addStaff, deleteStaff, searchStaff,
    addDocument, deleteDocument, fetchEventDetail,
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
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] text-white/35">Date fin <span className="text-white/20">(optionnel)</span></p>
                {createEndDate && (
                  <button onClick={() => { setCreateEndDate(''); setCreateEndTime('') }} className="text-[10px] text-white/30 hover:text-white/60 transition">✕ effacer</button>
                )}
              </div>
              <input type="date" value={createEndDate} onChange={e => setCreateEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:ring-1 focus:ring-green-500/40" />
            </div>
            <div>
              <p className="text-[10px] text-white/35 mb-1">Heure fin <span className="text-white/20">(optionnel)</span></p>
              <input type="time" value={createEndTime} onChange={e => setCreateEndTime(e.target.value)}
                disabled={!createEndDate}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:ring-1 focus:ring-green-500/40 disabled:opacity-30" />
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

      {/* Contenu onglets */}
      <div className="p-4 space-y-3">

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
            notesText={notesText} setNotesText={setNotesText}
            notesSaving={notesSaving}
            saveNotes={saveNotes}
            newStaffRole={newStaffRole} setNewStaffRole={setNewStaffRole}
            newStaffFee={newStaffFee} setNewStaffFee={setNewStaffFee}
            newStaffNotes={newStaffNotes} setNewStaffNotes={setNewStaffNotes}
            addingStaff={addingStaff}
            staffError={staffError}
            deletingStaffId={deletingStaffId}
            staffAddMode={staffAddMode} setStaffAddMode={setStaffAddMode}
            staffSearchQ={staffSearchQ}
            staffSearchResults={staffSearchResults}
            staffSearchLoading={staffSearchLoading}
            addStaff={addStaff}
            deleteStaff={deleteStaff}
            searchStaff={searchStaff}
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

        {detailTab === 'purchases' && (
          <EventTabPurchases
            isBookedEvent={isBookedEvent}
            purchases={eventDetail.purchases}
            allDocs={allDocs}
            newPurchaseItem={newPurchaseItem} setNewPurchaseItem={setNewPurchaseItem}
            newPurchaseQty={newPurchaseQty} setNewPurchaseQty={setNewPurchaseQty}
            newPurchasePrice={newPurchasePrice} setNewPurchasePrice={setNewPurchasePrice}
            addingPurchase={addingPurchase}
            uploadingDoc={uploadingDoc}
            docError={docError}
            addPurchase={addPurchase}
            togglePurchaseDone={togglePurchaseDone}
            deletePurchase={deletePurchase}
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
            filteredDocs={filteredDocs}
            docFilter={docFilter} setDocFilter={setDocFilter}
            uploadingDoc={uploadingDoc}
            docError={docError}
            addDocument={addDocument}
            deleteDocument={deleteDocument}
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
