// agenda/EventTabStaff.tsx — Onglet "Personnel" (organisateur) / "Matériel" (artiste)

import { StaffItem } from './types'

interface StaffSearchResult {
  id: number
  avatar?: string | null
  user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null; role?: string | null } | null
}

interface Props {
  isBookedEvent: boolean
  staff: StaffItem[]
  totalStaffFee: number
  /* Notes (vue artiste) */
  notesText: string; setNotesText: (v: string) => void
  notesSaving: boolean
  saveNotes: () => void
  /* Formulaire ajout personnel */
  newStaffRole: string;  setNewStaffRole:  (v: string) => void
  newStaffFee: string;   setNewStaffFee:   (v: string) => void
  newStaffNotes: string; setNewStaffNotes: (v: string) => void
  addingStaff: boolean
  staffError: string
  deletingStaffId: number | null
  staffAddMode: 'manual' | 'pseudo'; setStaffAddMode: (v: 'manual' | 'pseudo') => void
  staffSearchQ: string
  staffSearchResults: StaffSearchResult[]
  staffSearchLoading: boolean
  /* Actions */
  addStaff: (profileId?: number) => void
  deleteStaff: (id: number) => void
  searchStaff: (q: string) => void
}

function personName(pr: StaffItem['profile']) {
  if (!pr) return 'Non assigné'
  return pr.user?.pseudo || [pr.user?.firstName, pr.user?.lastName].filter(Boolean).join(' ') || '?'
}

export default function EventTabStaff(p: Props) {
  if (p.isBookedEvent) {
    return (
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Notes matériel / technique</p>
        <textarea
          value={p.notesText}
          onChange={e => p.setNotesText(e.target.value)}
          placeholder="Rider technique, matériel nécessaire, demandes spéciales…"
          rows={5}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40 resize-none"
        />
        <button onClick={p.saveNotes} disabled={p.notesSaving}
          className="mt-1.5 px-4 py-1.5 rounded-lg bg-violet-600/60 hover:bg-violet-600 text-white text-xs font-medium disabled:opacity-40 transition">
          {p.notesSaving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Liste personnel */}
      {p.staff.length === 0 ? (
        <p className="text-xs text-white/25 italic text-center py-2">Aucun personnel assigné</p>
      ) : (
        <div className="space-y-2">
          {p.staff.map(s => (
            <div key={s.id} className="bg-white/5 rounded-xl p-3 border border-white/8">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white">{s.role}</p>
                  <p className="text-xs text-white/50 mt-0.5">{personName(s.profile)}</p>
                  {s.fee && <p className="text-xs text-white/40">{Number(s.fee).toLocaleString('fr-FR')} €</p>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    s.status === 'BOOKED' ? 'bg-green-500/20 text-green-300'
                    : s.status === 'NEEDED' ? 'bg-yellow-500/20 text-yellow-300'
                    : 'bg-red-500/20 text-red-300'
                  }`}>
                    {s.status === 'BOOKED' ? 'Confirmé' : s.status === 'NEEDED' ? 'À pourvoir' : 'Annulé'}
                  </span>
                  <button onClick={() => p.deleteStaff(s.id)} disabled={p.deletingStaffId === s.id}
                    className="text-white/20 hover:text-red-400 transition text-xs disabled:opacity-40">✕</button>
                </div>
              </div>
              {s.notes && <p className="text-xs text-white/40 mt-1 italic">{s.notes}</p>}
            </div>
          ))}
          {p.totalStaffFee > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-white/[0.03] rounded-xl border border-white/8">
              <span className="text-xs text-white/40">Total salaires</span>
              <span className="text-xs font-semibold text-white">{p.totalStaffFee.toLocaleString('fr-FR')} €</span>
            </div>
          )}
        </div>
      )}

      {/* Formulaire ajout personnel */}
      <div className="bg-white/[0.03] rounded-xl border border-white/8 p-3 space-y-2">
        <div className="flex gap-1 mb-2">
          <button onClick={() => p.setStaffAddMode('manual')}
            className={`flex-1 py-1 rounded-lg text-xs font-medium transition ${
              p.staffAddMode === 'manual' ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}>
            Manuel
          </button>
          <button onClick={() => p.setStaffAddMode('pseudo')}
            className={`flex-1 py-1 rounded-lg text-xs font-medium transition ${
              p.staffAddMode === 'pseudo' ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}>
            @Pseudo
          </button>
        </div>
        <input type="text" value={p.newStaffRole} onChange={e => p.setNewStaffRole(e.target.value)}
          placeholder="Rôle / Poste *"
          className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
        <div className="flex gap-2">
          <input type="number" value={p.newStaffFee} onChange={e => p.setNewStaffFee(e.target.value)}
            placeholder="Salaire (€)"
            className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
          <input type="text" value={p.newStaffNotes} onChange={e => p.setNewStaffNotes(e.target.value)}
            placeholder="Notes"
            className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
        </div>
        {p.staffAddMode === 'pseudo' && (
          <div className="relative">
            <input type="text" value={p.staffSearchQ} onChange={e => p.searchStaff(e.target.value)}
              placeholder="Rechercher par @pseudo…"
              className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
            {p.staffSearchLoading && <p className="text-[10px] text-white/30 mt-1">Recherche…</p>}
            {p.staffSearchResults.length > 0 && (
              <div className="mt-1 bg-neutral-800 border border-white/10 rounded-xl overflow-hidden">
                {p.staffSearchResults.map(r => (
                  <button key={r.id} type="button"
                    onClick={() => p.addStaff(r.id)}
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
        {p.staffError && <p className="text-xs text-red-400">{p.staffError}</p>}
        {p.staffAddMode === 'manual' && (
          <button onClick={() => p.addStaff()} disabled={p.addingStaff || !p.newStaffRole.trim()}
            className="w-full py-1.5 rounded-lg bg-violet-600/60 hover:bg-violet-600 text-white text-xs font-medium disabled:opacity-40 transition">
            {p.addingStaff ? 'Ajout…' : '+ Ajouter'}
          </button>
        )}
      </div>
    </div>
  )
}
