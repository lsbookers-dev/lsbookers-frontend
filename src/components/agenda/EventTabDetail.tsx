// agenda/EventTabDetail.tsx — Onglet "Détail" du panneau événement

import { EventDetail, LinkedBooking } from './types'

const CATEGORIES   = ['Club', 'Mariage', 'Corporate', 'Festival', 'Concert', 'Privé', 'Autre']
const STATUS_LABEL: Record<string, string> = { DRAFT: 'Brouillon', PUBLISHED: 'Publié', CANCELLED: 'Annulé', COMPLETED: 'Terminé' }

interface Props {
  isBookedEvent: boolean
  eventDetail: EventDetail
  linkedBooking: LinkedBooking | null
  /* Edit mode */
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
  /* Delete */
  confirmDelete: boolean; setConfirmDelete: (v: boolean) => void
  deletingEvent: boolean
  /* Actions */
  saveEventDetails: () => void
  deleteEvent: () => void
}

export default function EventTabDetail(p: Props) {
  const { isBookedEvent, eventDetail, linkedBooking } = p

  if (isBookedEvent) {
    return (
      <div className="space-y-3">
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 space-y-1.5">
          <p className="text-[10px] text-violet-300 font-medium uppercase tracking-wide">Organisateur</p>
          <p className="text-sm font-medium text-white">
            {linkedBooking?.requester?.user?.pseudo ||
              [linkedBooking?.requester?.user?.firstName, linkedBooking?.requester?.user?.lastName].filter(Boolean).join(' ') || '?'}
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
      </div>
    )
  }

  if (p.editMode) {
    return (
      <div className="space-y-2">
        <input type="text" value={p.editTitle} onChange={e => p.setEditTitle(e.target.value)}
          placeholder="Titre *"
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-white/35 mb-1">Date début *</p>
            <input type="date" value={p.editStart} onChange={e => p.setEditStart(e.target.value)}
              className="w-full px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none" />
          </div>
          <div>
            <p className="text-[10px] text-white/35 mb-1">Heure début</p>
            <input type="time" value={p.editStartTime} onChange={e => p.setEditStartTime(e.target.value)}
              className="w-full px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-white/35">Date fin <span className="text-white/20">(optionnel)</span></p>
              {p.editEnd && (
                <button onClick={() => { p.setEditEnd(''); p.setEditEndTime('') }} className="text-[10px] text-white/30 hover:text-white/60 transition">✕ effacer</button>
              )}
            </div>
            <input type="date" value={p.editEnd} onChange={e => p.setEditEnd(e.target.value)}
              className="w-full px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none" />
          </div>
          <div>
            <p className="text-[10px] text-white/35 mb-1">Heure fin <span className="text-white/20">(optionnel)</span></p>
            <input type="time" value={p.editEndTime} onChange={e => p.setEditEndTime(e.target.value)}
              disabled={!p.editEnd}
              className="w-full px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none disabled:opacity-30" />
          </div>
        </div>
        <input type="text" value={p.editLieu} onChange={e => p.setEditLieu(e.target.value)}
          placeholder="Lieu"
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40" />
        <div className="grid grid-cols-2 gap-2">
          <select value={p.editCategory} onChange={e => p.setEditCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none">
            <option value="">Catégorie…</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={p.editStatus} onChange={e => p.setEditStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none">
            <option value="DRAFT">Brouillon</option>
            <option value="PUBLISHED">Publié</option>
            <option value="COMPLETED">Terminé</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" value={p.editBudget} onChange={e => p.setEditBudget(e.target.value)}
            placeholder="Budget (€)"
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 outline-none" />
          <input type="number" value={p.editCapacity} onChange={e => p.setEditCapacity(e.target.value)}
            placeholder="Capacité max"
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 outline-none" />
        </div>
        <textarea value={p.editDescription} onChange={e => p.setEditDescription(e.target.value)}
          placeholder="Description…" rows={3}
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40 resize-none" />
        {p.editError && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{p.editError}</p>}
        <div className="flex gap-2">
          <button onClick={() => { p.setEditMode(false); p.setEditError('') }}
            className="flex-1 py-2 rounded-xl bg-white/10 text-white/60 text-xs hover:bg-white/15 transition">
            Annuler
          </button>
          <button onClick={p.saveEventDetails} disabled={p.editSaving || !p.editTitle.trim() || !p.editStart}
            className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 disabled:opacity-40 transition">
            {p.editSaving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
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
      <button onClick={() => p.setEditMode(true)}
        className="w-full py-2 rounded-xl border border-white/15 text-white/60 text-xs hover:bg-white/8 transition mt-1">
        ✏️ Modifier les informations
      </button>

      <div className="pt-3 border-t border-white/8 mt-3">
        {!p.confirmDelete ? (
          <button onClick={() => p.setConfirmDelete(true)}
            className="w-full py-2 rounded-xl border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition">
            🗑 Supprimer l&apos;événement
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-red-400 text-center">Supprimer définitivement ?</p>
            <div className="flex gap-2">
              <button onClick={() => p.setConfirmDelete(false)}
                className="flex-1 py-2 rounded-xl bg-white/10 text-white/60 text-xs hover:bg-white/15 transition">
                Annuler
              </button>
              <button onClick={p.deleteEvent} disabled={p.deletingEvent}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-500 disabled:opacity-50 transition">
                {p.deletingEvent ? 'Suppression…' : 'Confirmer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
