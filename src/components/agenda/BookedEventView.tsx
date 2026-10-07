'use client'
// BookedEventView.tsx — Vue d'un événement pour l'artiste / le prestataire booké dessus
// Onglets : Détails · Contrat & Paiement · Transports & Hébergement · Médias · Matériel & Notes
// (pas de budget, dépenses, personnel ni offres : ça reste réservé à l'organisateur)

import { useEffect, useState, useCallback } from 'react'
import type { ElementType } from 'react'
import Image from 'next/image'
import {
  X, MapPin, Calendar, Clock, Tag, Briefcase, Euro, UserRound, Loader2,
  ListChecks, FileSignature, Plane, Image as ImageIcon, StickyNote, Download, Paperclip,
} from 'lucide-react'
import { apiFetch } from '@/utils/auth'
import type { BookingContract, BookingDetail, BookingLogistic, DocumentItem } from './types'
import { PAYMENT_LABEL, TabContrat, TabLogement, TabMedia, TabNotes } from './EventTabBookings'

type StaffViewData = {
  event: {
    id: number
    title: string
    description: string | null
    start: string
    end: string | null
    allDay: boolean
    lieu: string | null
    category: string | null
    status: string
    coverImage: string | null
    documents: DocumentItem[]
  }
  organizer: { userId: number | null; profileId: number; name: string; avatar: string | null }
  staffRole: string
  staffFee: number | null
  booking: { id: number; fee: number | null; paymentStatus: string | null } | null
}

type TabKey = 'details' | 'contract' | 'travel' | 'media' | 'notes'

const TABS: { key: TabKey; label: string; Icon: ElementType }[] = [
  { key: 'details',  label: 'Détails',                   Icon: ListChecks },
  { key: 'contract', label: 'Contrat & Paiement',        Icon: FileSignature },
  { key: 'travel',   label: 'Transports & Hébergement',  Icon: Plane },
  { key: 'media',    label: 'Médias',                    Icon: ImageIcon },
  { key: 'notes',    label: 'Matériel & Notes',          Icon: StickyNote },
]

const ROLE_LABEL: Record<string, string> = { ARTIST: 'Artiste', PROVIDER: 'Prestataire', ORGANIZER: 'Organisateur' }

// Types de documents d'événement (ajoutés par l'organisateur sur son événement)
const isContractDoc = (d: DocumentItem) => d.fileType?.toUpperCase() === 'CONTRACT'
const isTravelDoc   = (d: DocumentItem) => ['TRANSPORT', 'HOTEL'].includes(d.fileType?.toUpperCase())

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

interface Props {
  eventId: number
  api: string
  onClose: () => void
}

