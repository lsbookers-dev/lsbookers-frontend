// agenda/EventTabBookings.tsx — Onglet "Bookings" (organisateur) / "Paiement" (artiste)

import { BookingItem2, DocumentItem, LinkedBooking } from './types'
import { PayBadge } from './helpers'

interface Props {
  isBookedEvent: boolean
  bookingRequests: BookingItem2[]
  linkedBooking: LinkedBooking | null
  allDocs: DocumentItem[]
  filteredDocs: DocumentItem[]
  docFilter: 'ALL' | 'CONTRACT' | 'TRANSPORT' | 'HOTEL' | 'OTHER'
  setDocFilter: (v: 'ALL' | 'CONTRACT' | 'TRANSPORT' | 'HOTEL' | 'OTHER') => void
  uploadingDoc: boolean
  docError: string
  addDocument: (file: File, type: string) => void
  deleteDocument: (id: number) => void
}

const bookingStatusCls: Record<string, string> = {
  PENDING: 'text-yellow-300', ACCEPTED: 'text-green-300',
  DECLINED: 'text-red-300',   CANCELLED: 'text-white/30',
}

const DOC_LABEL: Record<string, string> = {
  ALL: 'Tous', CONTRACT: 'Contrats', TRANSPORT: 'Transport', HOTEL: 'Logement', OTHER: 'Autres',
}

const FILE_TYPE_LABEL: Record<string, string> = {
  CONTRACT: 'Contrat', TRANSPORT: 'Transport', HOTEL: 'Logement', OTHER: 'Autre',
}

export default function EventTabBookings(p: Props) {
  if (p.isBookedEvent) {
    return (
      <div className="space-y-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/8 space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-wide">Informations paiement</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Cachet convenu</span>
            <span className="text-sm font-semibold text-white">
              {p.linkedBooking?.fee ? `${Number(p.linkedBooking.fee).toLocaleString('fr-FR')} €` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Statut</span>
            <PayBadge status={p.linkedBooking?.paymentStatus} />
          </div>
        </div>
        <p className="text-[10px] text-white/25 text-center">Le statut de paiement est géré par l&apos;organisateur.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Demandes de booking */}
      <div className="space-y-2">
        {p.bookingRequests.length === 0 ? (
          <p className="text-xs text-white/25 italic text-center py-2">Aucune demande de booking liée à cet événement</p>
        ) : (
          p.bookingRequests.map(b => {
            const name = b.target?.user?.pseudo
              || [b.target?.user?.firstName, b.target?.user?.lastName].filter(Boolean).join(' ')
              || '?'
            return (
              <div key={b.id} className="bg-white/5 rounded-xl p-3 border border-white/8 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-white">{name}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      📅 {new Date(b.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {b.fee ? ` · ${Number(b.fee).toLocaleString('fr-FR')} €` : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-medium ${bookingStatusCls[b.status] || 'text-white/40'}`}>{b.status}</span>
                </div>
                {b.message && <p className="text-xs text-white/40 italic">&ldquo;{b.message}&rdquo;</p>}
              </div>
            )
          })
        )}
        <p className="text-[10px] text-white/25 text-center">
          Pour envoyer une offre, utilisez le profil de l&apos;artiste ou prestataire.
        </p>
      </div>

      {/* Documents de l'événement */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Documents</p>
        <div className="flex gap-1 mb-2 flex-wrap">
          {(['ALL', 'CONTRACT', 'TRANSPORT', 'HOTEL', 'OTHER'] as const).map(f => (
            <button key={f} onClick={() => p.setDocFilter(f)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                p.docFilter === f
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
              }`}>
              {DOC_LABEL[f]}
            </button>
          ))}
        </div>
        <div className="space-y-1.5 mb-2">
          {p.filteredDocs.map(d => (
            <div key={d.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <a href={d.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0">
                <p className="text-xs text-violet-300 hover:text-violet-200 truncate">📎 {d.name}</p>
                <p className="text-[10px] text-white/30">{FILE_TYPE_LABEL[d.fileType] || d.fileType}</p>
              </a>
              <button onClick={() => p.deleteDocument(d.id)}
                className="text-white/20 hover:text-red-400 transition text-xs shrink-0">✕</button>
            </div>
          ))}
          {p.filteredDocs.length === 0 && <p className="text-xs text-white/20 italic">Aucun document</p>}
        </div>
        <div className="bg-white/[0.03] rounded-xl border border-white/8 p-3 space-y-2">
          <select defaultValue="CONTRACT" id="docTypeSelect"
            className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none">
            <option value="CONTRACT">Contrat</option>
            <option value="TRANSPORT">Billet de transport</option>
            <option value="HOTEL">Réservation hôtel</option>
            <option value="OTHER">Autre</option>
          </select>
          <label className={`w-full py-1.5 rounded-lg text-xs font-medium text-center cursor-pointer transition block ${
            p.uploadingDoc ? 'bg-white/10 text-white/30' : 'bg-violet-600/60 hover:bg-violet-600 text-white'
          }`}>
            {p.uploadingDoc ? 'Upload en cours…' : '📎 Joindre un fichier'}
            <input type="file" className="hidden" disabled={p.uploadingDoc}
              onChange={e => {
                const f = e.target.files?.[0]
                const sel = document.getElementById('docTypeSelect') as HTMLSelectElement
                if (f) p.addDocument(f, sel?.value || 'OTHER')
                e.target.value = ''
              }} />
          </label>
          {p.docError && <p className="text-xs text-red-400">{p.docError}</p>}
        </div>
      </div>
    </div>
  )
}
