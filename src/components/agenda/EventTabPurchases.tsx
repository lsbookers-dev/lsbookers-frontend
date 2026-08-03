// agenda/EventTabPurchases.tsx — Onglet "Achats" (organisateur) / "Transports & Logements" (artiste)

import { PurchaseItem, DocumentItem } from './types'
import { DocumentsSection } from './helpers'

interface Props {
  isBookedEvent: boolean
  purchases: PurchaseItem[]
  allDocs: DocumentItem[]
  /* Formulaire achat */
  newPurchaseItem: string;  setNewPurchaseItem:  (v: string) => void
  newPurchaseQty: string;   setNewPurchaseQty:   (v: string) => void
  newPurchasePrice: string; setNewPurchasePrice: (v: string) => void
  addingPurchase: boolean
  /* Documents */
  uploadingDoc: boolean
  docError: string
  /* Actions */
  addPurchase: () => void
  togglePurchaseDone: (id: number, done: boolean) => void
  deletePurchase: (id: number) => void
  addDocument: (file: File, type: string) => void
  deleteDocument: (id: number) => void
}

export default function EventTabPurchases(p: Props) {
  if (p.isBookedEvent) {
    return (
      <DocumentsSection
        docs={p.allDocs.filter(d => d.fileType === 'TRANSPORT' || d.fileType === 'HOTEL')}
        docType="TRANSPORT"
        label="Transport / Logement"
        uploadingDoc={p.uploadingDoc}
        docError={p.docError}
        addDocument={p.addDocument}
        deleteDocument={p.deleteDocument}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {p.purchases.map(pu => (
          <div key={pu.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
            <input type="checkbox" checked={pu.done}
              onChange={ev => p.togglePurchaseDone(pu.id, ev.target.checked)}
              className="accent-green-500 w-3.5 h-3.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={`text-xs ${pu.done ? 'line-through text-white/30' : 'text-white'}`}>{pu.item}</p>
              {(pu.quantity || pu.price) && (
                <p className="text-[10px] text-white/30">
                  {pu.quantity ? `x${pu.quantity}` : ''}{pu.quantity && pu.price ? ' · ' : ''}{pu.price ? `${Number(pu.price).toLocaleString('fr-FR')} €` : ''}
                </p>
              )}
            </div>
            <button onClick={() => p.deletePurchase(pu.id)}
              className="text-white/20 hover:text-red-400 transition text-xs shrink-0">✕</button>
          </div>
        ))}
        {p.purchases.length === 0 && (
          <p className="text-xs text-white/20 italic">Liste vide</p>
        )}
      </div>
      <div className="bg-white/[0.03] rounded-xl border border-white/8 p-3 space-y-2">
        <input type="text" value={p.newPurchaseItem} onChange={e => p.setNewPurchaseItem(e.target.value)}
          placeholder="Article *"
          className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
        <div className="flex gap-2">
          <input type="number" value={p.newPurchaseQty} onChange={e => p.setNewPurchaseQty(e.target.value)}
            placeholder="Qté"
            className="w-20 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
          <input type="number" value={p.newPurchasePrice} onChange={e => p.setNewPurchasePrice(e.target.value)}
            placeholder="Prix unitaire (€)"
            className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none" />
        </div>
        <button onClick={p.addPurchase} disabled={p.addingPurchase || !p.newPurchaseItem.trim()}
          className="w-full py-1.5 rounded-lg bg-green-600/60 hover:bg-green-600 text-white text-xs font-medium disabled:opacity-40 transition">
          {p.addingPurchase ? 'Ajout…' : '+ Ajouter un article'}
        </button>
      </div>
    </div>
  )
}
