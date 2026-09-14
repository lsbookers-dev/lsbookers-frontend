// agenda/EventTabStaff.tsx — Onglet Personnel (2 colonnes)

import { useState, useEffect } from 'react'
import { EventOffer, StaffItem } from './types'

interface StaffSearchResult {
  id: number
  avatar?: string | null
  user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null; role?: string | null } | null
}

interface Props {
  isBookedEvent: boolean
  staff: StaffItem[]
  totalStaffFee: number
  eventOffers: EventOffer[]
  /* Notes (vue artiste) */
  notesText: string; setNotesText: (v: string) => void
  notesSaving: boolean
  saveNotes: () => void
  /* Formulaire ajout personnel */
  newStaffName: string; setNewStaffName: (v: string) => void
  newStaffRole: string;  setNewStaffRole:  (v: string) => void
  newStaffFee: string;   setNewStaffFee:   (v: string) => void
  newStaffNotes: string; setNewStaffNotes: (v: string) => void
  addingStaff: boolean
  staffError: string
  deletingStaffId: number | null
  staffSearchResults: StaffSearchResult[]
  staffSearchLoading: boolean
  /* Actions */
  addStaff: (profileId?: number, roleOverride?: string) => void
  deleteStaff: (id: number) => void
  searchStaff: (q: string) => void
  updateStaffStatus: (staffId: number, status: string) => void
}

function personName(s: StaffItem) {
  if (s.name) return s.name
  if (!s.profile) return 'Non assigné'
  const pr = s.profile
  return pr.user?.pseudo || [pr.user?.firstName, pr.user?.lastName].filter(Boolean).join(' ') || '?'
}

