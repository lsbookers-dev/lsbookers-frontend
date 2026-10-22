'use client'

/**
 * « Mes revenus » (artistes / prestataires) ou « Mes dépenses » (organisateurs) :
 * bilan au mois ou à l'année, graphique, détail, statistiques et export PDF.
 * Les montants viennent des cachets saisis dans les bookings et l'agenda.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import LsIcon, { type LsIconName } from '@/components/ui/LsIcon'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { useFeedback } from '@/components/ui/Feedback'
import { usePlan } from '@/lib/plan'
import { EmptyLine, SpacePanel, euro, type Person } from './ui'

type Item = {
  key: string
  date: string
  title: string
  city: string | null
  amount: number
  done: boolean
  counterpart?: Person | null
}
type Finances = {
  items: Item[]
  months: { month: number; total: number; done: number; count: number }[]
  insights: { label: string; value: string }[]
}

const MONTHS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']

function BarChart({ bars, label }: { bars: { label: string; short: string; name: string; value: number; done: number }[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null)
  // Le dessin suit la largeur réelle : les textes gardent leur taille sur téléphone
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(720)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const narrow = width < 520
  const max = Math.max(1, ...bars.map(b => b.value))
  const step = max > 8000 ? 4000 : max > 4000 ? 2000 : max > 2000 ? 1000 : max > 800 ? 250 : 100
  const top = Math.ceil(max / step) * step
  const W = width, H = narrow ? 180 : 210, padL = narrow ? 40 : 48, padB = 24, padT = 8
  const plotW = W - padL - 4, plotH = H - padB - padT
  const slot = plotW / bars.length
  const bw = Math.max(4, Math.min(40, slot - (narrow ? 5 : 8)))
  const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step)
  const y = (v: number) => padT + plotH - (v / top) * plotH
  const bar = (cx: number, from: number, to: number) => {
    const h = Math.max(0, y(from) - y(to))
    if (h < 0.5) return ''
    const r = Math.min(4, h)
    const x0 = cx - bw / 2, x1 = cx + bw / 2, yt = y(to), yb = y(from)
    return `M${x0},${yb}V${yt + r}Q${x0},${yt} ${x0 + r},${yt}H${x1 - r}Q${x1},${yt} ${x1},${yt + r}V${yb}Z`
  }
  const tickLabel = (t: number) => (t >= 1000 ? `${(t / 1000).toLocaleString('fr-FR')} k€` : `${t} €`)

  return (
    <div ref={box} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label={`${label} : ${bars.map(b => `${b.label} ${euro(b.value)}`).join(', ')}`}>
        <defs>
          <pattern id="lsb-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="rgba(139,92,246,.18)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#8b5cf6" strokeWidth="2" />
          </pattern>
        </defs>
        {ticks.map(t => (
          <g key={t}>
            <line x1={padL} x2={W - 4} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,.07)" />
            <text x={padL - 8} y={y(t) + 3} textAnchor="end" fontSize="10" fill="#6f6a7a">{tickLabel(t)}</text>
          </g>
        ))}
        {bars.map((b, i) => {
          const cx = padL + (i + 0.5) * slot
          return (
            <g key={b.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} className="cursor-default outline-none">
              <rect x={cx - slot / 2} y={padT} width={slot} height={plotH} fill="transparent" />
              {/* réalisé en plein, à venir hachuré au-dessus (2 px d'écart) */}
              <path d={bar(cx, 0, b.done)} fill="#8b5cf6" opacity={hover === null || hover === i ? 1 : 0.55} />
              {b.value > b.done && (
                <path d={bar(cx, b.done > 0 ? b.done + (2 / plotH) * top : 0, b.value)} fill="url(#lsb-hatch)" stroke="#8b5cf6" strokeWidth="1" opacity={hover === null || hover === i ? 1 : 0.55} />
              )}
              <text x={cx} y={H - 7} textAnchor="middle" fontSize="10" fill="#6f6a7a">{narrow ? b.short : b.label}</text>
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[10px] border border-white/15 bg-[#1f1c2b] px-2.5 py-1.5 text-xs shadow-2xl"
          style={{ left: `${((padL + (hover + 0.5) * slot) / W) * 100}%`, top: `${(y(bars[hover].value) / H) * 100}%` }}>
          <b className="block text-[13px] tabular-nums text-gold-light">{euro(bars[hover].value)}</b>
          <span className="text-white/70">{bars[hover].name}{bars[hover].value > bars[hover].done ? ` · dont ${euro(bars[hover].value - bars[hover].done)} à venir` : ''}</span>
        </div>
      )}
    </div>
  )
}

