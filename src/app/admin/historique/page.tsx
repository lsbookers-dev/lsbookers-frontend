'use client'

// Admin › Historique : journal de toutes les actions faites depuis l'admin et des connexions au compte admin

import { useCallback, useEffect, useState } from 'react'
import { History, Search, RefreshCw } from 'lucide-react'
import { apiFetch } from '@/utils/auth'
import { ADMIN_LOG_LABELS as LABELS } from '@/components/admin/logLabels'

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

type Log = {
  id: number
  action: string
  targetUserId: number | null
  targetLabel: string | null
  details: Record<string, unknown> | null
  ip: string | null
  createdAt: string
}


const GROUPS: { key: string; label: string; actions: string[] }[] = [
  { key: 'all', label: 'Tout', actions: [] },
  { key: 'login', label: 'Connexions', actions: ['ADMIN_LOGIN', 'ADMIN_CODE_SENT', 'ADMIN_CODE_FAILED', 'ADMIN_PASSWORD_FAILED'] },
  { key: 'users', label: 'Comptes', actions: ['USER_ROLE', 'USER_DELETE', 'USER_BAN', 'USER_UNBAN'] },
  { key: 'billing', label: 'Abonnements et ventes', actions: ['GIFT_PRO', 'GIFT_PRO_REMOVE', 'GIFT_BUSINESS', 'PLAN_SETTINGS', 'PROMO_CREATE', 'PROMO_UPDATE', 'EXTRA_CREATE', 'EXTRA_UPDATE', 'ORDER_VALIDATE', 'ORDER_REFUSE'] },
  { key: 'content', label: 'Contenu', actions: ['POST_CREATE', 'POST_DELETE', 'POST_TOGGLE', 'POST_PIN', 'FEATURED_ADD', 'FEATURED_ORDER', 'FEATURED_UPDATE', 'FEATURED_DELETE', 'CONTACT_ARCHIVE', 'CONTACT_DELETE'] },
  { key: 'settings', label: 'Réglages', actions: ['SITE_SETTINGS', 'ADMIN_ACTION'] },
]

const ALERT = new Set(['ADMIN_CODE_FAILED', 'ADMIN_PASSWORD_FAILED'])
const STRONG = new Set(['USER_DELETE', 'USER_BAN'])

const ROLE_NAMES: Record<string, string> = { ARTIST: 'artiste', ORGANIZER: 'organisateur', PROVIDER: 'prestataire' }

/** Phrase courte qui résume les détails connus d'une action */
function summary(log: Log): string | null {
  const d = log.details || {}
  const parts: string[] = []
  if (typeof d.device === 'string') parts.push(`depuis ${d.device}`)
  if (typeof d.attempts === 'number') parts.push(`essai ${d.attempts} sur 5`)
  if (typeof d.role === 'string') parts.push(`devient ${ROLE_NAMES[d.role] || d.role}`)
  if (log.action === 'GIFT_BUSINESS' && typeof d.enabled === 'boolean') parts.push(d.enabled ? 'Business offert' : 'Business retiré')
  if (typeof d.reason === 'string') parts.push(`motif : ${d.reason}`)
  if (typeof d.until === 'string' && d.until) parts.push(`jusqu’au ${new Date(d.until).toLocaleDateString('fr-FR')}`)
  if (typeof d.note === 'string' && d.note) parts.push(`note : ${d.note}`)
  if (typeof d.code === 'string') parts.push(`code ${d.code}`)
  if (typeof d.route === 'string') parts.push(d.route)
  return parts.length ? parts.join(' · ') : null
}