export default function EventTabStaff(p: Props) {
  /* ── Profil sélectionné via @ ── */
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null)

  // Reset quand le formulaire est vidé après un ajout réussi
  useEffect(() => {
    if (!p.newStaffName) setSelectedProfileId(null)
  }, [p.newStaffName])

  /* ── Vue artiste/prestataire booké ── */
  if (p.isBookedEvent) {
    return (
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Notes matériel / technique</p>
        <textarea
          value={p.notesText}
          onChange={e => p.setNotesText(e.target.value)}
          placeholder="Rider technique, matériel nécessaire, demandes spéciales…"
          rows={5}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-emerald-500/40 resize-none"
        />
        <button onClick={p.saveNotes} disabled={p.notesSaving}
          className="mt-1.5 px-4 py-1.5 rounded-lg bg-emerald-600/60 hover:bg-emerald-600 text-white text-xs font-medium disabled:opacity-40 transition">
          {p.notesSaving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </div>
    )
  }

  const isSearchMode = p.newStaffName.startsWith('@')

  const handleNameChange = (val: string) => {
    p.setNewStaffName(val)
    setSelectedProfileId(null) // réinitialise la sélection si l'utilisateur retape
    if (val.startsWith('@')) {
      p.searchStaff(val.slice(1))
    } else {
      p.searchStaff('')
    }
  }

  const handleSelectResult = (r: { id: number; avatar?: string | null; user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null; role?: string | null } | null }) => {
    const displayName = r.user?.pseudo || [r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ') || ''
    p.setNewStaffName(displayName)
    setSelectedProfileId(r.id)
    p.searchStaff('') // ferme la dropdown
  }

  return (
    <div className="grid grid-cols-2 gap-3">

      {/* ── Colonne gauche — Formulaire ── */}
      <div className="space-y-2">
        <p className="text-[10px] text-white/30 uppercase tracking-wide mb-1">Ajouter un membre</p>

        {/* Nom / @pseudo — unique champ, détecte @ */}
        <div className="relative">
          <input
            type="text"
            value={p.newStaffName}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="Nom ou @pseudo"
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-emerald-500/40"
          />
          {/* Dropdown recherche */}
          {isSearchMode && (p.staffSearchLoading || p.staffSearchResults.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden z-10 shadow-xl">
              {p.staffSearchLoading && (
                <p className="text-[10px] text-white/30 px-3 py-2">Recherche…</p>
              )}
              {p.staffSearchResults.map(r => (
                <button key={r.id} type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => handleSelectResult(r)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition text-left">
                  {r.avatar && (
                    <img src={r.avatar} className="h-6 w-6 rounded-full object-cover shrink-0" alt="" />
                  )}
                  <div>
                    <p className="text-xs text-white">
                      {r.user?.pseudo || [r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ')}
                    </p>
                    <p className="text-[10px] text-white/30">{r.user?.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Poste */}
        <input
          type="text"
          value={p.newStaffRole}
          onChange={e => p.setNewStaffRole(e.target.value)}
          placeholder="Poste / Rôle *"
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-emerald-500/40"
        />

        {/* Salaire */}
        <input
          type="text"
          inputMode="decimal"
          value={p.newStaffFee}
          onChange={e => p.setNewStaffFee(e.target.value)}
          placeholder="Salaire (€)"
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-emerald-500/40"
        />

        {/* Note */}
        <input
          type="text"
          value={p.newStaffNotes}
          onChange={e => p.setNewStaffNotes(e.target.value)}
          placeholder="Note"
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-emerald-500/40"
        />

        {p.staffError && (
          <p className="text-[10px] text-red-400">{p.staffError}</p>
        )}

        <button
          onClick={() => p.addStaff(selectedProfileId ?? undefined)}
          disabled={p.addingStaff || !p.newStaffRole.trim() || isSearchMode}
          className="w-full py-2 rounded-xl bg-emerald-600/70 hover:bg-emerald-600 text-white text-xs font-medium disabled:opacity-40 transition"
        >
          {p.addingStaff ? 'Ajout…' : '+ Ajouter'}
        </button>
      </div>

      {/* ── Colonne droite — Équipe ── */}
      <div className="space-y-2">
        <p className="text-[10px] text-white/30 uppercase tracking-wide mb-1">Équipe</p>

        {p.staff.length === 0 && p.eventOffers.length === 0 && (
          <p className="text-[10px] text-white/20 italic text-center py-6">Aucun membre</p>
        )}

        {/* Membres existants */}
        {p.staff.map(s => (
          <div key={s.id} className="bg-white/4 rounded-xl p-2.5 border border-white/8">
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{personName(s)}</p>
                <p className="text-[10px] text-white/40 truncate">{s.role}</p>
                {s.fee != null && (
                  <p className="text-[10px] text-white/30">{Number(s.fee).toLocaleString('fr-FR')} €</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {/* Plateforme → badge statique */}
                {s.profile ? (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                    s.status === 'BOOKED'    ? 'bg-emerald-500/20 text-emerald-300'
                    : s.status === 'NEEDED' ? 'bg-yellow-500/20 text-yellow-300'
                    : 'bg-red-500/20 text-red-300'
                  }`}>
                    {s.status === 'BOOKED' ? 'Confirmé' : s.status === 'NEEDED' ? 'À pourvoir' : 'Annulé'}
                  </span>
                ) : (
                  /* Manuel → dropdown modifiable avec code couleur */
                  <select
                    value={s.status}
                    onChange={e => p.updateStaffStatus(s.id, e.target.value)}
                    className={`text-[9px] rounded-full outline-none px-1.5 py-0.5 cursor-pointer font-medium border ${
                      s.status === 'BOOKED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : s.status === 'NEEDED'
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}
                  >
                    <option value="BOOKED">Confirmé</option>
                    <option value="NEEDED">À confirmer</option>
                    <option value="CANCELLED">Annulé</option>
                  </select>
                )}
                <button
                  onClick={() => p.deleteStaff(s.id)}
                  disabled={p.deletingStaffId === s.id}
                  className="text-white/20 hover:text-red-400 transition text-[10px] disabled:opacity-40"
                >✕</button>
              </div>
            </div>
            {s.notes && (
              <p className="text-[9px] text-white/30 mt-1 italic truncate">{s.notes}</p>
            )}
          </div>
        ))}

        {/* Offres publiées — slots "À pourvoir" */}
        {p.eventOffers.map(offer => (
          <div key={`offer-${offer.id}`} className="bg-white/[0.02] rounded-xl p-2.5 border border-dashed border-white/10">
            <div className="flex items-center justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-white/50 truncate">{offer.title}</p>
                {offer.fee != null && (
                  <p className="text-[10px] text-white/25">{Number(offer.fee).toLocaleString('fr-FR')} €</p>
                )}
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/35 whitespace-nowrap border border-white/8">
                À pourvoir
              </span>
            </div>
          </div>
        ))}

        {/* Total salaires */}
        {p.totalStaffFee > 0 && (
          <div className="flex items-center justify-between px-2.5 py-2 bg-white/[0.02] rounded-xl border border-white/6 mt-1">
            <span className="text-[10px] text-white/30">Total salaires</span>
            <span className="text-[10px] font-semibold text-white/70">{p.totalStaffFee.toLocaleString('fr-FR')} €</span>
          </div>
        )}
      </div>

    </div>
  )
}
