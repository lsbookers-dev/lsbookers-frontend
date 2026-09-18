// agenda/EventTabBookings.tsx — Onglet Bookings : liste gauche + panneau droit 5 onglets
'use client'

import { useState, useEffect, useRef } from 'react'
import { getAuthToken } from '@/utils/auth'
import {
  CreditCard, FileText, MapPin, Image as ImageIcon, StickyNote,
  Plus, Download, Eye, Trash2, Bed, Plane, Loader2, Paperclip,
  CheckCircle2, CalendarDays,
} from 'lucide-react'
import { BookingItem2, BookingDetail, BookingLogistic, BookingMedia, DocumentItem, LinkedBooking } from './types'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? getAuthToken() : null
  return t ? { Authorization: `Bearer ${t}` } : {}
}

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const PAYMENT_LABEL: Record<string, { label: string; cls: string }> = {
  UNPAID:  { label: 'Non payé', cls: 'border border-amber-400/20 bg-amber-400/10 text-amber-200' },
  DEPOSIT: { label: 'Acompte',  cls: 'border border-cyan-400/20 bg-cyan-400/10 text-cyan-200' },
  PAID:    { label: 'Payé',     cls: 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-200' },
}
const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'En cours', cls: 'border border-amber-400/20 bg-amber-400/10 text-amber-200' },
  ACCEPTED:  { label: 'Confirmé', cls: 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-200' },
  DECLINED:  { label: 'Refusé',   cls: 'border border-rose-400/20 bg-rose-400/10 text-rose-200' },
  CANCELLED: { label: 'Annulé',   cls: 'border border-white/10 bg-white/5 text-white/40' },
}

function initials(b: BookingItem2): string {
  const u = b.target?.user
  const name = u?.pseudo || [u?.firstName, u?.lastName].filter(Boolean).join(' ') || '?'
  return name.slice(0, 2).toUpperCase()
}

function displayName(b: BookingItem2): string {
  const u = b.target?.user
  return u?.pseudo || [u?.firstName, u?.lastName].filter(Boolean).join(' ') || 'Inconnu'
}

function avatarUrl(b: BookingItem2): string | null {
  return b.target?.avatar ?? null
}

/* ─── sous-composants ─────────────────────────────────────────────────────── */