export default function BookedEventView({ eventId, api, onClose }: Props) {
  const [data, setData] = useState<StaffViewData | null>(null)
  const [detail, setDetail] = useState<BookingDetail | null>(null)
  const [myProfileId, setMyProfileId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<TabKey>('details')

  const load = useCallback(async () => {
    setLoading(true); setError(false)
    try {
      const res = await apiFetch(`${api}/api/events/${eventId}/staff-view`)
      if (!res.ok) { setError(true); return }
      const d: StaffViewData = await res.json()
      setData(d)
      if (d.booking) {
        const bRes = await apiFetch(`${api}/api/bookings/${d.booking.id}`)
        if (bRes.ok) {
          const b = await bRes.json()
          setDetail(b.booking)
          setMyProfileId(b.myProfileId ?? null)
        }
      }
    } catch { setError(true) }
    finally { setLoading(false) }
  }, [api, eventId])

  useEffect(() => { load() }, [load])

  /* ── Mises à jour locales après ajout / suppression ── */
  const addLogistic = (l: BookingLogistic) =>
    setDetail(prev => prev ? { ...prev, logistics: [l, ...prev.logistics] } : prev)
  const deleteLogistic = async (logId: number) => {
    if (!detail) return
    const res = await apiFetch(`${api}/api/bookings/${detail.id}/logistics/${logId}`, { method: 'DELETE' })
    if (res.ok) setDetail(prev => prev ? { ...prev, logistics: prev.logistics.filter(l => l.id !== logId) } : prev)
  }
  const addContract = (c: BookingContract) =>
    setDetail(prev => prev ? { ...prev, contracts: [...(prev.contracts || []), c] } : prev)
  const deleteContract = async (contractId: number) => {
    if (!detail) return
    const res = await apiFetch(`${api}/api/bookings/${detail.id}/contracts/${contractId}`, { method: 'DELETE' })
    if (res.ok) setDetail(prev => prev ? { ...prev, contracts: (prev.contracts || []).filter(c => c.id !== contractId) } : prev)
  }

  const ev = data?.event
  const docs = ev?.documents || []
  const fee = detail?.fee ?? data?.booking?.fee ?? data?.staffFee ?? null
  const pay = PAYMENT_LABEL[detail?.paymentStatus || data?.booking?.paymentStatus || 'UNPAID'] || PAYMENT_LABEL.UNPAID
  const organizerName = data?.organizer?.name || 'l\'organisateur'

  const noBooking = (
    <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] px-3 py-4 text-center text-xs text-white/40">
      Disponible uniquement pour un booking confirmé via une proposition de booking.
    </p>
  )

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.11),transparent_34%),radial-gradient(circle_at_top_left,rgba(139,92,246,0.16),transparent_42%),linear-gradient(180deg,#0d1020,#090a11_62%)]">
      {/* En-tête */}
      <div className="flex min-h-14 flex-shrink-0 items-center justify-between border-b border-white/10 bg-black/10 px-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-violet-300/15 bg-gradient-to-br from-violet-500/20 to-cyan-500/10">
            <Calendar className="h-4 w-4 text-violet-200" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-100/60">Je suis booké</p>
            <p className="truncate text-sm font-semibold text-white">{ev?.title || '…'}</p>
          </div>
        </div>
        <button onClick={onClose} aria-label="Fermer" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white/45 transition-colors hover:bg-white/5 hover:text-white/85">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Onglets */}
      {data && (
        <div className="flex shrink-0 overflow-x-auto border-b border-white/8 bg-black/10 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex min-h-12 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-xs font-medium transition-colors ${
                tab === key
                  ? 'border-violet-400 bg-violet-500/[0.055] text-violet-200'
                  : 'border-transparent text-white/45 hover:bg-white/[0.025] hover:text-white/75'
              }`}
              style={{ marginBottom: '-1px' }}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex h-36 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
        )}
        {error && (
          <div className="m-4 flex h-32 items-center justify-center rounded-2xl border border-rose-400/15 bg-rose-500/5 px-4 text-center text-sm text-rose-200">Impossible de charger l&apos;événement.</div>
        )}

        {data && ev && !loading && (
          <div className="space-y-4 px-4 py-5 sm:px-5">

            {/* ── Détails ── */}
            {tab === 'details' && (
              <>
                {ev.coverImage && (
                  <div className="relative h-40 w-full overflow-hidden rounded-2xl sm:h-48">
                    <Image src={ev.coverImage} alt={ev.title} fill className="object-cover opacity-90" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold leading-snug tracking-tight text-white">{ev.title}</h2>
                  {ev.category && (
                    <span className="mt-2 inline-flex min-h-7 items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 text-xs font-medium text-violet-200">
                      <Tag className="h-3 w-3" aria-hidden="true" /> {ev.category}
                    </span>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <InfoCard icon={UserRound} label="Organisateur" value={organizerName} />
                  <InfoCard icon={Briefcase} label="Mon rôle" value={ROLE_LABEL[data.staffRole] || data.staffRole} />
                </div>

                <div className="space-y-2 rounded-2xl border border-white/8 bg-white/[0.035] p-3.5">
                  <div className="flex items-start gap-2.5 text-sm text-white/75">
                    <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-300" aria-hidden="true" />
                    <div>
                      <p className="capitalize">{fmtDate(ev.start)}</p>
                      {ev.end && ev.start.slice(0, 10) !== ev.end.slice(0, 10) && (
                        <p className="mt-0.5 text-xs text-white/45">→ {fmtDate(ev.end)}</p>
                      )}
                    </div>
                  </div>
                  {!ev.allDay && (
                    <div className="flex items-center gap-2.5 text-sm text-white/75">
                      <Clock className="h-4 w-4 flex-shrink-0 text-cyan-300" aria-hidden="true" />
                      <span>{fmtTime(ev.start)}{ev.end && ` → ${fmtTime(ev.end)}`}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2.5 text-sm text-white/75">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-fuchsia-300" aria-hidden="true" />
                    <span>{ev.lieu || 'Lieu non précisé'}</span>
                  </div>
                </div>

                {ev.description && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-100/55">Description</p>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-white/70">{ev.description}</p>
                  </div>
                )}
              </>
            )}

            {/* ── Contrat & Paiement ── */}
            {tab === 'contract' && (
              <>
                <div className="space-y-3 rounded-2xl border border-violet-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_42%),linear-gradient(135deg,rgba(139,92,246,0.14),rgba(255,255,255,0.035))] p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-white/55"><Euro className="h-3.5 w-3.5" aria-hidden="true" /> Cachet convenu</span>
                    <span className="text-base font-semibold text-white">{fee != null ? `${Number(fee).toLocaleString('fr-FR')} €` : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/55">Statut du paiement</span>
                    <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-medium ${pay.cls}`}>{pay.label}</span>
                  </div>
                  <p className="text-[11px] text-white/40">Le statut du paiement est mis à jour par {organizerName}.</p>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-violet-100/60">Contrat</p>
                {detail ? (
                  <TabContrat
                    contracts={detail.contracts || []}
                    bookingId={detail.id}
                    myProfileId={myProfileId}
                    onAdd={addContract}
                    onDelete={deleteContract}
                    eventDocs={docs.filter(isContractDoc)}
                  />
                ) : <DocList docs={docs.filter(isContractDoc)} empty="Aucun contrat partagé." />}
              </>
            )}

            {/* ── Transports & Hébergement ── */}
            {tab === 'travel' && (
              <>
                {detail ? (
                  <TabLogement
                    logistics={detail.logistics}
                    isOrganizer={false}
                    myProfileId={myProfileId}
                    otherName={organizerName}
                    bookingId={detail.id}
                    onAdd={addLogistic}
                    onDelete={deleteLogistic}
                  />
                ) : noBooking}
                {docs.some(isTravelDoc) && (
                  <>
                    <p className="pt-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-100/60">Documents de l&apos;événement</p>
                    <DocList docs={docs.filter(isTravelDoc)} empty="" />
                  </>
                )}
              </>
            )}

            {/* ── Médias ── */}
            {tab === 'media' && (
              <>
                {detail ? (
                  <TabMedia media={detail.media} isOrganizer={false} bookingId={detail.id} onAdd={() => {}} onDelete={() => {}} />
                ) : noBooking}
                <p className="pt-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-100/60">Documents partagés par {organizerName}</p>
                <DocList docs={docs.filter(d => !isContractDoc(d) && !isTravelDoc(d))} empty="Aucun document partagé." />
              </>
            )}

            {/* ── Matériel & Notes ── */}
            {tab === 'notes' && (
              detail ? (
                <div className="space-y-2">
                  <p className="text-xs leading-relaxed text-white/55">
                    Rider technique, matériel nécessaire, horaires d&apos;arrivée, demandes particulières… Ces notes sont partagées
                    avec {organizerName}, qui peut aussi y répondre.
                  </p>
                  <TabNotes
                    bookingId={detail.id}
                    initialNotes={detail.sharedNotes || ''}
                    onSaved={v => setDetail(prev => prev ? { ...prev, sharedNotes: v } : prev)}
                    targetName={organizerName}
                    placeholder="Ex : 2 micros HF, une table de 2 m, arrivée 18h pour la balance…"
                  />
                </div>
              ) : noBooking
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-500/12 to-cyan-500/5 px-4 py-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-100/55">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

function DocList({ docs, empty }: { docs: DocumentItem[]; empty: string }) {
  if (docs.length === 0) {
    return empty ? <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] px-3 py-4 text-center text-xs text-white/35">{empty}</p> : null
  }
  return (
    <div className="space-y-2">
      {docs.map(doc => (
        <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer"
          className="group flex min-h-12 items-center gap-3 rounded-xl border border-cyan-300/10 bg-gradient-to-r from-cyan-500/[0.07] to-violet-500/[0.045] px-3 transition-colors hover:border-cyan-300/20">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-cyan-300/10 bg-cyan-500/10">
            <Paperclip className="h-4 w-4 text-cyan-200" aria-hidden="true" />
          </div>
          <span className="flex-1 truncate text-sm text-white/70 group-hover:text-white">{doc.name}</span>
          <Download className="h-4 w-4 flex-shrink-0 text-white/35 group-hover:text-white/65" aria-hidden="true" />
        </a>
      ))}
    </div>
  )
}
