'use client'
// StaffEventView.tsx — Vue lecture seule d'un événement pour le personnel assigné
// Affiche : infos pratiques, rôle, cachet, documents partagés

import { useEffect, useState, useCallback } from 'react'
import type { ElementType } from 'react'
import Image from 'next/image'
import {
  X, MapPin, Calendar, Clock, Tag, Briefcase, FileText, Download, Euro,
  Receipt, Music2, Paperclip,
} from 'lucide-react'
import { getAuthToken } from '@/utils/auth'

type EventDocument = {
  id: number
  name: string
  url: string
  fileType: string | null
  createdAt: string
}

type StaffEventData = {
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
    documents: EventDocument[]
  }
  staffRole: string
  staffFee: number | null
}

interface Props {
  eventId: number
  api: string
  onClose: () => void
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const FILE_ICON: Record<string, ElementType> = {
  contract: FileText, invoice: Receipt, rider: Music2, other: Paperclip,
}

export default function StaffEventView({ eventId, api, onClose }: Props) {
  const [data, setData] = useState<StaffEventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(false)
    try {
      const token = getAuthToken()
      const res = await fetch(`${api}/api/events/${eventId}/staff-view`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setData(await res.json())
      else setError(true)
    } catch { setError(true) }
    finally { setLoading(false) }
  }, [api, eventId])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.11),transparent_34%),radial-gradient(circle_at_top_left,rgba(139,92,246,0.16),transparent_42%),linear-gradient(180deg,#0d1020,#090a11_62%)]">
      {/* Header */}
      <div className="flex min-h-14 flex-shrink-0 items-center justify-between border-b border-white/10 bg-black/10 px-4 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl border border-violet-300/15 bg-gradient-to-br from-violet-500/20 to-cyan-500/10">
            <Calendar className="h-4 w-4 text-violet-200" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-violet-100/75">Mon événement</span>
        </div>
        <button onClick={onClose} aria-label="Fermer" className="grid h-11 w-11 place-items-center rounded-xl text-white/45 transition-colors hover:bg-white/5 hover:text-white/85">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex h-36 items-center justify-center text-sm text-white/45">Chargement…</div>
        )}
        {error && (
          <div className="m-4 flex h-32 items-center justify-center rounded-2xl border border-rose-400/15 bg-rose-500/5 px-4 text-center text-sm text-rose-200">Impossible de charger l'événement.</div>
        )}
        {data && (
          <>
            {/* Cover image */}
            {data.event.coverImage && (
              <div className="relative h-40 w-full flex-shrink-0 sm:h-48">
                <Image src={data.event.coverImage} alt={data.event.title} fill className="object-cover opacity-85" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1020] via-[#0d1020]/20 to-transparent" />
              </div>
            )}

            <div className="space-y-5 px-4 py-5 sm:px-5">
              {/* Titre + statut */}
              <div>
                <h2 className="text-xl font-semibold leading-snug tracking-tight text-white">{data.event.title}</h2>
                {data.event.category && (
                  <span className="mt-2 inline-flex min-h-7 items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 text-xs font-medium text-violet-200">
                    <Tag className="h-3 w-3" aria-hidden="true" />
                    {data.event.category}
                  </span>
                )}
              </div>

              {/* Mon rôle */}
              <div className="space-y-2 rounded-2xl border border-violet-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_46%),linear-gradient(135deg,rgba(139,92,246,0.16),rgba(255,255,255,0.035))] px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-medium text-violet-200">
                  <Briefcase className="w-3.5 h-3.5" />
                  Mon rôle
                </div>
                <p className="text-base font-semibold text-white">{data.staffRole}</p>
                {data.staffFee != null && (
                  <div className="mt-1 flex items-center gap-1 text-sm font-medium text-emerald-200">
                    <Euro className="w-3 h-3" />
                    <span>{data.staffFee.toFixed(2)} €</span>
                  </div>
                )}
              </div>

              {/* Date & heure */}
              <div className="space-y-2 rounded-2xl border border-white/8 bg-white/[0.035] p-3.5">
                <div className="flex items-start gap-2.5 text-sm text-white/75">
                  <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-300" />
                  <div>
                    <p>{fmt(data.event.start)}</p>
                    {data.event.end && data.event.start.slice(0,10) !== data.event.end.slice(0,10) && (
                      <p className="mt-0.5 text-xs text-white/45">→ {fmt(data.event.end)}</p>
                    )}
                  </div>
                </div>
                {!data.event.allDay && (
                  <div className="flex items-center gap-2.5 text-sm text-white/75">
                    <Clock className="h-4 w-4 flex-shrink-0 text-cyan-300" />
                    <span>
                      {fmtTime(data.event.start)}
                      {data.event.end && ` → ${fmtTime(data.event.end)}`}
                    </span>
                  </div>
                )}
                {data.event.lieu && (
                  <div className="flex items-start gap-2.5 text-sm text-white/75">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-fuchsia-300" />
                    <span>{data.event.lieu}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {data.event.description && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-100/55">Description</p>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-white/70">{data.event.description}</p>
                </div>
              )}

              {/* Documents */}
              {data.event.documents.length > 0 && (
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100/60">
                    <FileText className="w-3.5 h-3.5" />
                    Documents partagés
                  </p>
                  <div className="space-y-2">
                    {data.event.documents.map(doc => {
                      const DocIcon = FILE_ICON[doc.fileType || 'other'] || Paperclip
                      return (
                        <a
                          key={doc.id}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex min-h-12 items-center gap-3 rounded-xl border border-cyan-300/10 bg-gradient-to-r from-cyan-500/[0.07] to-violet-500/[0.045] px-3 transition-colors hover:border-cyan-300/20 hover:from-cyan-500/10"
                        >
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-cyan-300/10 bg-cyan-500/10">
                            <DocIcon className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                          </div>
                          <span className="flex-1 truncate text-sm text-white/70 group-hover:text-white">{doc.name}</span>
                          <Download className="h-4 w-4 flex-shrink-0 text-white/35 group-hover:text-white/65" />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {data.event.documents.length === 0 && !data.event.description && (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-4 py-6 text-center text-sm text-white/40">Aucune information supplémentaire partagée.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