// Paiement
function TabPayment({ booking, isOrganizer }: { booking: BookingDetail; isOrganizer: boolean }) {
  const pay = PAYMENT_LABEL[booking.paymentStatus || 'UNPAID']
  const fee = booking.fee ? Number(booking.fee) : 0
  const paid = booking.paymentStatus === 'PAID' ? fee
    : booking.paymentStatus === 'DEPOSIT' ? fee / 2 : 0
  const remaining = fee - paid

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-emerald-300/15 bg-gradient-to-br from-emerald-500/15 to-cyan-500/5 p-3.5">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-100/55">Payé</p>
          <p className="text-lg font-semibold text-emerald-200">{paid.toLocaleString('fr-FR')} €</p>
          {booking.paymentStatus === 'DEPOSIT' && <p className="mt-0.5 text-[11px] text-white/40">Acompte 50 %</p>}
        </div>
        <div className="rounded-2xl border border-amber-300/15 bg-gradient-to-br from-amber-500/12 to-violet-500/5 p-3.5">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-amber-100/55">Restant</p>
          <p className={`text-lg font-semibold ${remaining > 0 ? 'text-amber-200' : 'text-white/40'}`}>
            {remaining.toLocaleString('fr-FR')} €
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-medium ${pay.cls}`}>{pay.label}</span>
      </div>
      {isOrganizer && (
        <button className="flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 text-sm font-medium text-white shadow-[0_10px_28px_rgba(124,58,237,0.25)] transition hover:from-violet-500 hover:to-fuchsia-500">
          <CreditCard className="h-4 w-4" aria-hidden="true" />
          Réaliser le paiement
        </button>
      )}
      {!isOrganizer && (
        <p className="text-[11px] text-white/40">Le paiement est géré par l&apos;organisateur.</p>
      )}
    </div>
  )
}

// Contrat
function TabContrat({ docs, isOrganizer, onUpload, uploading }: {
  docs: DocumentItem[]
  isOrganizer: boolean
  onUpload: (f: File) => void
  uploading: boolean
}) {
  const contracts = docs.filter(d => d.fileType === 'CONTRACT')
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-3">
      {contracts.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] px-3 py-4 text-center text-xs text-white/35">Aucun contrat pour cet événement.</p>
      )}
      {contracts.map(d => (
        <div key={d.id} className="flex items-center gap-2.5 rounded-xl border border-violet-300/10 bg-gradient-to-r from-violet-500/10 to-cyan-500/5 px-3 py-2.5">
          <FileText className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="flex-1 min-w-0 text-xs text-white/70 truncate">{d.name}</span>
          <a href={d.url} target="_blank" rel="noreferrer"
            className="flex min-h-9 shrink-0 items-center gap-1 rounded-lg border border-violet-400/20 px-2.5 text-[11px] text-violet-200 transition-colors hover:bg-violet-500/10">
            <Eye className="w-3 h-3" /> Voir
          </a>
        </div>
      ))}
      {isOrganizer && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex min-h-24 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-violet-300/20 bg-violet-500/5 py-4 transition-colors hover:border-violet-300/40 hover:bg-violet-500/10 disabled:opacity-50"
          >
            {uploading
              ? <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
              : <Plus className="w-5 h-5 text-white/15" />
            }
            <p className="text-xs text-white/45">{uploading ? 'Upload en cours…' : 'Envoyer un contrat PDF'}</p>
          </button>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = '' }} />
        </>
      )}
    </div>
  )
}

// Logement / Transports
function TabLogement({ logistics, isOrganizer, bookingId, onAdd, onDelete }: {
  logistics: BookingLogistic[]
  isOrganizer: boolean
  bookingId: number
  onAdd: (l: BookingLogistic) => void
  onDelete: (id: number) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [type, setType]         = useState<'HOTEL' | 'TRANSPORT'>('HOTEL')
  const [title, setTitle]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)

  const handleSave = async () => {
    if (!title.trim()) { setError('Le titre est requis.'); return }
    setError('')
    setSaving(true)
    try {
      const form = new FormData()
      form.append('type', type)
      form.append('title', title.trim())
      if (file) form.append('file', file)

      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/logistics`, {
        method: 'POST',
        headers: authHeaders(),
        body: form,
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      onAdd(d.logistic)
      setShowForm(false)
      setTitle('')
      setFile(null)
    } catch {
      setError('Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Formulaire ajout */}
      {isOrganizer && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-cyan-100/65 uppercase tracking-[0.15em]">Hébergement &amp; Transport</p>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="flex min-h-9 items-center gap-1 rounded-lg border border-violet-400/20 bg-violet-500/5 px-2.5 text-[11px] text-violet-200 transition-colors hover:bg-violet-500/10">
              <Plus className="w-3 h-3" /> Ajouter
            </button>
          )}
        </div>
      )}

      {showForm && (
        <div className="space-y-3 rounded-2xl border border-cyan-300/10 bg-gradient-to-br from-cyan-500/8 to-violet-500/5 p-3.5">
          <div className="grid grid-cols-2 gap-2">
            {(['HOTEL', 'TRANSPORT'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`min-h-10 rounded-xl border px-2 text-xs transition-colors ${
                  type === t
                    ? t === 'HOTEL'
                      ? 'bg-emerald-500/10 border-emerald-400/25 text-emerald-200'
                      : 'bg-cyan-500/10 border-cyan-400/25 text-cyan-200'
                    : 'bg-white/[0.025] border-white/10 text-white/50 hover:bg-white/5'
                }`}>
                {t === 'HOTEL' ? <><Bed className="w-3 h-3 inline mr-1" />Logement</> : <><Plane className="w-3 h-3 inline mr-1" />Transport</>}
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={type === 'HOTEL' ? 'Ex : Ibis Lyon Centre, ch. 214' : 'Ex : Vol AF1234 · départ 14h30'}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white/75 outline-none placeholder:text-white/30 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/10"
          />
          <button onClick={() => fileRef.current?.click()}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.025] px-3 text-xs text-white/45 transition-colors hover:border-violet-400/35 hover:text-violet-200">
            <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
            {file ? <span className="text-violet-300">{file.name}</span> : 'Joindre un PDF (optionnel)'}
          </button>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)} />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setShowForm(false); setTitle(''); setFile(null); setError('') }}
              className="min-h-11 flex-1 rounded-xl border border-white/10 text-xs text-white/50 transition-colors hover:bg-white/5">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              className="min-h-11 flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 text-xs font-medium text-white transition hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {/* Liste items */}
      {logistics.length === 0 && !showForm && (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] px-3 py-4 text-center text-xs text-white/35">Aucun élément logistique.</p>
      )}
      {logistics.map(l => (
        <div key={l.id} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-cyan-500/[0.035] p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              l.type === 'HOTEL'
                ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                : 'border border-cyan-400/20 bg-cyan-500/10 text-cyan-200'
            }`}>
              {l.type === 'HOTEL' ? 'Logement' : 'Transport'}
            </span>
            <span className="text-xs font-medium text-white/75 flex-1 truncate">{l.title}</span>
            {isOrganizer && (
              <button onClick={() => onDelete(l.id)} aria-label={`Supprimer ${l.title}`} className="grid h-9 w-9 place-items-center rounded-lg text-white/35 transition-colors hover:bg-rose-500/10 hover:text-rose-300">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {l.fileUrl && (
            <a href={l.fileUrl} target="_blank" rel="noreferrer" download={l.fileName || true}
              className="inline-flex min-h-9 items-center gap-1.5 text-[11px] text-violet-300 transition-colors hover:text-violet-200">
              <Download className="w-3 h-3" /> {l.fileName || 'Télécharger le document'}
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

// Médias promo
function TabMedia({ media, isOrganizer, bookingId, onAdd, onDelete }: {
  media: BookingMedia[]
  isOrganizer: boolean
  bookingId: number
  onAdd: (m: BookingMedia) => void
  onDelete: (id: number) => void
}) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/media`, {
        method: 'POST',
        headers: authHeaders(),
        body: form,
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      onAdd(d.media)
    } catch { /* silently fail */ }
    finally { setUploading(false) }
  }

  const downloadAll = () => {
    media.forEach(m => {
      const a = document.createElement('a')
      a.href = m.url
      a.download = m.name || 'media'
      a.target = '_blank'
      a.click()
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-fuchsia-100/65 uppercase tracking-[0.15em]">Médias promo</p>
        {media.length > 0 && (
          <button onClick={downloadAll}
            className="flex min-h-9 items-center gap-1 rounded-lg border border-violet-400/20 bg-violet-500/5 px-2.5 text-[11px] text-violet-200 transition-colors hover:bg-violet-500/10">
            <Download className="w-3 h-3" /> Tout télécharger
          </button>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-white/40">
        Photos et vidéos partagées par l&apos;organisateur pour promouvoir l&apos;événement.
      </p>

      <div className="grid grid-cols-2 gap-2 min-[460px]:grid-cols-3">
        {media.map(m => (
          <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-cyan-500/5">
            {m.mediaType === 'IMAGE'
              ? <img src={m.url} alt={m.name || ''} className="w-full h-full object-cover" />
              : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-white/20" />
                </div>
              )
            }
            {/* Overlay download */}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <a href={m.url} download={m.name || true} target="_blank" rel="noreferrer"
                className="p-1.5 bg-white/15 rounded-lg hover:bg-white/25 transition-colors">
                <Download className="w-3.5 h-3.5 text-white" />
              </a>
              {isOrganizer && (
                <button onClick={() => onDelete(m.id)}
                  className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/35 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              )}
            </div>
          </div>
        ))}

        {isOrganizer && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-violet-300/20 bg-violet-500/5 transition-colors hover:border-violet-300/40 hover:bg-violet-500/10 disabled:opacity-50"
          >
            {uploading
              ? <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
              : <Plus className="w-5 h-5 text-white/15" />
            }
          </button>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = '' }} />
    </div>
  )
}

// Notes partagées
function TabNotes({ bookingId, initialNotes, targetName }: { bookingId: number; initialNotes: string; targetName: string }) {
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = async (value: string) => {
    setSaving(true)
    try {
      await fetch(`${API_BASE}/api/bookings/${bookingId}/notes`, {
        method:  'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sharedNotes: value }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* silent */ }
    finally { setSaving(false) }
  }

  const handleChange = (v: string) => {
    setNotes(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(v), 1200)
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-white/45">Visibles par l&apos;organisateur et {targetName}</p>
      <textarea
        value={notes}
        onChange={e => handleChange(e.target.value)}
        rows={6}
        placeholder="Écrivez vos notes ici…"
        className="w-full resize-none rounded-2xl border border-violet-300/10 bg-gradient-to-br from-white/[0.055] to-violet-500/[0.035] px-3.5 py-3 text-sm leading-relaxed text-white/70 outline-none placeholder:text-white/25 focus:border-violet-400/35 focus:ring-2 focus:ring-violet-500/10"
      />
      <p className="flex min-h-6 items-center gap-1.5 text-[11px] text-white/35">
        {saved && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />}
        {saving ? 'Sauvegarde…' : saved ? 'Sauvegardé' : 'Sauvegarde automatique'}
      </p>
    </div>
  )
}

/* ─── Composant principal ─────────────────────────────────────────────────── */
interface Props {
  isBookedEvent: boolean
  bookingRequests: BookingItem2[]
  linkedBooking: LinkedBooking | null
  allDocs: DocumentItem[]
  uploadingDoc: boolean
  docError: string
  addDocument: (file: File, type: string) => void
  myProfileId?: number
}

type InnerTab = 'pay' | 'ct' | 'lg' | 'md' | 'nt'

const INNER_TABS: { key: InnerTab; label: string; Icon: React.ElementType }[] = [
  { key: 'pay', label: 'Paiement',  Icon: CreditCard },
  { key: 'ct',  label: 'Contrat',   Icon: FileText },
  { key: 'lg',  label: 'Logement',  Icon: MapPin },
  { key: 'md',  label: 'Médias',    Icon: ImageIcon },
  { key: 'nt',  label: 'Notes',     Icon: StickyNote },
]

export default function EventTabBookings(p: Props) {
  const [selectedId,  setSelectedId]  = useState<number | null>(null)
  const [activeTab,   setActiveTab]   = useState<InnerTab>('pay')
  const [detail,      setDetail]      = useState<BookingDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [fetchError,  setFetchError]  = useState<string | null>(null)

  // Vue artiste/prestataire booké
  if (p.isBookedEvent) {
    return (
      <div className="space-y-4">
        <div className="space-y-4 rounded-2xl border border-violet-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_42%),linear-gradient(135deg,rgba(139,92,246,0.14),rgba(255,255,255,0.035))] p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-violet-300/15 bg-violet-500/10">
              <CreditCard className="h-4 w-4 text-violet-200" aria-hidden="true" />
            </div>
            <p className="text-[11px] font-semibold text-violet-100/70 uppercase tracking-[0.15em]">Informations paiement</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/55">Cachet convenu</span>
            <span className="text-base font-semibold text-white">
              {p.linkedBooking?.fee ? `${Number(p.linkedBooking.fee).toLocaleString('fr-FR')} €` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Statut</span>
            {(() => {
              const pay = PAYMENT_LABEL[p.linkedBooking?.paymentStatus || 'UNPAID']
              return <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-medium ${pay.cls}`}>{pay.label}</span>
            })()}
          </div>
        </div>
        <p className="text-center text-[11px] text-white/40">Le paiement est géré par l&apos;organisateur.</p>
      </div>
    )
  }

  // Fetch détail quand on sélectionne un booking
  const selectBooking = async (id: number) => {
    if (id === selectedId) return
    setSelectedId(id)
    setActiveTab('pay')
    setDetail(null)
    setFetchError(null)
    setLoadingDetail(true)
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${id}`, { headers: authHeaders() })
      if (res.ok) {
        const d = await res.json()
        setDetail(d.booking)
      } else {
        const errData = await res.json().catch(() => ({}))
        setFetchError(`HTTP ${res.status}: ${(errData as { error?: string }).error || 'Erreur inconnue'}`)
      }
    } catch (e) {
      setFetchError(`Network: ${e instanceof Error ? e.message : String(e)}`)
    }
    finally { setLoadingDetail(false) }
  }

  const selectedBooking = p.bookingRequests.find(b => b.id === selectedId)

  const isOrganizer = true // Dans ce contexte on est toujours l'organisateur

  // Callbacks logistique
  const addLogistic = (l: BookingLogistic) =>
    setDetail(prev => prev ? { ...prev, logistics: [l, ...prev.logistics] } : prev)

  const deleteLogistic = async (logId: number) => {
    if (!selectedId) return
    await fetch(`${API_BASE}/api/bookings/${selectedId}/logistics/${logId}`, {
      method: 'DELETE', headers: authHeaders(),
    })
    setDetail(prev => prev ? { ...prev, logistics: prev.logistics.filter(l => l.id !== logId) } : prev)
  }

  // Callbacks media
  const addMedia = (m: BookingMedia) =>
    setDetail(prev => prev ? { ...prev, media: [m, ...prev.media] } : prev)

  const deleteMedia = async (mediaId: number) => {
    if (!selectedId) return
    await fetch(`${API_BASE}/api/bookings/${selectedId}/media/${mediaId}`, {
      method: 'DELETE', headers: authHeaders(),
    })
    setDetail(prev => prev ? { ...prev, media: prev.media.filter(m => m.id !== mediaId) } : prev)
  }

  // Upload contrat (réutilise l'addDocument existant, type CONTRACT)
  const uploadContract = (file: File) => p.addDocument(file, 'CONTRACT')

  return (
    <div
      className="-m-3 flex h-auto min-h-[420px] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.10),transparent_38%),linear-gradient(180deg,rgba(13,15,25,0.98),rgba(8,9,15,0.98))] sm:-m-4 sm:h-full sm:flex-row"
    >
      {/* ── Colonne gauche ── */}
      <div className="flex max-h-[220px] w-full shrink-0 flex-col border-b border-white/8 bg-black/10 sm:max-h-none sm:w-[204px] sm:border-b-0 sm:border-r">
        <div className="flex min-h-12 items-center justify-between border-b border-white/8 bg-violet-500/[0.035] px-3.5">
          <span className="text-[11px] font-semibold text-violet-100/65 uppercase tracking-[0.15em]">Bookings</span>
          <span className="grid h-6 min-w-6 place-items-center rounded-full border border-violet-300/10 bg-violet-500/10 px-1.5 text-[11px] font-medium text-violet-200">{p.bookingRequests.length}</span>
        </div>

        {p.bookingRequests.length === 0 ? (
          <div className="px-3 py-5 text-center">
            <CalendarDays className="mx-auto mb-2 h-5 w-5 text-violet-300/35" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-white/35">Aucun booking lié à cet événement</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {p.bookingRequests.map(b => {
              const st = STATUS_LABEL[b.status] || { label: b.status, cls: 'text-white/40' }
              return (
                <button
                  key={b.id}
                  onClick={() => selectBooking(b.id)}
                  className={`relative flex min-h-[62px] w-full items-center gap-2.5 border-b border-white/5 px-3 py-2.5 text-left transition-colors ${
                    selectedId === b.id ? 'bg-gradient-to-r from-violet-500/15 to-cyan-500/5' : 'hover:bg-white/[0.035]'
                  }`}
                >
                  {/* Barre active */}
                  {selectedId === b.id && (
                    <div className="absolute bottom-2 left-0 top-2 w-0.5 rounded-r bg-gradient-to-b from-violet-400 to-cyan-300" />
                  )}
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-violet-300/15 bg-gradient-to-br from-violet-500/25 to-cyan-500/15 text-[11px] font-semibold text-violet-100">
                    {avatarUrl(b)
                      ? <img src={avatarUrl(b)!} alt="" className="w-full h-full object-cover" />
                      : initials(b)
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[12.5px] font-medium text-white/90">{displayName(b)}</p>
                    <p className="truncate text-[11px] text-white/45">{b.target?.specialty || 'Artiste'}</p>
                  </div>
                  <span className={`inline-flex min-h-6 shrink-0 items-center rounded-full px-2 text-[10px] font-medium ${st.cls}`}>{st.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Colonne droite ── */}
      <div className="flex min-h-[390px] min-w-0 flex-1 flex-col overflow-hidden sm:min-h-0">
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6">
            <div className="mb-1 grid h-12 w-12 place-items-center rounded-2xl border border-violet-300/10 bg-gradient-to-br from-violet-500/12 to-cyan-500/8">
              <CreditCard className="h-5 w-5 text-violet-200/55" />
            </div>
            <p className="text-sm font-medium text-white/50">Sélectionnez un booking</p>
            <p className="text-xs text-white/30">pour voir le détail</p>
          </div>
        ) : (
          <>
            {/* Hero compact */}
            <div className="flex min-h-[68px] items-center gap-3 border-b border-white/8 bg-gradient-to-r from-violet-500/[0.08] to-cyan-500/[0.035] px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-violet-300/20 bg-gradient-to-br from-violet-500/25 to-cyan-500/15 text-[13px] font-semibold text-violet-100">
                {selectedBooking && avatarUrl(selectedBooking)
                  ? <img src={avatarUrl(selectedBooking)!} alt="" className="w-full h-full object-cover" />
                  : selectedBooking ? initials(selectedBooking) : '?'
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-white/95">
                  {selectedBooking ? displayName(selectedBooking) : '…'}
                </p>
                <p className="text-[11px] text-white/50">
                  {selectedBooking?.target?.specialty || 'Artiste'} · {STATUS_LABEL[selectedBooking?.status || '']?.label || '—'}
                </p>
              </div>
              {selectedBooking?.fee && (
                <div className="text-right shrink-0">
                  <p className="text-base font-semibold text-white/90">{Number(selectedBooking.fee).toLocaleString('fr-FR')} €</p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/40">Cachet</p>
                </div>
              )}
            </div>

            {/* Onglets */}
            <div className="flex shrink-0 overflow-x-auto border-b border-white/8 bg-black/10 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {INNER_TABS.map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`flex min-h-12 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-xs font-medium transition-colors ${
                    activeTab === key
                      ? 'border-violet-400 bg-violet-500/[0.055] text-violet-200'
                      : 'border-transparent text-white/45 hover:bg-white/[0.025] hover:text-white/75'
                  }`}
                  style={{ marginBottom: '-1px' }}>
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Contenu onglets */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {loadingDetail ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                </div>
              ) : detail ? (
                <>
                  {activeTab === 'pay' && (
                    <TabPayment booking={detail} isOrganizer={isOrganizer} />
                  )}
                  {activeTab === 'ct' && (
                    <TabContrat
                      docs={p.allDocs}
                      isOrganizer={isOrganizer}
                      onUpload={uploadContract}
                      uploading={p.uploadingDoc}
                    />
                  )}
                  {activeTab === 'lg' && (
                    <TabLogement
                      logistics={detail.logistics}
                      isOrganizer={isOrganizer}
                      bookingId={detail.id}
                      onAdd={addLogistic}
                      onDelete={deleteLogistic}
                    />
                  )}
                  {activeTab === 'md' && (
                    <TabMedia
                      media={detail.media}
                      isOrganizer={isOrganizer}
                      bookingId={detail.id}
                      onAdd={addMedia}
                      onDelete={deleteMedia}
                    />
                  )}
                  {activeTab === 'nt' && (
                    <TabNotes
                      bookingId={detail.id}
                      initialNotes={detail.sharedNotes || ''}
                      targetName={selectedBooking ? displayName(selectedBooking) : 'l\'artiste'}
                    />
                  )}
                </>
              ) : (
                <p className="rounded-xl border border-rose-400/10 bg-rose-500/5 px-3 py-6 text-center text-xs text-rose-200/70">Impossible de charger le détail.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
