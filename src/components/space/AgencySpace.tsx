'use client'

/**
 * Espace agence (maquette E1, validée par Antho le 26/10/2026), en haut de Mon espace
 * quand le compte a la formule Agence et agit pour lui-même :
 * à traiter, mes artistes / mes profils, prochaines dates, relevé des cachets, opportunités.
 * La messagerie reste séparée : on indique seulement les messages en attente par profil.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import LsIcon from '@/components/ui/LsIcon'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'
import { switchToProfile } from '@/components/managed/ProfileSwitcher'
import AddProfileModal from '@/components/managed/AddProfileModal'
import { exportAgencyStatementPdf } from '@/lib/pdf'
import { journalDate, journalText, type JournalEntry } from '@/components/managed/journal'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { EmptyLine, PanelLink, SpacePanel, euro } from './ui'

type AgencyProfile = {
  managementId: number; profileId: number; userId: number; role: string; name: string; avatar: string | null
  location: string | null; color: string; requireApproval: boolean; commissionPct: number | null
  unread: number; pendingRequests: number; bookingsThisMonth: number; nextDate: string | null
}
type Todo =
  | { kind: 'BOOKING_REQUESTS' | 'UNREAD_MESSAGES'; profileId: number; count: number }
  | { kind: 'AWAITING_ARTIST'; profileId: number; date: string; bookingId: number }
  | { kind: 'INVITATION'; managementId: number; date: string; name: string }
type Dashboard = {
  month: string
  profiles: AgencyProfile[]
  todo: Todo[]
  upcoming: { profileId: number; date: string; title: string; place: string | null }[]
  statement: { profileId: number; bookings: number; totalFee: number; commissionPct: number | null; owed: number | null }[]
  opportunities: { id: number; title: string; date: string | null; location: string | null; fee: number | null; organizer: string; profileId: number }[]
}

const ROLE_LABEL: Record<string, string> = { ARTIST: 'Artiste', ORGANIZER: 'Organisateur', PROVIDER: 'Prestataire' }
const shortDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
const monthLabel = (m: string) => {
  const [y, mo] = m.split('-').map(Number)
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}
const shiftMonth = (m: string, delta: number) => {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(Date.UTC(y, mo - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function Dot({ color }: { color: string }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
}

export default function AgencySpace({ agencyName }: { agencyName: string }) {
  const { notify } = useFeedback()
  const [data, setData] = useState<Dashboard | null>(null)
  const [month, setMonth] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [editingRate, setEditingRate] = useState<number | null>(null)
  const [rate, setRate] = useState('')
  const [entries, setEntries] = useState<JournalEntry[] | null>(null)

  const load = useCallback((m?: string | null) => {
    apiFetch(`${apiUrl('managers/dashboard')}${m ? `?month=${m}` : ''}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) { setData(d); setMonth(d.month) } })
      .catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    apiFetch(apiUrl('managers/journal'), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { entries: [] }))
      .then(d => setEntries(d.entries || []))
      .catch(() => setEntries([]))
  }, [])

  if (!data) return <div className="h-48 animate-pulse rounded-[18px] bg-white/[0.04]" />

  const byId = Object.fromEntries(data.profiles.map(p => [p.profileId, p]))
  const onlyArtists = data.profiles.length > 0 && data.profiles.every(p => p.role === 'ARTIST')
  const title = onlyArtists ? 'Mes artistes' : 'Mes profils'

  const saveRate = async (p: AgencyProfile) => {
    const value = rate.trim() === '' ? null : Number(rate.replace(',', '.'))
    const res = await apiFetch(apiUrl(`managers/profiles/${p.managementId}/commission`), {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commissionPct: value }),
    })
    if (!res.ok) { notify(await apiErrorMessage(res, 'Taux invalide.'), 'error'); return }
    setEditingRate(null)
    load(month)
  }

  const exportStatement = () => {
    if (!month) return
    exportAgencyStatementPdf({
      agencyName,
      periodLabel: monthLabel(month),
      rows: data.statement.map(s => ({ name: byId[s.profileId]?.name || 'Profil', bookings: s.bookings, totalFee: s.totalFee, commissionPct: s.commissionPct, owed: s.owed })),
    }).catch(() => notify('Export impossible pour le moment.', 'error'))
  }

  const todoLine = (t: Todo, i: number) => {
    if (t.kind === 'INVITATION') {
      return (
        <Link key={`i${t.managementId}`} href="/gestion" className="flex items-center gap-2.5 border-t border-line py-2 text-[13px] first:border-t-0 hover:bg-white/[0.02]">
          <LsIcon name="mail" size={16} tone="muted" />
          <span className="min-w-0 flex-1 truncate text-white/80">Invitation à {t.name} : pas encore acceptée</span>
          <span className="text-xs text-accent-light">Voir</span>
        </Link>
      )
    }
    const p = byId[t.profileId]
    if (!p) return null
    const text = t.kind === 'BOOKING_REQUESTS' && 'count' in t
      ? <><b className="font-semibold text-white">{t.count}</b> demande{t.count > 1 ? 's' : ''} de booking pour {p.name}</>
      : t.kind === 'UNREAD_MESSAGES' && 'count' in t
        ? <><b className="font-semibold text-white">{t.count}</b> message{t.count > 1 ? 's' : ''} en attente pour {p.name}</>
        : <>Booking du {'date' in t ? shortDate(t.date) : ''} en attente de l’accord de {p.name}</>
    return (
      <button key={`${t.kind}-${t.profileId}-${i}`} type="button" onClick={() => switchToProfile(p.profileId, '/messages')}
        className="flex w-full items-center gap-2.5 border-t border-line py-2 text-left text-[13px] first:border-t-0 hover:bg-white/[0.02]">
        <Dot color={p.color} />
        <span className="min-w-0 flex-1 truncate text-white/80">{text}</span>
        <span className="text-xs text-accent-light">{t.kind === 'UNREAD_MESSAGES' ? 'Ouvrir' : 'Voir'}</span>
      </button>
    )
  }

  return (
    <div className="grid gap-4">
      <SpacePanel kicker="Mes profils gérés" title="À traiter"
        action={<button type="button" onClick={() => setAdding(true)} className="rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-white hover:bg-accent-strong">Ajouter un profil</button>}>
        {data.todo.length === 0
          ? <EmptyLine>Rien n’attend pour le moment, tous profils confondus.</EmptyLine>
          : <div className="grid">{data.todo.map(todoLine)}</div>}
      </SpacePanel>

      <SpacePanel kicker="Formule Business" title={title} action={<PanelLink href="/gestion">Gérer</PanelLink>}>
        {data.profiles.length === 0 ? (
          <EmptyLine>Vous ne gérez encore aucun profil. Ajoutez-en un pour commencer.</EmptyLine>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {data.profiles.map(p => (
              <article key={p.profileId} className="grid gap-2 rounded-xl border border-line border-t-[3px] bg-white/[0.02] p-3" style={{ borderTopColor: p.color }}>
                <div className="flex items-center gap-2.5">
                  <SafeImage type="avatar" src={p.avatar} name={p.name} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                    <p className="truncate text-xs text-muted">{[ROLE_LABEL[p.role], p.location].filter(Boolean).join(' · ')}</p>
                  </div>
                </div>
                <p className="text-xs text-muted">
                  {p.nextDate ? `Prochaine date : ${shortDate(p.nextDate)}` : 'Pas de date dans les 14 jours'}<br />
                  {p.bookingsThisMonth} booking{p.bookingsThisMonth > 1 ? 's' : ''} ce mois
                  {p.unread > 0 && <> · <span className="text-accent-light">{p.unread} message{p.unread > 1 ? 's' : ''} en attente</span></>}
                </p>
                <button type="button" onClick={() => switchToProfile(p.profileId)} className="rounded-lg border border-accent/50 px-3 py-1.5 text-xs font-semibold text-accent-light hover:bg-accent/15">
                  Agir en tant que
                </button>
              </article>
            ))}
          </div>
        )}
      </SpacePanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <SpacePanel kicker="Agenda" title="Prochaines dates" action={<PanelLink href="/gestion/agenda">Agenda de mes profils</PanelLink>}>
          {data.upcoming.length === 0 ? <EmptyLine>Aucune date dans les 14 prochains jours.</EmptyLine> : (
            <div className="grid">
              {data.upcoming.map((u, i) => (
                <div key={i} className="flex items-center gap-2.5 border-t border-line py-2 text-[13px] first:border-t-0">
                  <Dot color={byId[u.profileId]?.color || '#888'} />
                  <span className="w-24 shrink-0 text-xs text-muted">{shortDate(u.date)}</span>
                  <span className="min-w-0 flex-1 truncate text-white/80">{u.title}{u.place ? ` · ${u.place}` : ''}</span>
                  <span className="hidden truncate text-xs text-muted sm:inline">{byId[u.profileId]?.name}</span>
                </div>
              ))}
            </div>
          )}
        </SpacePanel>

        <SpacePanel kicker="Relevé des cachets" title={month ? monthLabel(month) : ''}
          action={
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => month && load(shiftMonth(month, -1))} aria-label="Mois précédent" className="rounded-lg border border-line px-2 py-1 text-xs text-white/70 hover:text-white">‹</button>
              <button type="button" onClick={() => month && load(shiftMonth(month, 1))} aria-label="Mois suivant" className="rounded-lg border border-line px-2 py-1 text-xs text-white/70 hover:text-white">›</button>
              <button type="button" onClick={exportStatement} className="rounded-lg border border-line px-2.5 py-1 text-xs text-accent-light hover:text-white">PDF</button>
            </div>
          }>
          {data.statement.length === 0 ? <EmptyLine>Le relevé apparaîtra quand vous gérerez un profil.</EmptyLine> : (
            <div className="grid">
              {data.statement.map(s => {
                const p = byId[s.profileId]
                if (!p) return null
                return (
                  <div key={s.profileId} className="flex flex-wrap items-center gap-2.5 border-t border-line py-2 text-[13px] first:border-t-0">
                    <Dot color={p.color} />
                    <span className="min-w-0 flex-1 truncate text-white/80">{p.name} · {euro(s.totalFee)}</span>
                    {editingRate === s.profileId ? (
                      <span className="flex items-center gap-1">
                        <input autoFocus value={rate} onChange={e => setRate(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveRate(p) }}
                          inputMode="decimal" aria-label="Taux convenu (%)" className="w-14 rounded-md border border-line bg-white/5 px-2 py-1 text-xs text-white" />
                        <span className="text-xs text-muted">%</span>
                        <button type="button" onClick={() => saveRate(p)} className="text-xs text-accent-light">OK</button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => { setEditingRate(s.profileId); setRate(s.commissionPct != null ? String(s.commissionPct).replace('.', ',') : '') }}
                        className="text-xs" title="Taux convenu avec ce profil">
                        {s.commissionPct != null
                          ? <span className="text-gold">{String(s.commissionPct).replace('.', ',')} % → {euro(s.owed || 0)}</span>
                          : <span className="text-accent-light">Indiquer le taux</span>}
                      </button>
                    )}
                  </div>
                )
              })}
              <p className="mt-1 text-[11px] text-muted">Indicatif : chaque profil vous règle lui-même. Le taux n’est visible que par vous.</p>
            </div>
          )}
        </SpacePanel>
      </div>

      {data.opportunities.length > 0 && (
        <SpacePanel kicker="Opportunités" title={onlyArtists ? 'Pour mes artistes' : 'Pour mes profils'} action={<PanelLink href="/offers">Toutes les offres</PanelLink>}>
          <div className="grid">
            {data.opportunities.map(o => {
              const p = byId[o.profileId]
              return (
                <div key={`${o.id}-${o.profileId}`} className="flex flex-wrap items-center gap-2.5 border-t border-line py-2 text-[13px] first:border-t-0">
                  <Dot color={p?.color || '#888'} />
                  <span className="min-w-0 flex-1 truncate text-white/80">
                    {o.title}<span className="text-muted"> · {o.organizer}{o.location ? ` · ${o.location}` : ''}{o.date ? ` · ${shortDate(o.date)}` : ''}{o.fee ? ` · ${euro(o.fee)}` : ''}</span>
                  </span>
                  {p && (
                    <button type="button" onClick={() => switchToProfile(p.profileId, `/offers?offer=${o.id}`)} className="rounded-lg border border-line px-2.5 py-1 text-xs text-accent-light hover:text-white">
                      Candidater pour {p.name}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </SpacePanel>
      )}

      <SpacePanel kicker="Journal" title="Ce que vous avez fait pour vos profils">
        {!entries || entries.length === 0 ? (
          <EmptyLine>Les actions faites pour vos profils (bookings, candidatures, publications…) apparaîtront ici. Vos artistes les voient aussi.</EmptyLine>
        ) : (
          <div className="grid">
            {entries.slice(0, 12).map(e => (
              <div key={e.id} className="flex items-center gap-2.5 border-t border-line py-2 text-[13px] first:border-t-0">
                <Dot color={byId[e.profileId]?.color || '#888'} />
                <span className="min-w-0 flex-1 truncate text-white/80"><b className="font-semibold text-white">{e.profileName || 'Profil'}</b> · vous {journalText(e)}</span>
                <span className="shrink-0 text-[11px] text-muted">{journalDate(e.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </SpacePanel>

      {adding && <AddProfileModal onClose={() => setAdding(false)} onDone={() => { setAdding(false); load(month) }} />}
    </div>
  )
}
