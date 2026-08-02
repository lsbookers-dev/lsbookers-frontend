// agenda/helpers.tsx — Composants utilitaires, constantes et fonctions helper

import { DocumentItem } from './types'

/* ── Constantes ── */

export const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
export const DAYS_FR   = ['L','M','M','J','V','S','D']

export const AVAIL_OPTIONS = [
  { status: 'AVAILABLE',   label: 'Disponible',       color: 'bg-green-500',  ring: 'ring-green-500/50',  text: 'text-green-400'  },
  { status: 'TENTATIVE',   label: 'Booking en cours', color: 'bg-orange-500', ring: 'ring-orange-500/50', text: 'text-orange-400' },
  { status: 'UNAVAILABLE', label: 'Indisponible',     color: 'bg-red-500',    ring: 'ring-red-500/50',    text: 'text-red-400'    },
]

/* ── Fonctions utilitaires ── */

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

export function formatHour(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export function categoryColor(cat?: string | null) {
  const map: Record<string, string> = {
    Club: 'bg-purple-500', Mariage: 'bg-pink-400', Corporate: 'bg-blue-400',
    Festival: 'bg-amber-400', Concert: 'bg-green-400', Privé: 'bg-rose-400',
  }
  return cat && map[cat] ? map[cat] : 'bg-purple-400'
}

export function availBg(status?: string) {
  if (status === 'AVAILABLE')   return 'bg-green-500/20 ring-1 ring-green-500/30'
  if (status === 'UNAVAILABLE') return 'bg-red-500/20   ring-1 ring-red-500/30'
  if (status === 'TENTATIVE')   return 'bg-orange-500/20 ring-1 ring-orange-500/30'
  if (status === 'BOOKED')      return 'bg-amber-500/20  ring-1 ring-amber-500/30'
  return ''
}

/* ── Badges de statut ── */

export function BkStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: 'En attente', cls: 'bg-yellow-500/20 text-yellow-300' },
    ACCEPTED:  { label: 'Accepté',    cls: 'bg-green-500/20 text-green-300' },
    DECLINED:  { label: 'Refusé',     cls: 'bg-red-500/20 text-red-300' },
    CANCELLED: { label: 'Annulé',     cls: 'bg-white/10 text-white/40' },
    COMPLETED: { label: 'Terminé',    cls: 'bg-blue-500/20 text-blue-300' },
  }
  const s = map[status] || map.PENDING
  return <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${s.cls}`}>{s.label}</span>
}

export function PayBadge({ status }: { status?: string | null }) {
  if (status === 'PAID')    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">💳 Booking payé</span>
  if (status === 'DEPOSIT') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">💳 Acompte payé</span>
  if (status === 'DIRECT')  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">💵 Paiement en direct</span>
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/30">⏳ Non payé</span>
}

/* ── Section Documents (utilisée dans l'onglet Contrat et Transports artiste) ── */

export function DocumentsSection({
  docs, docType, label, uploadingDoc, docError, addDocument, deleteDocument
}: {
  docs: DocumentItem[]
  docType: string
  label: string
  uploadingDoc: boolean
  docError: string
  addDocument: (file: File, type: string) => void
  deleteDocument: (id: number) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40 uppercase tracking-wide">{label}</p>
      <div className="space-y-1.5">
        {docs.map(d => (
          <div key={d.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
            <a href={d.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0">
              <p className="text-xs text-violet-300 hover:text-violet-200 truncate">📎 {d.name}</p>
            </a>
            <button onClick={() => deleteDocument(d.id)} className="text-white/20 hover:text-red-400 transition text-xs shrink-0">✕</button>
          </div>
        ))}
        {docs.length === 0 && <p className="text-xs text-white/20 italic">Aucun document</p>}
      </div>
      <label className={`w-full py-2 rounded-xl text-xs font-medium text-center cursor-pointer transition block border ${
        uploadingDoc ? 'bg-white/5 border-white/10 text-white/30' : 'bg-violet-600/20 border-violet-500/30 text-violet-300 hover:bg-violet-600/30'
      }`}>
        {uploadingDoc ? 'Upload en cours…' : `📎 Ajouter ${label.toLowerCase()}`}
        <input type="file" className="hidden" disabled={uploadingDoc}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) addDocument(f, docType)
            e.target.value = ''
          }} />
      </label>
      {docError && <p className="text-xs text-red-400">{docError}</p>}
    </div>
  )
}
