'use client'
// StaffEventView.tsx — Vue lecture seule d'un événement pour le personnel assigné
// Affiche : infos pratiques, rôle, cachet, documents partagés

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { X, MapPin, Calendar, Clock, Tag, Briefcase, FileText, Download, Euro } from 'lucide-react'
import { getAuthToken } from '@/lib/getToken'

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

const FILE_ICON: Record<string, string> = {
  contract: '📄', invoice: '🧾', rider: '🎼', other: '📎',
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
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#0c0f18' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
        <span className="text-xs font-semibold tracking-widest uppercase text-purple-400">Mon événement</span>
        <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-32 text-white/40 text-sm">Chargement…</div>
        )}
        {error && (
          <div className="flex items-center justify-center h-32 text-red-400 text-sm">Impossible de charger l'événement.</div>
        )}
        {data && (
          <>
            {/* Cover image */}
            {data.event.coverImage && (
              <div className="relative w-full h-36 flex-shrink-0">
                <Image src={data.event.coverImage} alt={data.event.title} fill className="object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f18] via-transparent to-transparent" />
              </div>
            )}

            <div className="px-4 py-4 space-y-5">
              {/* Titre + statut */}
              <div>
                <h2 className="text-white font-bold text-lg leading-snug">{data.event.title}</h2>
                {data.event.category && (
                  <span className="inline-block mt-1 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-full px-2 py-0.5">
                    {data.event.category}
                  </span>
                )}
              </div>

              {/* Mon rôle */}
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3 space-y-1">
                <div className="flex items-center gap-2 text-purple-300 text-sm font-medium">
                  <Briefcase className="w-3.5 h-3.5" />
                  Mon rôle
                </div>
                <p className="text-white font-semibold">{data.staffRole}</p>
                {data.staffFee != null && (
                  <div className="flex items-center gap-1 text-green-400 text-sm mt-1">
                    <Euro className="w-3 h-3" />
                    <span>{data.staffFee.toFixed(2)} €</span>
                  </div>
                )}
              </div>

              {/* Date & heure */}
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-white/70 text-sm">
                  <Calendar className="w-4 h-4 mt-0.5 text-white/40 flex-shrink-0" />
                  <div>
                    <p>{fmt(data.event.start)}</p>
                    {data.event.end && data.event.start.slice(0,10) !== data.event.end.slice(0,10) && (
                      <p className="text-white/40 text-xs">→ {fmt(data.event.end)}</p>
                    )}
                  </div>
                </div>
                {!data.event.allDay && (
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <Clock className="w-4 h-4 text-white/40 flex-shrink-0" />
                    <span>
                      {fmtTime(data.event.start)}
                      {data.event.end && ` → ${fmtTime(data.event.end)}`}
                    </span>
                  </div>
                )}
                {data.event.lieu && (
                  <div className="flex items-start gap-2 text-white/70 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 text-white/40 flex-shrink-0" />
                    <span>{data.event.lieu}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {data.event.description && (
                <div className="space-y-1.5">
                  <p className="text-xs text-white/40 uppercase tracking-widest font-medium">Description</p>
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{data.event.description}</p>
                </div>
              )}

              {/* Documents */}
              {data.event.documents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-white/40 uppercase tracking-widest font-medium flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Documents partagés
                  </p>
                  <div className="space-y-2">
                    {data.event.documents.map(doc => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/3 hover:bg-white/6 px-3 py-2.5 transition-colors group"
                      >
                        <span className="text-base">{FILE_ICON[doc.fileType || 'other'] || '📎'}</span>
                        <span className="flex-1 text-sm text-white/70 group-hover:text-white truncate">{doc.name}</span>
                        <Download className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {data.event.documents.length === 0 && !data.event.description && (
                <p className="text-white/30 text-sm text-center py-4">Aucune information supplémentaire partagée.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
