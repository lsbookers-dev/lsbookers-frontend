// agenda/EventTabDetail.tsx — Onglet "Détail" du panneau événement — Concept C

import { EventDetail, LinkedBooking } from './types'
import type { ReactNode } from 'react'
import {
  CalendarDays,
  Clock3,
  FileText,
  MapPin,
  PencilLine,
  Trash2,
  UserRound,
  UsersRound,
  WalletCards,
} from 'lucide-react'


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
        <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 via-indigo-500/10 to-violet-500/10 p-3.5">
          <div className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-cyan-400/15 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
              <UserRound className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/70">Organisateur</p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                {linkedBooking?.requester?.user?.pseudo ||
                  [linkedBooking?.requester?.user?.firstName, linkedBooking?.requester?.user?.lastName].filter(Boolean).join(' ') || '?'}
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <MiniCard icon={<CalendarDays className="h-3.5 w-3.5" />} tone="violet" label="Date" value={new Date(eventDetail.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} />
          <MiniCard icon={<Clock3 className="h-3.5 w-3.5" />} tone="cyan" label="Heure" value={new Date(eventDetail.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} />
          <MiniCard icon={<MapPin className="h-3.5 w-3.5" />} tone="cyan" label="Lieu" value={eventDetail.lieu || '—'} />
          <MiniCard icon={<WalletCards className="h-3.5 w-3.5" />} tone="emerald" label="Cachet" value={linkedBooking?.fee ? `${Number(linkedBooking.fee).toLocaleString('fr-FR')} €` : '—'} />
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
      <div className="space-y-3 rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.08] via-white/[0.025] to-cyan-500/[0.05] p-3.5 sm:p-4">
        {/* Nom */}
        <div>
          <p className="text-xs text-white/55 mb-1.5">Nom de l&apos;événement <span className="text-violet-300">*</span></p>
          <input type="text" value={p.editTitle} onChange={e => p.setEditTitle(e.target.value)}
            placeholder="Soirée anniversaire…"
            className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/80 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15" />
        </div>

        {/* Date + Heure */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <p className="text-xs text-white/55 mb-1.5">Date <span className="text-violet-300">*</span></p>
            <input type="date" value={p.editStart} onChange={e => p.setEditStart(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/80 border border-white/10 text-sm text-white outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15" />
          </div>
          <div>
            <p className="text-xs text-white/55 mb-1.5">Heure</p>
            <input type="text" value={p.editStartTime} onChange={e => p.setEditStartTime(e.target.value)}
              placeholder="20:00" maxLength={5}
              className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/80 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15" />
          </div>
        </div>

        {/* Checkbox date de fin */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" checked={hasEndDate}
            onChange={e => { if (!e.target.checked) { p.setEditEnd(''); p.setEditEndTime('') } else { p.setEditEnd(p.editStart) } }}
            className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer" />
          <span className="text-xs text-white/50 group-hover:text-white/70 transition select-none">Ajouter une date de fin</span>
        </label>

        {hasEndDate && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <p className="text-[11px] text-white/50 mb-1.5">Date de fin</p>
              <input type="date" value={p.editEnd} onChange={e => p.setEditEnd(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/80 border border-white/10 text-sm text-white outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15" />
            </div>
            <div>
              <p className="text-[11px] text-white/50 mb-1.5">Heure de fin</p>
              <input type="text" value={p.editEndTime} onChange={e => p.setEditEndTime(e.target.value)}
                placeholder="23:00" maxLength={5}
                className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/80 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15" />
            </div>
          </div>
        )}

        {/* Lieu */}
        <div>
          <p className="text-[11px] text-white/50 mb-1.5">Lieu</p>
          <input type="text" value={p.editLieu} onChange={e => p.setEditLieu(e.target.value)}
            placeholder="Salle des fêtes, Paris…"
            className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/80 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15" />
        </div>

        {/* Budget */}
        <div>
          <p className="text-[11px] text-white/50 mb-1.5">Budget (€)</p>
          <input type="number" value={p.editBudget} onChange={e => p.setEditBudget(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/80 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15" />
        </div>

        {/* Description */}
        <div>
          <p className="text-[11px] text-white/50 mb-1.5">Description</p>
          <textarea value={p.editDescription} onChange={e => p.setEditDescription(e.target.value)}
            placeholder="Description de l'événement…" rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/80 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15 resize-none" />
        </div>

        {p.editError && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{p.editError}</p>}

        <div className="flex gap-2">
          <button onClick={() => { p.setEditMode(false); p.setEditError('') }}
            className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/60 text-sm hover:bg-white/10 transition">
            Annuler
          </button>
          <button onClick={p.saveEventDetails} disabled={p.editSaving || !p.editTitle.trim() || !p.editStart}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-400 disabled:opacity-40 transition">
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <MiniCard icon={<CalendarDays className="h-3.5 w-3.5" />} tone="violet" label="Date" value={dateLabel} sub={endLabel ? `→ ${endLabel}` : undefined} />
        <MiniCard icon={<Clock3 className="h-3.5 w-3.5" />} tone="cyan" label="Heure" value={startTime !== '00:00' ? startTime : '—'} />
      </div>
      {/* Lieu (pleine largeur) */}
      <MiniCard icon={<MapPin className="h-3.5 w-3.5" />} tone="cyan" label="Lieu" value={eventDetail.lieu || '—'} />

      {/* Infos secondaires */}
      {(eventDetail.budget || eventDetail.maxCapacity || eventDetail.description) && (
        <div className="space-y-2 pt-1">
          {(eventDetail.budget || eventDetail.maxCapacity) && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {eventDetail.budget && (
                <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/[0.08] px-3 py-2.5">
                  <div className="mb-1 flex items-center gap-1.5 text-emerald-200/60"><WalletCards className="h-3.5 w-3.5" /><p className="text-[10px]">Budget</p></div>
                  <p className="text-sm text-white font-semibold">{Number(eventDetail.budget).toLocaleString('fr-FR')} €</p>
                </div>
              )}
              {eventDetail.maxCapacity && (
                <div className="rounded-xl border border-violet-400/15 bg-violet-500/[0.08] px-3 py-2.5">
                  <div className="mb-1 flex items-center gap-1.5 text-violet-200/60"><UsersRound className="h-3.5 w-3.5" /><p className="text-[10px]">Capacité max</p></div>
                  <p className="text-sm text-white font-semibold">{eventDetail.maxCapacity}</p>
                </div>
              )}
            </div>
          )}
          {eventDetail.description && (
            <div className="rounded-xl border border-white/8 bg-white/[0.035] px-3 py-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-white/40"><FileText className="h-3.5 w-3.5" /><p className="text-[10px]">Description</p></div>
              <p className="text-xs text-white/75 leading-relaxed">{eventDetail.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Bouton modifier */}
      <button onClick={() => p.setEditMode(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-400/25 bg-gradient-to-r from-violet-500/20 to-indigo-500/15 py-2.5 text-xs font-medium text-violet-100 hover:from-violet-500/30 hover:to-indigo-500/25 transition">
        <PencilLine className="h-3.5 w-3.5" /> Modifier les informations
      </button>

      {/* Suppression */}
      <div className="pt-1 border-t border-white/8">
        {!p.confirmDelete ? (
          <button onClick={() => p.setConfirmDelete(true)}
            className="inline-flex w-full items-center justify-center gap-2 py-2 rounded-xl border border-red-500/20 text-red-300/65 text-xs hover:bg-red-500/10 hover:text-red-300 transition">
            <Trash2 className="h-3.5 w-3.5" /> Supprimer l&apos;événement
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
function MiniCard({ label, value, sub, icon, tone = 'violet' }: { label: string; value: string; sub?: string; icon?: ReactNode; tone?: 'violet' | 'cyan' | 'emerald' }) {
  const toneClass = tone === 'cyan'
    ? 'border-cyan-400/15 bg-cyan-500/[0.07] text-cyan-200/65'
    : tone === 'emerald'
      ? 'border-emerald-400/15 bg-emerald-500/[0.07] text-emerald-200/65'
      : 'border-violet-400/15 bg-violet-500/[0.07] text-violet-200/65'
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${toneClass}`}>
      <div className="mb-1 flex items-center gap-1.5">
        {icon}
        <p className="text-[10px]">{label}</p>
      </div>
      <p className="text-sm text-white font-semibold leading-snug">{value}</p>
      {sub && <p className="text-[10px] text-white/45 mt-0.5">{sub}</p>}
    </div>
  )
}
