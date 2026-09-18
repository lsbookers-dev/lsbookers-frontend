// agenda/EventTabNotes.tsx — Onglet "Dépenses" (2 colonnes : formulaire + liste groupée)

import { useState } from 'react'
import { ExpenseItem, DocumentItem } from './types'
import { DocumentsSection } from './helpers'
import {
  Check,
  CircleDollarSign,
  Plus,
  ReceiptText,
  Trash2,
  WalletCards,
} from 'lucide-react'

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
    <div className="grid grid-cols-1 gap-3 min-h-0 sm:grid-cols-2 sm:gap-4">

      {/* ══ Colonne gauche — Formulaire + Récap ══ */}
      <div className="space-y-2 rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.09] via-indigo-500/[0.05] to-transparent p-3">
        <div className="mb-2 flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl border border-violet-300/20 bg-violet-500/15 text-violet-200">
            <ReceiptText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/85">Nouvelle dépense</p>
            <p className="text-[10px] text-white/40">Ajoutez et suivez chaque coût de l&apos;événement.</p>
          </div>
        </div>

        {/* Nom */}
        <input
          type="text"
          value={p.newExpenseLabel}
          onChange={e => p.setNewExpenseLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && p.newExpenseLabel.trim()) handleAdd() }}
          placeholder="Libellé *"
          className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/80 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
        />

        {/* Montant + Catégorie */}
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-[6rem_1fr]">
          <input
            type="text"
            inputMode="decimal"
            value={p.newExpenseAmount}
            onChange={e => p.setNewExpenseAmount(e.target.value)}
            placeholder="Montant (€)"
            className="w-full px-3 py-2.5 rounded-xl bg-[#11101a]/80 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
          />
          <input
            type="text"
            list="expense-cats-dl"
            value={p.newExpenseCategory}
            onChange={e => p.setNewExpenseCategory(e.target.value)}
            placeholder="Catégorie (libre)"
            className="min-w-0 px-3 py-2.5 rounded-xl bg-[#11101a]/80 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
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
                ? 'bg-amber-500/12 border-amber-300/20 text-amber-100/80'
                : 'bg-transparent border-white/6 text-white/30'
            }`}
          >
            À payer
          </button>
          <button
            type="button"
            onClick={() => setNewPaid(true)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition border ${
              newPaid
                ? 'bg-emerald-500/18 border-emerald-400/30 text-emerald-200'
                : 'bg-transparent border-white/6 text-white/30'
            }`}
          >
            <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" />Payé</span>
          </button>
        </div>

        {p.expenseError && (
          <p className="text-[10px] text-red-400">{p.expenseError}</p>
        )}

        <button
          onClick={handleAdd}
          disabled={p.addingExpense || !p.newExpenseLabel.trim()}
          className="inline-flex w-full items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white text-xs font-medium disabled:opacity-40 transition"
        >
          <Plus className="h-3.5 w-3.5" /> {p.addingExpense ? 'Ajout…' : 'Ajouter'}
        </button>

        {/* ── Récap budget (visible seulement si au moins une dépense) ── */}
        {p.expenses.length > 0 && (
          <div className="mt-2 p-3 bg-emerald-500/[0.055] rounded-xl border border-emerald-400/15 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-100/55"><CircleDollarSign className="h-3.5 w-3.5" />Total dépenses</span>
              <span className="text-xs font-semibold text-emerald-100/85">
                {p.totalExpenses.toLocaleString('fr-FR')} €
              </span>
            </div>
            {/* Barre de progression */}
            <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300/80">
                <Check className="h-3 w-3" /> {p.paidExpenses.toLocaleString('fr-FR')} € payés
              </span>
              <span className="text-[10px] text-white/28">
                {remaining.toLocaleString('fr-FR')} € restants
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ══ Colonne droite — Liste des dépenses ══ */}
      <div className="rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-cyan-500/[0.07] via-white/[0.025] to-transparent p-3">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
            <WalletCards className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/85">Dépenses</p>
            <p className="text-[10px] text-white/40">{p.expenses.length} ligne{p.expenses.length > 1 ? 's' : ''} enregistrée{p.expenses.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {p.expenses.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-8 text-center">
            <ReceiptText className="mx-auto mb-2 h-5 w-5 text-white/15" />
            <p className="text-[11px] text-white/30">Aucune dépense enregistrée</p>
          </div>
        )}

        <div className="space-y-3">
          {grouped.map((group, gi) => (
            <div key={gi}>
              {/* En-tête de catégorie — affiché seulement si au moins une dépense a une catégorie */}
              {anyHasCategory && (
                <p className="text-[10px] font-medium text-cyan-100/45 uppercase tracking-widest border-b border-cyan-300/10 pb-1.5 mb-1.5">
                  {group.cat ?? 'Sans catégorie'}
                </p>
              )}

              {/* Lignes de dépenses */}
              {group.items.map(e => (
                <div key={e.id} className="flex flex-wrap items-center gap-2 bg-[#12111b]/75 border border-white/6 rounded-xl px-2.5 py-2.5 mb-1 last:mb-0 transition hover:border-cyan-400/15">
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
                      <Check className="h-2.5 w-2.5 text-emerald-200" />
                    )}
                  </button>

                  {/* Libellé */}
                  <span className={`flex-1 text-xs min-w-[7rem] truncate ${
                    e.paid ? 'line-through text-white/28' : 'text-white/78'
                  }`}>
                    {e.label}
                  </span>

                  {/* Montant */}
                  {e.amount != null && (
                    <span className="text-xs text-white/55 shrink-0 tabular-nums">
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
                    className="grid h-6 w-6 place-items-center rounded-lg text-white/20 hover:bg-red-500/10 hover:text-red-300 transition shrink-0 ml-0.5"
                    title="Supprimer"
                  ><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
