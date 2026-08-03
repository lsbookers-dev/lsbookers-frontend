// agenda/EventTabNotes.tsx — Onglet "Notes & Frais" (organisateur) / "Contrat" (artiste)

import { ExpenseItem, DocumentItem } from './types'
import { DocumentsSection } from './helpers'

const EXPENSE_CATS = ['Technique', 'Catering', 'Décor', 'Communication', 'Personnel', 'Autre']

interface Props {
  isBookedEvent: boolean
  expenses: ExpenseItem[]
  totalExpenses: number
  paidExpenses: number
  allDocs: DocumentItem[]
  /* Notes */
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
  addExpense: () => void
  toggleExpensePaid: (id: number, paid: boolean) => void
  deleteExpense: (id: number) => void
  addDocument: (file: File, type: string) => void
  deleteDocument: (id: number) => void
}

export default function EventTabNotes(p: Props) {
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

  return (
    <div className="space-y-4">
      {/* Notes privées */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Notes privées</p>
        <textarea
          value={p.notesText}
          onChange={e => p.setNotesText(e.target.value)}
          placeholder="Vos notes pour cet événement…"
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40 resize-none"
        />
        <button onClick={p.saveNotes} disabled={p.notesSaving}
          className="mt-1.5 px-4 py-1.5 rounded-lg bg-violet-600/60 hover:bg-violet-600 text-white text-xs font-medium disabled:opacity-40 transition">
          {p.notesSaving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </div>

      {/* Frais */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-white/40 uppercase tracking-wide">Frais</p>
          <p className="text-xs text-white/50">{p.paidExpenses.toLocaleString('fr-FR')} € / {p.totalExpenses.toLocaleString('fr-FR')} € payés</p>
        </div>
        <div className="space-y-1.5 mb-3">
          {p.expenses.map(e => (
            <div key={e.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <input type="checkbox" checked={e.paid}
                onChange={ev => p.toggleExpensePaid(e.id, ev.target.checked)}
                className="accent-violet-500 w-3.5 h-3.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${e.paid ? 'line-through text-white/30' : 'text-white'}`}>{e.label}</p>
                {e.category && <p className="text-[10px] text-white/30">{e.category}</p>}
              </div>
              {e.amount != null && (
                <span className="text-xs text-white/60 shrink-0">{Number(e.amount).toLocaleString('fr-FR')} €</span>
              )}
              <button onClick={() => p.deleteExpense(e.id)}
                className="text-white/20 hover:text-red-400 transition text-xs shrink-0">✕</button>
            </div>
          ))}
          {p.expenses.length === 0 && (
            <p className="text-xs text-white/20 italic">Aucune dépense enregistrée</p>
          )}
        </div>
        <div className="bg-white/[0.03] rounded-xl border border-white/8 p-3 space-y-2">
          <input type="text" value={p.newExpenseLabel} onChange={e => p.setNewExpenseLabel(e.target.value)}
            placeholder="Libellé *"
            className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
          <div className="flex gap-2">
            <input type="number" value={p.newExpenseAmount} onChange={e => p.setNewExpenseAmount(e.target.value)}
              placeholder="Montant (€)"
              className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
            <select value={p.newExpenseCategory} onChange={e => p.setNewExpenseCategory(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none">
              <option value="">Catégorie…</option>
              {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {p.expenseError && <p className="text-xs text-red-400">{p.expenseError}</p>}
          <button onClick={p.addExpense} disabled={p.addingExpense || !p.newExpenseLabel.trim()}
            className="w-full py-1.5 rounded-lg bg-violet-600/60 hover:bg-violet-600 text-white text-xs font-medium disabled:opacity-40 transition">
            {p.addingExpense ? 'Ajout…' : '+ Ajouter une dépense'}
          </button>
        </div>
      </div>
    </div>
  )
}
