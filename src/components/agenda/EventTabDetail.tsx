// agenda/EventTabDetail.tsx — Onglet "Détail" du panneau événement — Concept C

import { EventDetail, LinkedBooking } from './types'


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
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 space-y-1.5">
          <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wide">Organisateur</p>
          <p className="text-sm font-medium text-white">
            {linkedBooking?.requester?.user?.pseudo ||
              [linkedBooking?.requester?.user?.firstName, linkedBooking?.requester?.user?.lastName].filter(Boolean).join(' ') || '?'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MiniCard label="Date" value={new Date(eventDetail.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} />
          <MiniCard label="Heure" value={new Date(eventDetail.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} />
          <MiniCard label="Lieu" value={eventDetail.lieu || '—'} />
          <MiniCard label="Cachet" value={linkedBooking?.fee ? `${Number(linkedBooking.fee).toLocaleString('fr-FR')} €` : '—'} />
        </div>
      </div>
    )
  }

  if (p.editMode) {
    void p.editCategory; void p.setEditCategory
    void p.editStatus; void p.setEditStatus
    void p.editCapacity; void p.setEditCapacity

    const hasEndDate = p.editEnd !== ''

    return (
      <div className="space-y-3">
        {/* Nom */}
        <div>
          <p className="text-[11px] text-white/50 mb-1.5">Nom de l&apos;événement <span className="text-green-400">*</span></p>
          <input type="text" value={p.editTitle} onChange={e => p.setEditTitle(e.target.value)}
            placeholder="Soirée anniversaire…"
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-emerald-500/40" />
        </div>

        {/* Date + Heure */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[11px] text-white/50 mb-1.5">Date <span className="text-green-400">*</span></p>
            <input type="date" value={p.editStart} onChange={e => p.setEditStart(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/40" />
          </div>
          <div>
            <p className="text-[11px] text-white/50 mb-1.5">Heure</p>
            <input type="text" value={p.editStartTime} onChange={e => p.setEditStartTime(e.target.value)}
              placeholder="20:00" maxLength={5}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-emerald-500/40" />
          </div>
        </div>

        {/* Checkbox date de fin */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" checked={hasEndDate}
            onChange={e => { if (!e.target.checked) { p.setEditEnd(''); p.setEditEndTime('') } else { p.setEditEnd(p.editStart) } }}
            className="w-3.5 h-3.5 rounded accent-green-500 cursor-pointer" />
          <span className="text-xs text-white/50 group-hover:text-white/70 transition select-none">Ajouter une date de fin</span>
        </label>

        {hasEndDate && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] text-white/50 mb-1.5">Date de fin</p>
              <input type="date" value={p.editEnd} onChange={e => p.setEditEnd(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/40" />
            </div>
            <div>
              <p className="text-[11px] text-white/50 mb-1.5">Heure de fin</p>
              <input type="text" value={p.editEndTime} onChange={e => p.setEditEndTime(e.target.value)}
                placeholder="23:00" maxLength={5}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-emerald-500/40" />
            </div>
          </div>
        )}

        {/* Lieu */}
        <div>
          <p className="text-[11px] text-white/50 mb-1.5">Lieu</p>
          <input type="text" value={p.editLieu} onChange={e => p.setEditLieu(e.target.value)}
            placeholder="Salle des fêtes, Paris…"
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-emerald-500/40" />
        </div>

        {/* Budget */}
        <div>
          <p className="text-[11px] text-white/50 mb-1.5">Budget (€)</p>
          <input type="number" value={p.editBudget} onChange={e => p.setEditBudget(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-emerald-500/40" />
        </div>

        {/* Description */}
        <div>
          <p className="text-[11px] text-white/50 mb-1.5">Description</p>
          <textarea value={p.editDescription} onChange={e => p.setEditDescription(e.target.value)}
            placeholder="Description de l'événement…" rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-emerald-500/40 resize-none" />
        </div>

        {p.editError && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{p.editError}</p>}

        <div className="flex gap-2">
          <button onClick={() => { p.setEditMode(false); p.setEditError('') }}
            className="flex-1 py-2.5 rounded-xl bg-white/10 text-white/60 text-sm hover:bg-white/15 transition">
            Annuler
          </button>
          <button onClick={p.saveEventDetails} disabled={p.editSaving || !p.editTitle.trim() || !p.editStart}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-40 transition">
            {p.editSaving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    )
  }

  // — Vue mode — Concept C
  const startDate = new Date(eventDetail.start)
  const startTime = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const dateLabel = startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const endLabel = eventDetail.end
    ? new Date(eventDetail.end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : null

  return (
    <div className="space-y-3">
      {/* Date + Heure */}
      <div className="grid grid-cols-2 gap-2">
        <MiniCard label="Date" value={dateLabel} sub={endLabel ? `→ ${endLabel}` : undefined} />
        <MiniCard label="Heure" value={startTime !== '00:00' ? startTime : '—'} />
      </div>
      {/* Lieu (pleine largeur) */}
      <MiniCard label="Lieu" value={eventDetail.lieu || '—'} />

      {/* Infos secondaires */}
      {(eventDetail.budget || eventDetail.maxCapacity || eventDetail.description) && (
        <div className="space-y-2 pt-1">
          {(eventDetail.budget || eventDetail.maxCapacity) && (
            <div className="flex gap-2">
              {eventDetail.budget && (
                <div className="flex-1 bg-white/4 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-white/35 mb-0.5">Budget</p>
                  <p className="text-xs text-white font-medium">{Number(eventDetail.budget).toLocaleString('fr-FR')} €</p>
                </div>
              )}
              {eventDetail.maxCapacity && (
                <div className="flex-1 bg-white/4 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-white/35 mb-0.5">Capacité max</p>
                  <p className="text-xs text-white font-medium">{eventDetail.maxCapacity}</p>
                </div>
              )}
            </div>
          )}
          {eventDetail.description && (
            <div className="bg-white/4 rounded-xl px-3 py-2.5">
              <p className="text-[10px] text-white/35 mb-1">Description</p>
              <p className="text-xs text-white/70 leading-relaxed">{eventDetail.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Bouton modifier */}
      <button onClick={() => p.setEditMode(true)}
        className="w-full py-2.5 rounded-xl bg-emerald-600/15 border border-emerald-500/25 text-emerald-400 text-xs font-medium hover:bg-emerald-600/25 transition">
        Modifier les informations
      </button>

      {/* Suppression */}
      <div className="pt-1 border-t border-white/8">
        {!p.confirmDelete ? (
          <button onClick={() => p.setConfirmDelete(true)}
            className="w-full py-2 rounded-xl border border-red-500/20 text-red-400/70 text-xs hover:bg-red-500/10 hover:text-red-400 transition">
            Supprimer l&apos;événement
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

// Composant mini-carte réutilisable
function MiniCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/4 rounded-xl px-3 py-2.5">
      <p className="text-[10px] text-white/35 mb-0.5">{label}</p>
      <p className="text-xs text-white font-medium leading-snug">{value}</p>
      {sub && <p className="text-[10px] text-white/40 mt-0.5">{sub}</p>}
    </div>
  )
}
