'use client'

/**
 * /gestion/agenda — Agenda de l'agence (maquette B1) : le mois de tous les profils gérés,
 * une couleur par profil, en cliquant sur un nom on le masque / l'affiche.
 * Confirmé = couleur pleine ; option (demande en attente) = couleur pâle.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { switchToProfile } from '@/components/managed/ProfileSwitcher'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'

type AgendaProfile = { profileId: number; name: string; color: string; avatar: string | null; role: string }
type AgendaItem = { id: string; profileId: number; date: string; title: string; place: string | null; status: 'CONFIRMED' | 'OPTION'; awaitingArtist: boolean }

const WEEKDAYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

export default function AgencyAgendaPage() {
  const { user, acting } = useAuth()
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [data, setData] = useState<{ profiles: AgendaProfile[]; items: AgendaItem[] } | null>(null)
  const [hidden, setHidden] = useState<Set<number>>(new Set())
  const [selected, setSelected] = useState<string | null>(null)
  const enabled = !!user?.canManageProfiles || !!acting

  const load = useCallback((month: Date) => {
    const from = new Date(month.getFullYear(), month.getMonth(), 1)
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 1)
    setData(null)
    apiFetch(`${apiUrl('managers/agenda')}?from=${from.toISOString()}&to=${to.toISOString()}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { profiles: [], items: [] }))
      .then(setData)
      .catch(() => setData({ profiles: [], items: [] }))
  }, [])
  useEffect(() => { if (enabled) load(cursor) }, [enabled, cursor, load])

  // Grille du mois : semaines du lundi au dimanche
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const offset = (first.getDay() + 6) % 7
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const list: (Date | null)[] = Array(offset).fill(null)
    for (let d = 1; d <= days; d++) list.push(new Date(cursor.getFullYear(), cursor.getMonth(), d))
    while (list.length % 7) list.push(null)
    return list
  }, [cursor])

  const colorOf = useMemo(() => Object.fromEntries((data?.profiles || []).map(p => [p.profileId, p.color])), [data])
  const nameOf = useMemo(() => Object.fromEntries((data?.profiles || []).map(p => [p.profileId, p.name])), [data])
  const byDay = useMemo(() => {
    const map: Record<string, AgendaItem[]> = {}
    for (const it of data?.items || []) {
      if (hidden.has(it.profileId)) continue
      const k = dayKey(new Date(it.date))
      ;(map[k] ||= []).push(it)
    }
    return map
  }, [data, hidden])

  if (!enabled) {
    return <div className="lsb-page text-white"><p className="text-white/60">L’agenda de vos profils est disponible avec la formule Business.</p></div>
  }

  const today = dayKey(new Date())
  const dayItems = selected ? byDay[selected] || [] : []
  const toggle = (id: number) => setHidden(h => { const n = new Set(h); if (n.has(id)) n.delete(id); else n.add(id); return n })

  return (
    <div className="lsb-page grid gap-4 text-white">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[.2em] text-accent">Business</span>
          <h1 className="mt-1 text-[clamp(1.6rem,3.5vw,2.2rem)] font-semibold leading-tight">Agenda de mes profils<em className="not-italic text-accent">.</em></h1>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))} aria-label="Mois précédent" className="grid h-9 w-9 place-items-center rounded-xl border border-line hover:bg-white/[0.05]"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-[9rem] text-center text-sm font-semibold capitalize">{cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
          <button type="button" onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))} aria-label="Mois suivant" className="grid h-9 w-9 place-items-center rounded-xl border border-line hover:bg-white/[0.05]"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </header>

      {data && data.profiles.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Profils affichés">
          {data.profiles.map(p => (
            <button key={p.profileId} type="button" onClick={() => toggle(p.profileId)} aria-pressed={!hidden.has(p.profileId)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${hidden.has(p.profileId) ? 'border-line text-white/35' : 'border-white/15 text-white/85'}`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color, opacity: hidden.has(p.profileId) ? 0.3 : 1 }} />{p.name}
            </button>
          ))}
          <span className="self-center text-[11px] text-muted">Touchez un nom pour le masquer ou l’afficher.</span>
        </div>
      )}

      {data && data.profiles.length === 0 ? (
        <p className="rounded-[18px] border border-dashed border-white/15 p-8 text-center text-sm text-white/60">Vous ne gérez encore aucun profil. <Link href="/gestion" className="text-accent-light hover:underline">Ajouter un profil</Link></p>
      ) : (
        <div className="rounded-[18px] border border-line bg-surface p-2 sm:p-3">
          <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[10px] uppercase tracking-wider text-muted">{WEEKDAYS.map(d => <span key={d}>{d}</span>)}</div>
          <div className={`grid grid-cols-7 gap-1 ${data ? '' : 'animate-pulse opacity-60'}`}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="min-h-[3.5rem] rounded-lg sm:min-h-[5.5rem]" />
              const k = dayKey(d)
              const items = byDay[k] || []
              return (
                <button key={i} type="button" onClick={() => setSelected(k === selected ? null : k)}
                  className={`flex min-h-[3.5rem] min-w-0 flex-col gap-0.5 rounded-lg p-1 text-left transition sm:min-h-[5.5rem] ${k === selected ? 'bg-accent/15 ring-1 ring-accent/50' : 'bg-white/[0.03] hover:bg-white/[0.06]'}`}>
                  <span className={`text-[11px] ${k === today ? 'font-bold text-accent-light' : 'text-muted'}`}>{d.getDate()}</span>
                  {/* Téléphone : pastilles ; ordinateur : nom de la date */}
                  <span className="flex flex-wrap gap-0.5 sm:hidden">
                    {items.slice(0, 4).map(it => <span key={it.id} className="h-1.5 w-1.5 rounded-full" style={{ background: colorOf[it.profileId], opacity: it.status === 'OPTION' ? 0.45 : 1 }} />)}
                  </span>
                  <span className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                    {items.slice(0, 3).map(it => (
                      <span key={it.id} className="truncate rounded px-1 text-[10px] leading-4 text-[#0b0a10]" style={{ background: colorOf[it.profileId], opacity: it.status === 'OPTION' ? 0.55 : 1 }}>
                        {it.status === 'OPTION' ? 'option · ' : ''}{it.title}
                      </span>
                    ))}
                    {items.length > 3 && <span className="text-[10px] text-muted">+{items.length - 3}</span>}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 px-1 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-white/80" />confirmé</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-white/35" />option (demande en attente)</span>
            <span>case vide = libre</span>
          </div>
        </div>
      )}

      {selected && (
        <section className="rounded-[18px] border border-line bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold capitalize">
            {dayItems.length ? new Date(dayItems[0].date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Ce jour-là'}
          </h2>
          {dayItems.length === 0 ? <p className="text-xs text-muted">Tous vos profils sont libres ce jour-là.</p> : (
            <ul className="grid gap-1.5">
              {dayItems.map(it => (
                <li key={it.id} className="flex flex-wrap items-center gap-2.5 text-[13px]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorOf[it.profileId] }} />
                  <span className="min-w-0 flex-1 truncate text-white/85">
                    {nameOf[it.profileId]} · {it.title}{it.place ? ` · ${it.place}` : ''}
                    <span className="text-muted"> · {it.awaitingArtist ? 'en attente de l’accord de l’artiste' : it.status === 'OPTION' ? 'demande en attente' : 'confirmé'}</span>
                  </span>
                  <button type="button" onClick={() => switchToProfile(it.profileId, '/agenda')} className="rounded-lg border border-line px-2.5 py-1 text-xs text-accent-light hover:text-white">Ouvrir son agenda</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
