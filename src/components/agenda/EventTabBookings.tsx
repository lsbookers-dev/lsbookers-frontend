// agenda/EventTabBookings.tsx — Onglet Bookings : liste gauche + panneau droit 5 onglets
'use client'

import { useState, useEffect, useRef } from 'react'
import { getAuthToken } from '@/utils/auth'
import {
  CreditCard, FileText, MapPin, Image as ImageIcon, StickyNote,
  Plus, Download, Eye, Trash2, Bed, Plane, Loader2, X,
} from 'lucide-react'
import { BookingItem2, BookingDetail, BookingLogistic, BookingMedia, DocumentItem, LinkedBooking } from './types'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? getAuthToken() : null
  return t ? { Authorization: `Bearer ${t}` } : {}
}

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const PAYMENT_LABEL: Record<string, { label: string; cls: string }> = {
  UNPAID:  { label: 'Non payé',   cls: 'bg-red-500/10 text-red-400' },
  DEPOSIT: { label: 'Acompte',    cls: 'bg-yellow-500/10 text-yellow-300' },
  PAID:    { label: 'Payé',       cls: 'bg-emerald-500/10 text-emerald-400' },
}
const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'En cours',  cls: 'bg-yellow-500/10 text-yellow-300' },
  ACCEPTED:  { label: 'Confirmé',  cls: 'bg-emerald-500/10 text-emerald-400' },
  DECLINED:  { label: 'Refusé',    cls: 'bg-red-500/10 text-red-400' },
  CANCELLED: { label: 'Annulé',    cls: 'bg-white/5 text-white/30' },
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
        <div className="bg-white/4 border border-white/7 rounded-xl p-3">
          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Payé</p>
          <p className="text-base font-semibold text-emerald-400">{paid.toLocaleString('fr-FR')} €</p>
          {booking.paymentStatus === 'DEPOSIT' && <p className="text-[10px] text-white/20 mt-0.5">Acompte 50 %</p>}
        </div>
        <div className="bg-white/4 border border-white/7 rounded-xl p-3">
          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Restant</p>
          <p className={`text-base font-semibold ${remaining > 0 ? 'text-yellow-300' : 'text-white/30'}`}>
            {remaining.toLocaleString('fr-FR')} €
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2.5 py-1 rounded-full ${pay.cls}`}>{pay.label}</span>
      </div>
      {isOrganizer && (
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5248e8] text-white text-sm font-medium transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.98 2.01c-3.85-.34-7.41 1.54-9.24 4.88a9.01 9.01 0 0 0 3.31 12.27A9 9 0 0 0 21.01 10c0-4.48-3.27-8.2-7.03-7.99zm.02 2.99a6 6 0 1 1 0 12A6 6 0 0 1 14 5zm-1 3v4l3.5 2-.75 1.23L12 13.5V8h1z"/></svg>
          Réaliser le paiement
        </button>
      )}
      {!isOrganizer && (
        <p className="text-[10px] text-white/25 italic">Le paiement est géré par l&apos;organisateur.</p>
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
        <p className="text-xs text-white/20 italic">Aucun contrat pour cet événement.</p>
      )}
      {contracts.map(d => (
        <div key={d.id} className="flex items-center gap-2 px-3 py-2.5 bg-white/4 rounded-xl border border-white/7">
          <FileText className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="flex-1 min-w-0 text-xs text-white/55 truncate">{d.name}</span>
          <a href={d.url} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-[11px] text-violet-400 border border-violet-500/25 rounded-md px-2 py-0.5 hover:bg-violet-500/10 transition-colors shrink-0">
            <Eye className="w-3 h-3" /> Voir
          </a>
        </div>
      ))}
      {isOrganizer && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full border border-dashed border-white/10 hover:border-violet-500/40 rounded-xl py-4 flex flex-col items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
          >
            {uploading
              ? <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
              : <Plus className="w-5 h-5 text-white/15" />
            }
            <p className="text-xs text-white/20">{uploading ? 'Upload en cours…' : 'Envoyer un contrat PDF'}</p>
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
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Hébergement &amp; Transport</p>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1 text-[11px] text-violet-400 border border-violet-500/25 rounded-md px-2 py-0.5 hover:bg-violet-500/10 transition-colors">
              <Plus className="w-3 h-3" /> Ajouter
            </button>
          )}
        </div>
      )}

      {showForm && (
        <div className="bg-white/3 border border-white/8 rounded-xl p-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            {(['HOTEL', 'TRANSPORT'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`py-1.5 rounded-lg border text-xs transition-colors ${
                  type === t
                    ? t === 'HOTEL'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    : 'bg-white/3 border-white/8 text-white/35 hover:bg-white/6'
                }`}>
                {t === 'HOTEL' ? <><Bed className="w-3 h-3 inline mr-1" />Logement</> : <><Plane className="w-3 h-3 inline mr-1" />Transport</>}
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={type === 'HOTEL' ? 'Ex : Ibis Lyon Centre, ch. 214' : 'Ex : Vol AF1234 · départ 14h30'}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 placeholder-white/20 outline-none focus:border-emerald-500/35"
          />
          <button onClick={() => fileRef.current?.click()}
            className="w-full border border-dashed border-white/10 rounded-lg py-2 text-xs text-white/25 hover:border-violet-500/35 transition-colors">
            {file ? <span className="text-violet-400">{file.name}</span> : '📎 Joindre un PDF (optionnel)'}
          </button>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)} />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setShowForm(false); setTitle(''); setFile(null); setError('') }}
              className="flex-1 py-1.5 rounded-lg border border-white/10 text-xs text-white/30 hover:bg-white/5 transition-colors">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-1.5 rounded-lg bg-emerald-600/70 hover:bg-emerald-600 text-white text-xs font-medium transition-colors disabled:opacity-50">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {/* Liste items */}
      {logistics.length === 0 && !showForm && (
        <p className="text-xs text-white/20 italic">Aucun élément logistique.</p>
      )}
      {logistics.map(l => (
        <div key={l.id} className="bg-white/4 border border-white/7 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              l.type === 'HOTEL'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-blue-500/10 text-blue-400'
            }`}>
              {l.type === 'HOTEL' ? 'Logement' : 'Transport'}
            </span>
            <span className="text-xs font-medium text-white/75 flex-1 truncate">{l.title}</span>
            {isOrganizer && (
              <button onClick={() => onDelete(l.id)} className="text-white/20 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {l.fileUrl && (
            <a href={l.fileUrl} target="_blank" rel="noreferrer" download={l.fileName || true}
              className="flex items-center gap-1.5 text-[11px] text-violet-400 hover:text-violet-300 transition-colors">
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
        <p className="text-[10px] text-white/30 uppercase tracking-wider">Médias promo</p>
        {media.length > 0 && (
          <button onClick={downloadAll}
            className="flex items-center gap-1 text-[11px] text-violet-400 border border-violet-500/25 rounded-md px-2 py-0.5 hover:bg-violet-500/10 transition-colors">
            <Download className="w-3 h-3" /> Tout télécharger
          </button>
        )}
      </div>

      <p className="text-[11px] text-white/20">
        Photos et vidéos partagées par l&apos;organisateur pour promouvoir l&apos;événement.
      </p>

      <div className="grid grid-cols-3 gap-1.5">
        {media.map(m => (
          <div key={m.id} className="relative aspect-square bg-white/4 border border-white/7 rounded-lg overflow-hidden group">
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
            className="aspect-square border border-dashed border-white/10 hover:border-violet-500/35 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
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
      <p className="text-[10px] text-white/25">Visibles par l&apos;organisateur et {targetName}</p>
      <textarea
        value={notes}
        onChange={e => handleChange(e.target.value)}
        rows={6}
        placeholder="Écrivez vos notes ici…"
        className="w-full bg-white/4 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white/60 placeholder-white/15 resize-none outline-none focus:border-emerald-500/35 transition-colors"
      />
      <p className="text-[10px] text-white/20">
        {saving ? 'Sauvegarde…' : saved ? '✓ Sauvegardé' : 'Sauvegarde automatique'}
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
            {(() => {
              const pay = PAYMENT_LABEL[p.linkedBooking?.paymentStatus || 'UNPAID']
              return <span className={`text-xs px-2.5 py-0.5 rounded-full ${pay.cls}`}>{pay.label}</span>
            })()}
          </div>
        </div>
        <p className="text-[10px] text-white/25 text-center">Le paiement est géré par l&apos;organisateur.</p>
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
    <div className="flex h-full min-h-[420px]" style={{ margin: '-16px' }}>
      {/* ── Colonne gauche ── */}
      <div className="w-[188px] shrink-0 border-r border-white/7 flex flex-col">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/6">
          <span className="text-[10px] font-medium text-white/35 uppercase tracking-wider">Bookings</span>
          <span className="text-[10px] bg-white/7 text-white/35 rounded-full px-1.5 py-0.5">{p.bookingRequests.length}</span>
        </div>

        {p.bookingRequests.length === 0 ? (
          <p className="text-xs text-white/20 italic text-center py-6 px-3">Aucun booking lié à cet événement</p>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {p.bookingRequests.map(b => {
              const st = STATUS_LABEL[b.status] || { label: b.status, cls: 'text-white/40' }
              return (
                <button
                  key={b.id}
                  onClick={() => selectBooking(b.id)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2.5 border-b border-white/4 transition-colors relative ${
                    selectedId === b.id ? 'bg-white/5' : 'hover:bg-white/3'
                  }`}
                >
                  {/* Barre active */}
                  {selectedId === b.id && (
                    <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-emerald-500" />
                  )}
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-[10px] bg-violet-500/20 text-violet-300 flex items-center justify-center text-[11px] font-semibold shrink-0 overflow-hidden border border-white/5">
                    {avatarUrl(b)
                      ? <img src={avatarUrl(b)!} alt="" className="w-full h-full object-cover" />
                      : initials(b)
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium text-white/85 truncate">{displayName(b)}</p>
                    <p className="text-[10.5px] text-white/30 truncate">{b.target?.specialty || 'Artiste'}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${st.cls}`}>{st.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Colonne droite ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6">
            <div className="w-10 h-10 rounded-xl bg-white/4 flex items-center justify-center mb-1">
              <CreditCard className="w-5 h-5 text-white/15" />
            </div>
            <p className="text-sm text-white/25">Sélectionnez un booking</p>
            <p className="text-xs text-white/15">pour voir le détail</p>
          </div>
        ) : (
          <>
            {/* Hero compact */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center text-[13px] font-semibold shrink-0 border border-violet-500/20 overflow-hidden">
                {selectedBooking && avatarUrl(selectedBooking)
                  ? <img src={avatarUrl(selectedBooking)!} alt="" className="w-full h-full object-cover" />
                  : selectedBooking ? initials(selectedBooking) : '?'
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium text-white/90 truncate">
                  {selectedBooking ? displayName(selectedBooking) : '…'}
                </p>
                <p className="text-[11px] text-white/30">
                  {selectedBooking?.target?.specialty || 'Artiste'} · {STATUS_LABEL[selectedBooking?.status || '']?.label || '—'}
                </p>
              </div>
              {selectedBooking?.fee && (
                <div className="text-right shrink-0">
                  <p className="text-[15px] font-semibold text-white/85">{Number(selectedBooking.fee).toLocaleString('fr-FR')} €</p>
                  <p className="text-[10px] text-white/25 uppercase tracking-wider">Cachet</p>
                </div>
              )}
            </div>

            {/* Onglets */}
            <div className="flex border-b border-white/6 overflow-x-auto px-2">
              {INNER_TABS.map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1 px-2.5 py-2 text-[11.5px] border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === key
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-white/30 hover:text-white/55'
                  }`}
                  style={{ marginBottom: '-1px' }}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Contenu onglets */}
            <div className="flex-1 overflow-y-auto p-4">
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
                <div className="py-8 text-center space-y-1">
                  <p className="text-xs text-white/20 italic">Impossible de charger le détail.</p>
                  {fetchError && <p className="text-[10px] text-red-400/60 font-mono break-all">{fetchError}</p>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
