// agenda/EventTabNotes.tsx — Onglet "Dépenses" (2 colonnes : formulaire + liste groupée)

import { useState } from 'react'
import { ExpenseItem, DocumentItem } from './types'
import { DocumentsSection } from './helpers'

interface Props {
  isBookedEvent: boolean
  expenses: ExpenseItem[]
  totalExpenses: number
  paidExpenses: number
  allDocs: DocumentItem[]
  /* Notes (conservées pour compatibilité, non affichées ici) */
  notesText: string; setNotesText: (v: string) => void
  notesSaving: boolean
  saveNotes: () => void
  /* Formulaire dépense */
  newExpenseLabel: string;    setNewExpenseLabel:    (v: string) => void
  newExpenseAmount: string;   setNewExpenseAmount:   (v: string) => void
  newExpenseCategory: string; setNewExpenseCategory: (v: string) => void
  addingExpense: boolean
  expenseError: string
  /* Documents */
  uploadingDoc: boolean
  docError: string
  /* Actions */
  addExpense: (paid?: boolean) => void
  toggleExpensePaid: (id: number, paid: boolean) => void
  deleteExpense: (id: number) => void
  addDocument: (file: File, type: string) => void
  deleteDocument: (id: number) => void
}

export default function EventTabNotes(p: Props) {
  /* ── État local : statut payé dans le formulaire ── */
  const [newPaid, setNewPaid] = useState(false)

  /* Vue artiste/prestataire booké → contrat uniquement */
  if (p.isBookedEvent) {
    return (
      <DocumentsSection
        docs={p.allDocs.filter(d => d.fileType === 'CONTRACT')}
        docType="CONTRACT"
        label="Contrat"
        uploadingDoc={p.uploadingDoc}
        docError={p.docError}
        addDocument={p.addDocument}
        deleteDocument={p.deleteDocument}
      />
    )
  }

  /* ── Catégories connues (pour suggestions) ── */
  const knownCats = Array.from(
    new Set(p.expenses.map(e => e.category).filter((c): c is string => !!c))
  )

  /* ── Groupement des dépenses ── */
  const anyHasCategory = p.expenses.some(e => e.category)

  type Group = { cat: string | null; items: ExpenseItem[] }
  const grouped: Group[] = []

  if (!anyHasCategory) {
    // Pas de catégories → liste plate
    grouped.push({ cat: null, items: p.expenses })
  } else {
    const catOrder: string[] = []
    const catMap = new Map<string, ExpenseItem[]>()
    const noCat: ExpenseItem[] = []
    for (const e of p.expenses) {
      if (e.category) {
        if (!catMap.has(e.category)) { catMap.set(e.category, []); catOrder.push(e.category) }
        catMap.get(e.category)!.push(e)
      } else { noCat.push(e) }
    }
    for (const cat of catOrder) grouped.push({ cat, items: catMap.get(cat)! })
    if (noCat.length > 0) grouped.push({ cat: null, items: noCat })
  }

  /* ── Récap chiffres ── */
  const remaining = p.totalExpenses - p.paidExpenses
  const pct = p.totalExpenses > 0 ? Math.round((p.paidExpenses / p.totalExpenses) * 100) : 0

  const handleAdd = () => {
    p.addExpense(newPaid)
    setNewPaid(false)
  }

  return (
    <div className="grid grid-cols-2 gap-4 min-h-0">

      {/* ══ Colonne gauche — Formulaire + Récap ══ */}
      <div className="space-y-2">
        <p className="text-[10px] text-white/30 uppercase tracking-wide mb-1">Nouvelle dépense</p>

        {/* Nom */}
        <input
          type="text"
          value={p.newExpenseLabel}
          onChange={e => p.setNewExpenseLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && p.newExpenseLabel.trim()) handleAdd() }}
          placeholder="Libellé *"
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40"
        />

        {/* Montant + Catégorie */}
        <div className="flex gap-2">
          <input
            type="number"
            value={p.newExpenseAmount}
            onChange={e => p.setNewExpenseAmount(e.target.value)}
            placeholder="Montant (€)"
            className="w-24 shrink-0 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40"
          />
          <input
            type="text"
            list="expense-cats-dl"
            value={p.newExpenseCategory}
            onChange={e => p.setNewExpenseCategory(e.target.value)}
            placeholder="Catégorie (libre)"
            className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40"
          />
          <datalist id="expense-cats-dl">
            {knownCats.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>

        {/* Toggle Payé / À payer */}
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setNewPaid(false)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition border ${
              !newPaid
                ? 'bg-white/8 border-white/18 text-white/65'
                : 'bg-transparent border-white/6 text-white/22'
            }`}
          >
            À payer
          </button>
          <button
            type="button"
            onClick={() => setNewPaid(true)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition border ${
              newPaid
                ? 'bg-emerald-500/20 border-emerald-500/35 text-emerald-300'
                : 'bg-transparent border-white/6 text-white/22'
            }`}
          >
            ✓ Payé
          </button>
        </div>

        {p.expenseError && (
          <p className="text-[10px] text-red-400">{p.expenseError}</p>
        )}

        <button
          onClick={handleAdd}
          disabled={p.addingExpense || !p.newExpenseLabel.trim()}
          className="w-full py-2 rounded-xl bg-violet-600/60 hover:bg-violet-600 text-white text-xs font-medium disabled:opacity-40 transition"
        >
          {p.addingExpense ? 'Ajout…' : '+ Ajouter'}
        </button>

        {/* ── Récap budget (visible seulement si au moins une dépense) ── */}
        {p.expenses.length > 0 && (
          <div className="mt-1 p-3 bg-white/[0.03] rounded-xl border border-white/6 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-white/30">Total dépenses</span>
              <span className="text-xs font-semibold text-white/65">
                {p.totalExpenses.toLocaleString('fr-FR')} €
              </span>
            </div>
            {/* Barre de progression */}
            <div className="w-full h-[3px] bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-emerald-400/75">
                ✓ {p.paidExpenses.toLocaleString('fr-FR')} € payés
              </span>
              <span className="text-[10px] text-white/28">
                {remaining.toLocaleString('fr-FR')} € restants
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ══ Colonne droite — Liste des dépenses ══ */}
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-wide mb-2">
          Dépenses{p.expenses.length > 0 ? ` (${p.expenses.length})` : ''}
        </p>

        {p.expenses.length === 0 && (
          <p className="text-[10px] text-white/18 italic text-center py-8">
            Aucune dépense enregistrée
          </p>
        )}

        <div className="space-y-3">
          {grouped.map((group, gi) => (
            <div key={gi}>
              {/* En-tête de catégorie — affiché seulement si au moins une dépense a une catégorie */}
              {anyHasCategory && (
                <p className="text-[9px] font-medium text-white/22 uppercase tracking-widest border-b border-white/6 pb-1 mb-1.5">
                  {group.cat ?? 'Sans catégorie'}
                </p>
              )}

              {/* Lignes de dépenses */}
              {group.items.map(e => (
                <div key={e.id} className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-2.5 py-2 mb-1 last:mb-0">
                  {/* Bouton rond toggle payé */}
                  <button
                    type="button"
                    title={e.paid ? 'Marquer non payé' : 'Marquer payé'}
                    onClick={() => p.toggleExpensePaid(e.id, !e.paid)}
                    className="shrink-0 w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all"
                    style={e.paid
                      ? { background: 'rgba(52,211,153,0.22)', borderColor: 'rgba(52,211,153,0.45)' }
                      : { background: 'transparent', borderColor: 'rgba(255,255,255,0.14)' }
                    }
                  >
                    {e.paid && (
                      <span style={{ fontSize: 7, color: '#6ee7b7', lineHeight: 1 }}>✓</span>
                    )}
                  </button>

                  {/* Libellé */}
                  <span className={`flex-1 text-[11px] min-w-0 truncate ${
                    e.paid ? 'line-through text-white/28' : 'text-white/78'
                  }`}>
                    {e.label}
                  </span>

                  {/* Montant */}
                  {e.amount != null && (
                    <span className="text-[11px] text-white/48 shrink-0 tabular-nums">
                      {Number(e.amount).toLocaleString('fr-FR')} €
                    </span>
                  )}

                  {/* Badge statut */}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                    e.paid
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-white/5 text-white/22'
                  }`}>
                    {e.paid ? 'Payé' : 'À payer'}
                  </span>

                  {/* Supprimer */}
                  <button
                    onClick={() => p.deleteExpense(e.id)}
                    className="text-white/14 hover:text-red-400 transition text-[10px] shrink-0 ml-0.5"
                  >✕</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