/** Autres détails (réglages modifiés…) affichés à la demande */
function otherDetails(log: Log): [string, string][] {
  const known = new Set(['device', 'attempts', 'role', 'enabled', 'reason', 'until', 'note', 'code', 'route'])
  return Object.entries(log.details || {})
    .filter(([k]) => !known.has(k))
    .map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)] as [string, string])
    .map(([k, v]) => [k, v.length > 160 ? `${v.slice(0, 160)}…` : v])
}

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export default function AdminHistoryPage() {
  const [group, setGroup] = useState('all')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [logs, setLogs] = useState<Log[]>([])
  const [nextBefore, setNextBefore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState<number | null>(null)

  const load = useCallback(async (before?: number | null) => {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams({ limit: '50' })
      const actions = GROUPS.find(g => g.key === group)?.actions || []
      if (actions.length) params.set('action', actions.join(','))
      if (search) params.set('q', search)
      if (before) params.set('before', String(before))
      const res = await apiFetch(`${API}/api/admin/logs?${params}`, { cache: 'no-store' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogs(prev => (before ? [...prev, ...data.logs] : data.logs))
      setNextBefore(data.nextBefore)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [group, search])

  useEffect(() => { load() }, [load])

  // Regroupement par jour
  const days: { day: string; items: Log[] }[] = []
  for (const log of logs) {
    const day = dayLabel(log.createdAt)
    const last = days[days.length - 1]
    if (last?.day === day) last.items.push(log)
    else days.push({ day, items: [log] })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <History className="h-6 w-6 text-accent-light" /> Historique
          </h1>
          <p className="mt-1 text-sm text-muted">Toutes les actions faites depuis l&apos;admin et les connexions au compte admin.</p>
        </div>
        <button
          onClick={() => load()}
          className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-white/70 transition hover:bg-white/5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {GROUPS.map(g => (
            <button
              key={g.key}
              onClick={() => setGroup(g.key)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                group === g.key ? 'bg-accent text-white' : 'border border-line text-white/60 hover:text-white'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={e => { e.preventDefault(); setSearch(query.trim()) }}
          className="relative sm:w-72"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onBlur={() => setSearch(query.trim())}
            placeholder="Chercher un membre…"
            className="w-full rounded-xl bg-surface py-2 pl-9 pr-3 text-sm text-white placeholder-white/30 outline-none ring-1 ring-line focus:ring-2 focus:ring-accent/60"
          />
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          L&apos;historique n&apos;a pas pu être chargé.
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-muted">
          Aucune action enregistrée pour l&apos;instant.
        </div>
      )}

      {days.map(({ day, items }) => (
        <section key={day}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted first-letter:uppercase">{day}</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {items.map(log => {
              const extra = otherDetails(log)
              const line = summary(log)
              return (
                <li key={log.id} className="px-4 py-3">
                  <div className="flex items-start gap-4">
                    <span className="w-12 flex-shrink-0 pt-0.5 text-sm tabular-nums text-muted">{timeLabel(log.createdAt)}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${ALERT.has(log.action) ? 'text-red-300' : STRONG.has(log.action) ? 'text-amber-200' : 'text-white'}`}>
                        {LABELS[log.action] || log.action}
                        {log.targetLabel && <span className="font-normal text-white/70"> — {log.targetLabel}</span>}
                      </p>
                      {line && <p className="mt-0.5 break-words text-xs text-muted">{line}</p>}
                      {extra.length > 0 && (
                        <button
                          onClick={() => setOpen(open === log.id ? null : log.id)}
                          className="mt-1 text-xs text-accent-light underline-offset-4 hover:underline"
                        >
                          {open === log.id ? 'Masquer le détail' : 'Voir le détail'}
                        </button>
                      )}
                      {open === log.id && (
                        <dl className="mt-2 space-y-1 rounded-xl bg-black/30 p-3 text-xs">
                          {extra.map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <dt className="flex-shrink-0 text-muted">{k}</dt>
                              <dd className="min-w-0 break-all text-white/80">{v}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                    {log.ip && <span className="hidden flex-shrink-0 text-xs text-white/30 sm:block">{log.ip}</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {nextBefore && (
        <div className="text-center">
          <button
            onClick={() => load(nextBefore)}
            disabled={loading}
            className="rounded-xl border border-line px-4 py-2 text-sm text-white/70 transition hover:bg-white/5 disabled:opacity-50"
          >
            {loading ? 'Chargement…' : 'Voir plus'}
          </button>
        </div>
      )}
    </div>
  )
}