function FinanceZoneContent({ organizer, ownerName }: { organizer: boolean; ownerName: string }) {
  const { notify } = useFeedback()
  const now = new Date()
  const [period, setPeriod] = useState<'month' | 'year'>('year')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<Finances | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(apiUrl(`space/finances?period=${period}&year=${year}&month=${month}`), { cache: 'no-store' })
      if (res.ok) setData(await res.json())
    } catch { /* bloc vide */ }
    finally { setLoading(false) }
  }, [period, year, month])

  useEffect(() => { load() }, [load])

  const periodLabel = period === 'year'
    ? `Année ${year}`
    : new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const shift = (delta: number) => {
    if (period === 'year') return setYear(y => y + delta)
    const d = new Date(year, month - 1 + delta, 1)
    setYear(d.getFullYear()); setMonth(d.getMonth() + 1)
  }

  const items = useMemo(() => data?.items ?? [], [data])
  const total = items.reduce((s, i) => s + i.amount, 0)
  const done = items.filter(i => i.done).reduce((s, i) => s + i.amount, 0)
  const average = items.length ? total / items.length : 0

  const bars = period === 'year'
    ? (data?.months ?? []).map(m => ({ label: MONTHS[m.month - 1], short: MONTHS[m.month - 1].charAt(0), name: `${MONTHS[m.month - 1]} ${year}`, value: m.total, done: m.done }))
    : items.map(i => ({ label: new Date(i.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', ''), short: String(new Date(i.date).getDate()), name: i.title, value: i.amount, done: i.done ? i.amount : 0 }))

  const exportPdf = async () => {
    setExporting(true)
    try {
      const { exportFinancePdf } = await import('@/lib/pdf')
      await exportFinancePdf({
        ownerName,
        kind: organizer ? 'dépenses' : 'revenus',
        periodLabel: periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1),
        rows: items.map(i => ({ date: i.date, title: i.title, counterpart: i.counterpart?.name, city: i.city, amount: i.amount, done: i.done })),
      })
    } catch {
      notify('L’export PDF a échoué. Réessayez.', 'error')
    } finally {
      setExporting(false)
    }
  }

  const kpis: { icon: LsIconName; label: string; value: string; strong?: boolean }[] = [
    { icon: organizer ? 'venue' : 'booking', label: organizer ? 'Événements' : 'Bookings', value: String(items.length) },
    { icon: 'payment', label: `${organizer ? 'Dépenses' : 'Revenus'} ${period === 'year' ? 'de l’année' : 'du mois'}`, value: euro(total), strong: true },
    { icon: 'check', label: 'Déjà réalisé', value: euro(done) },
    { icon: 'star', label: organizer ? 'Coût moyen par événement' : 'Cachet moyen', value: euro(average) },
  ]

  return (
    <SpacePanel
      kicker="Finances"
      title={organizer ? 'Mes dépenses' : 'Mes revenus'}
      action={(
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-[10px] border border-line bg-surface-2 p-[3px]">
            {(['month', 'year'] as const).map(p => (
              <button key={p} type="button" onClick={() => setPeriod(p)} aria-pressed={period === p}
                className={`rounded-[7px] px-3 py-1.5 text-xs font-semibold transition ${period === p ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}>
                {p === 'month' ? 'Mois' : 'Année'}
              </button>
            ))}
          </div>
          <div className="inline-flex items-center gap-1 rounded-[10px] border border-line px-1">
            <button type="button" onClick={() => shift(-1)} aria-label="Période précédente" className="p-1.5 text-muted hover:text-white"><ChevronLeft size={15} /></button>
            <span className="min-w-[7.5rem] text-center text-xs font-semibold capitalize text-white">{periodLabel}</span>
            <button type="button" onClick={() => shift(1)} aria-label="Période suivante" className="p-1.5 text-muted hover:text-white"><ChevronRight size={15} /></button>
          </div>
        </div>
      )}
    >
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {kpis.map(k => (
          <div key={k.label} className="grid gap-1 rounded-[14px] border border-line bg-surface-2 p-3.5">
            <span className="flex items-center gap-1.5 text-[11px] text-muted"><LsIcon name={k.icon} size={15} />{k.label}</span>
            <strong className={`text-[22px] font-semibold tabular-nums ${k.strong ? 'text-gold-light' : 'text-white'}`}>{k.value}</strong>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="h-52 animate-pulse rounded-xl bg-white/[0.03]" />
      ) : items.length === 0 ? (
        <EmptyLine>{organizer ? 'Aucun événement sur cette période.' : 'Aucune prestation sur cette période.'} Les montants viennent des cachets indiqués dans vos bookings{organizer ? ' et des dépenses de vos événements' : ''}.</EmptyLine>
      ) : (
        <>
          <BarChart bars={bars} label={organizer ? 'Dépenses' : 'Revenus'} />
          <div className="flex flex-wrap gap-4 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded-[3px] bg-accent" />Réalisé</span>
            <span className="inline-flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded-[3px] border border-accent bg-[repeating-linear-gradient(45deg,#8b5cf6_0_2px,rgba(139,92,246,.2)_2px_5px)]" />À venir (bookings confirmés)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] border-collapse text-[12.5px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[.12em] text-white/40">
                  <th className="px-2 py-2 font-semibold">Date</th>
                  <th className="px-2 py-2 font-semibold">{organizer ? 'Événement' : 'Prestation'}</th>
                  <th className="px-2 py-2 font-semibold">{organizer ? 'Lieu' : 'Client'}</th>
                  <th className="px-2 py-2 font-semibold">Statut</th>
                  <th className="px-2 py-2 text-right font-semibold">Montant</th>
                </tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.key} className="border-t border-line">
                    <td className="whitespace-nowrap px-2 py-2 text-white/70">{new Date(i.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>
                    <td className="px-2 py-2 text-white">{i.title}</td>
                    <td className="px-2 py-2 text-white/70">{(organizer ? i.city : i.counterpart?.name) || '—'}</td>
                    <td className="px-2 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${i.done ? 'bg-emerald-400/10 text-emerald-400' : 'bg-gold/15 text-gold-light'}`}>{i.done ? 'Réalisé' : 'À venir'}</span>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-white">{euro(i.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line font-bold text-gold-light">
                  <td className="px-2 py-2" colSpan={4}>Total · {periodLabel}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{euro(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {data?.insights.length ? (
            <div className="grid gap-2.5 sm:grid-cols-3">
              {data.insights.map(x => (
                <div key={x.label} className="grid gap-0.5 rounded-[13px] border border-dashed border-gold/35 bg-gold/[0.05] p-3">
                  <small className="text-[11px] text-muted">{x.label}</small>
                  <b className="text-[15px] text-white">{x.value}</b>
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <button type="button" onClick={exportPdf} disabled={exporting || !items.length} className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-semibold text-white/80 transition hover:text-white disabled:opacity-40">
          <LsIcon name="document" size={15} tone="inherit" />{exporting ? 'Préparation…' : 'Exporter en PDF pour la compta'}
        </button>
        <Link href="/space/invoices" className="inline-flex items-center gap-1.5 rounded-xl border border-gold/35 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold-light transition hover:bg-gold/20">
          <LsIcon name="payment" size={15} tone="inherit" />Devis et factures
        </Link>
        <span className="text-[11px] text-white/35">Montants indiqués dans vos bookings{organizer ? ' et votre agenda' : ''}, hors paiements en ligne.</span>
      </div>
    </SpacePanel>
  )
}

/** Module Finances : version Pro uniquement. En compte gratuit, il reste visible mais grisé. */
export default function FinanceZone({ organizer, ownerName }: { organizer: boolean; ownerName: string }) {
  const { isPro, loading } = usePlan()
  if (loading) return null
  if (isPro) return <FinanceZoneContent organizer={organizer} ownerName={ownerName} />

  const preview = [
    { icon: (organizer ? 'venue' : 'booking') as LsIconName, label: organizer ? 'Événements' : 'Bookings', value: '12' },
    { icon: 'payment' as LsIconName, label: organizer ? 'Dépenses de l’année' : 'Revenus de l’année', value: '8 450 €' },
    { icon: 'check' as LsIconName, label: 'Déjà réalisé', value: '6 200 €' },
    { icon: 'star' as LsIconName, label: organizer ? 'Coût moyen par événement' : 'Cachet moyen', value: '704 €' },
  ]
  return (
    <SpacePanel kicker="Finances" title={organizer ? 'Mes dépenses' : 'Mes revenus'}>
      <div className="relative">
        <div aria-hidden="true" className="pointer-events-none select-none opacity-30 grayscale">
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {preview.map(k => (
              <div key={k.label} className="grid gap-1 rounded-[14px] border border-line bg-surface-2 p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] text-muted"><LsIcon name={k.icon} size={15} />{k.label}</span>
                <strong className="text-[22px] font-semibold tabular-nums text-white">{k.value}</strong>
              </div>
            ))}
          </div>
          <div className="mt-3 flex h-28 items-end gap-2 rounded-[14px] border border-line bg-surface-2 p-3.5">
            {[30, 55, 40, 70, 45, 85, 60, 35, 75, 50, 65, 40].map((h, i) => (
              <span key={i} className="flex-1 rounded-t bg-white/40" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="absolute inset-0 grid place-items-center p-4">
          <div className="max-w-sm rounded-2xl border border-white/10 bg-surface/95 p-5 text-center shadow-2xl backdrop-blur">
            <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full border border-gold/30 bg-gold/10"><LsIcon name="lock" tone="gold" size={18} /></span>
            <p className="text-sm font-semibold text-white">Disponible avec la version Pro</p>
            <p className="mt-1 text-xs leading-relaxed text-white/55">
              Suivez vos {organizer ? 'dépenses' : 'revenus'} mois par mois, exportez-les en PDF et créez vos devis et factures.
            </p>
            <Link href="/subscriptions" className="mt-4 inline-block rounded-xl bg-accent-strong px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent">Passer en Pro</Link>
          </div>
        </div>
      </div>
    </SpacePanel>
  )
}
