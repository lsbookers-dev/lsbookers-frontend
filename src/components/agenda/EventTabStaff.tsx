// agenda/EventTabStaff.tsx — Onglet Personnel (2 colonnes)

import { useState, useEffect } from 'react'
import { EventOffer, StaffItem } from './types'
import {
  BadgeEuro,
  BriefcaseBusiness,
  Plus,
  Save,
  Search,
  Trash2,
  UserPlus,
  UsersRound,
  Wrench,
} from 'lucide-react'

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
      <div className="rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-cyan-500/10 via-indigo-500/[0.06] to-violet-500/10 p-3.5 sm:p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
            <Wrench className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/85">Matériel et technique</p>
            <p className="text-[10px] text-white/40">Centralisez votre rider et vos demandes particulières.</p>
          </div>
        </div>
        <textarea
          value={p.notesText}
          onChange={e => p.setNotesText(e.target.value)}
          placeholder="Rider technique, matériel nécessaire, demandes spéciales…"
          rows={5}
          className="w-full bg-[#11101a]/80 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/15 resize-none"
        />
        <button onClick={p.saveNotes} disabled={p.notesSaving}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white text-xs font-medium disabled:opacity-40 transition">
          <Save className="h-3.5 w-3.5" /> {p.notesSaving ? 'Sauvegarde…' : 'Sauvegarder'}
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">

      {/* ── Colonne gauche — Formulaire ── */}
      <div className="space-y-2 rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.09] via-indigo-500/[0.05] to-transparent p-3">
        <div className="mb-2 flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl border border-violet-300/20 bg-violet-500/15 text-violet-200">
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/85">Ajouter un membre</p>
            <p className="text-[10px] text-white/40">Invitez un profil ou ajoutez un contact.</p>
          </div>
        </div>

        {/* Nom / @pseudo — unique champ, détecte @ */}
        <div className="relative">
          <input
            type="text"
            value={p.newStaffName}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="Nom ou @pseudo"
            className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#11101a]/80 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-violet-200/45" />
          {/* Dropdown recherche */}
          {isSearchMode && (p.staffSearchLoading || p.staffSearchResults.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#12111c] border border-violet-400/20 rounded-xl overflow-hidden z-10 shadow-2xl shadow-violet-950/40">
              {p.staffSearchLoading && (
                <p className="text-[10px] text-white/30 px-3 py-2">Recherche…</p>
              )}
              {p.staffSearchResults.map(r => (
                <button key={r.id} type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => handleSelectResult(r)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-violet-500/10 transition text-left">
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
          className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/80 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
        />

        {/* Salaire */}
        <input
          type="text"
          inputMode="decimal"
          value={p.newStaffFee}
          onChange={e => p.setNewStaffFee(e.target.value)}
          placeholder="Salaire (€)"
          className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/80 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
        />

        {/* Note */}
        <input
          type="text"
          value={p.newStaffNotes}
          onChange={e => p.setNewStaffNotes(e.target.value)}
          placeholder="Note"
          className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/80 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
        />

        {p.staffError && (
          <p className="text-[10px] text-red-400">{p.staffError}</p>
        )}

        <button
          onClick={() => p.addStaff(selectedProfileId ?? undefined)}
          disabled={p.addingStaff || !p.newStaffRole.trim() || isSearchMode}
          className="inline-flex w-full items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white text-xs font-medium disabled:opacity-40 transition"
        >
          <Plus className="h-3.5 w-3.5" /> {p.addingStaff ? 'Ajout…' : 'Ajouter'}
        </button>
      </div>

      {/* ── Colonne droite — Équipe ── */}
      <div className="space-y-2 rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-cyan-500/[0.07] via-white/[0.025] to-transparent p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
              <UsersRound className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/85">Équipe</p>
              <p className="text-[10px] text-white/40">{p.staff.length} membre{p.staff.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {p.staff.length === 0 && p.eventOffers.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-7 text-center">
            <UsersRound className="mx-auto mb-2 h-5 w-5 text-white/15" />
            <p className="text-[11px] text-white/30">Aucun membre pour le moment</p>
          </div>
        )}

        {/* Membres existants */}
        {p.staff.map(s => (
          <div key={s.id} className="rounded-xl border border-white/8 bg-[#12111b]/75 p-2.5 transition hover:border-cyan-400/15 hover:bg-cyan-500/[0.04]">
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{personName(s)}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/45 truncate"><BriefcaseBusiness className="h-3 w-3 shrink-0 text-cyan-300/55" />{s.role}</p>
                {s.fee != null && (
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-200/60"><BadgeEuro className="h-3 w-3" />{Number(s.fee).toLocaleString('fr-FR')} €</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {/* Plateforme → badge statique */}
                {s.profile ? (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                    s.status === 'BOOKED'   ? 'bg-emerald-500/20 text-emerald-300'
                    : s.status === 'PENDING' ? 'bg-violet-500/20 text-violet-300'
                    : s.status === 'NEEDED' ? 'bg-yellow-500/20 text-yellow-300'
                    : 'bg-red-500/20 text-red-300'
                  }`}>
                    {s.status === 'BOOKED' ? 'Confirmé' : s.status === 'PENDING' ? 'En attente' : s.status === 'NEEDED' ? 'À pourvoir' : 'Annulé'}
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
                    className="grid h-6 w-6 place-items-center rounded-lg text-white/25 hover:bg-red-500/10 hover:text-red-300 transition disabled:opacity-40"
                    title="Supprimer"
                ><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
            {s.notes && (
              <p className="text-[9px] text-white/30 mt-1 italic truncate">{s.notes}</p>
            )}
          </div>
        ))}

        {/* Offres publiées — slots "À pourvoir" */}
        {p.eventOffers.map(offer => (
          <div key={`offer-${offer.id}`} className="bg-amber-500/[0.04] rounded-xl p-2.5 border border-dashed border-amber-300/15">
            <div className="flex items-center justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-white/60 truncate">{offer.title}</p>
                {offer.fee != null && (
                  <p className="text-[10px] text-white/25">{Number(offer.fee).toLocaleString('fr-FR')} €</p>
                )}
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-200/65 whitespace-nowrap border border-amber-300/15">
                À pourvoir
              </span>
            </div>
          </div>
        ))}

        {/* Total salaires */}
        {p.totalStaffFee > 0 && (
          <div className="flex items-center justify-between px-2.5 py-2.5 bg-emerald-500/[0.06] rounded-xl border border-emerald-400/15 mt-1">
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-100/55"><BadgeEuro className="h-3.5 w-3.5" />Total salaires</span>
            <span className="text-xs font-semibold text-emerald-100/85">{p.totalStaffFee.toLocaleString('fr-FR')} €</span>
          </div>
        )}
      </div>

    </div>
  )
}
