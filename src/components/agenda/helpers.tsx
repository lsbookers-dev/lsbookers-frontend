// agenda/helpers.tsx — Composants utilitaires, constantes et fonctions helper

import React from 'react'
import { Banknote, Check, Clock3, CreditCard, Paperclip, Trash2, UploadCloud } from 'lucide-react'
import { DocumentItem } from './types'

/* ── Constantes ── */

export const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
export const DAYS_FR   = ['L','M','M','J','V','S','D']

export const AVAIL_OPTIONS = [
  { status: 'AVAILABLE',   label: 'Disponible',       color: 'bg-green-500', ring: 'ring-green-500/50', text: 'text-green-400' },
  { status: 'TENTATIVE',   label: 'Booking en cours', color: 'bg-blue-500',  ring: 'ring-blue-500/50',  text: 'text-blue-400'  },
  { status: 'UNAVAILABLE', label: 'Indisponible',     color: 'bg-red-500',   ring: 'ring-red-500/50',   text: 'text-red-400'   },
]

/* ── Jours fériés France ── */

/** Algorithme de Gauss pour calculer la date de Pâques */
function getEasterDate(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function dk(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

/** Retourne une Map dateKey → nom du jour férié pour une année donnée */
export function getFrenchHolidays(year: number): Map<string, string> {
  const easter = getEasterDate(year)
  const plus = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
  const m = new Map<string, string>()
  m.set(dk(new Date(year, 0, 1)),   'Jour de l\'An')
  m.set(dk(plus(easter, 1)),        'Lundi de Pâques')
  m.set(dk(new Date(year, 4, 1)),   'Fête du Travail')
  m.set(dk(new Date(year, 4, 8)),   'Victoire 1945')
  m.set(dk(plus(easter, 39)),       'Ascension')
  m.set(dk(plus(easter, 50)),       'Lundi de Pentecôte')
  m.set(dk(new Date(year, 6, 14)),  'Fête Nationale')
  m.set(dk(new Date(year, 7, 15)),  'Assomption')
  m.set(dk(new Date(year, 10, 1)),  'Toussaint')
  m.set(dk(new Date(year, 10, 11)), 'Armistice')
  m.set(dk(new Date(year, 11, 25)), 'Noël')
  return m
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6 // Dimanche ou Samedi
}

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
  if (status === 'AVAILABLE')   return 'bg-teal-500/20 ring-1 ring-teal-500/30'
  if (status === 'UNAVAILABLE') return 'bg-rose-500/20 ring-1 ring-rose-500/30'
  if (status === 'TENTATIVE')   return 'bg-cyan-500/20 ring-1 ring-cyan-500/30'
  if (status === 'BOOKED')      return 'bg-amber-500/20 ring-1 ring-amber-500/30'
  return ''
}

export function availCellStyle(status?: string): React.CSSProperties {
  if (status === 'AVAILABLE')   return { background: 'rgba(20,184,166,0.13)', borderColor: 'rgba(45,212,191,0.28)' }
  if (status === 'UNAVAILABLE') return { background: 'rgba(225,29,72,0.13)',   borderColor: 'rgba(251,113,133,0.28)' }
  if (status === 'TENTATIVE')   return { background: 'rgba(34,184,207,0.13)',  borderColor: 'rgba(34,184,207,0.28)' }
  if (status === 'BOOKED')      return { background: 'rgba(245,158,11,0.13)',  borderColor: 'rgba(245,158,11,0.28)' }
  return {}
}

export function availDotColor(status?: string): string {
  if (status === 'AVAILABLE')   return '#2dd4bf'
  if (status === 'UNAVAILABLE') return '#fb7185'
  if (status === 'TENTATIVE')   return '#22b8cf'
  if (status === 'BOOKED')      return '#f59e0b'
  return 'transparent'
}

/* ── Badges de statut ── */

export function BkStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: 'En attente', cls: 'border border-amber-400/20 bg-amber-400/10 text-amber-200' },
    ACCEPTED:  { label: 'Accepté',    cls: 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-200' },
    DECLINED:  { label: 'Refusé',     cls: 'border border-rose-400/20 bg-rose-400/10 text-rose-200' },
    CANCELLED: { label: 'Annulé',     cls: 'border border-white/10 bg-white/5 text-white/45' },
    COMPLETED: { label: 'Terminé',    cls: 'border border-cyan-400/20 bg-cyan-400/10 text-cyan-200' },
  }
  const s = map[status] || map.PENDING
  return <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-[11px] font-medium shrink-0 ${s.cls}`}>{s.label}</span>
}

export function PayBadge({ status }: { status?: string | null }) {
  const base = 'inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium'
  if (status === 'PAID') return (
    <span className={`${base} border-emerald-400/20 bg-emerald-400/10 text-emerald-200`}>
      <Check className="h-3 w-3" aria-hidden="true" /> Booking payé
    </span>
  )
  if (status === 'DEPOSIT') return (
    <span className={`${base} border-amber-400/20 bg-amber-400/10 text-amber-200`}>
      <CreditCard className="h-3 w-3" aria-hidden="true" /> Acompte payé
    </span>
  )
  if (status === 'DIRECT') return (
    <span className={`${base} border-cyan-400/20 bg-cyan-400/10 text-cyan-200`}>
      <Banknote className="h-3 w-3" aria-hidden="true" /> Paiement en direct
    </span>
  )
  return (
    <span className={`${base} border-white/10 bg-white/5 text-white/45`}>
      <Clock3 className="h-3 w-3" aria-hidden="true" /> Non payé
    </span>
  )
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
      <p className="text-[11px] font-semibold text-violet-200/80 uppercase tracking-[0.16em]">{label}</p>
      <div className="space-y-1.5">
        {docs.map(d => (
          <div key={d.id} className="flex items-center gap-2 rounded-xl border border-violet-300/10 bg-gradient-to-r from-violet-500/10 to-cyan-500/5 px-3 py-2.5">
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
            <a href={d.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0">
              <p className="text-xs text-white/75 hover:text-white truncate">{d.name}</p>
            </a>
            <button
              onClick={() => deleteDocument(d.id)}
              aria-label={`Supprimer ${d.name}`}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/35 transition hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
        {docs.length === 0 && <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] px-3 py-4 text-center text-xs text-white/35">Aucun document</p>}
      </div>
      <label className={`flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-xs font-medium transition ${
        uploadingDoc ? 'bg-white/5 border-white/10 text-white/35' : 'border-violet-400/25 bg-gradient-to-r from-violet-500/15 to-cyan-500/10 text-violet-100 hover:border-violet-300/40 hover:from-violet-500/25'
      }`}>
        <UploadCloud className="h-4 w-4" aria-hidden="true" />
        {uploadingDoc ? 'Upload en cours…' : `Ajouter ${label.toLowerCase()}`}
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
