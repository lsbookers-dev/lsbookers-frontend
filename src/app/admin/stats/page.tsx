'use client'

import * as React from 'react'

type Summary = {
  usersTotal: number
  artists: number
  organizers: number
  providers: number
  payingUsers: number
  conversations: number
  messages: number
  mrrCents: number            // Monthly Recurring Revenue
  revenueMonthCents: number   // CA abonnements du mois
  revenueOffersCents: number  // CA offres "formules"
  loginsToday: number
  signupsToday: number
}

type Point = { date: string; users: number; revenueCents: number; logins: number }

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const money = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

export default function AdminStatsPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [series, setSeries] = React.useState<Point[]>([])

  const tokenRef = React.useRef<string | null>(null)
  React.useEffect(() => { tokenRef.current = localStorage.getItem('token') || null }, [])

  const authed = React.useCallback((init?: RequestInit) => ({
    ...(init || {}),
    headers: {
      Authorization: `Bearer ${tokenRef.current}`,
      ...(init?.headers || {}),
    },
    cache: 'no-store' as const,
  }), [])

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true); setError(null)

        const r1 = await fetch(`${API_BASE}/api/admin/stats/summary`, authed())
        if (!r1.ok) throw new Error('HTTP ' + r1.status)
        const s = await r1.json() as { summary: Summary } | Summary
        const sum = ('summary' in (s as any)) ? (s as any).summary as Summary : s as Summary
        if (!alive) return
        setSummary(sum)

        const r2 = await fetch(`${API_BASE}/api/admin/stats/series?days=30`, authed())
        if (!r2.ok) throw new Error('HTTP ' + r2.status)
        const ser = await r2.json() as { series: Point[] } | Point[]
        const arr = Array.isArray(ser) ? ser : (ser.series || [])
        if (!alive) return
        setSeries(arr)
      } catch (e) {
        console.error(e)
        if (alive) setError('Impossible de charger les statistiques.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [authed])

  if (loading) return <div className="p-8 text-white">Chargement…</div>
  if (error || !summary) return <div className="p-8 text-red-400">{error ?? 'Données indisponibles'}</div>

  return (
    <div className="p-6 text-white max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Statistiques</h1>

      {/* ===== Cards KPI ===== */}
      <div className="grid gap-4 md:grid-cols-3">
        <KPI title="Utilisateurs" value={summary.usersTotal.toLocaleString()} sub={`${summary.artists} artistes • ${summary.organizers} orga • ${summary.providers} presta`} />
        <KPI title="Utilisateurs payants" value={summary.payingUsers.toLocaleString()} sub={`MRR ${money(summary.mrrCents)}`} />
        <KPI title="Conversations / Messages" value={`${summary.conversations.toLocaleString()} / ${summary.messages.toLocaleString()}`} />
        <KPI title="CA abonnements (mois)" value={money(summary.revenueMonthCents)} />
        <KPI title="CA Formules" value={money(summary.revenueOffersCents)} />
        <KPI title="Aujourd’hui" value={`${summary.loginsToday} connexions`} sub={`${summary.signupsToday} inscriptions`} />
      </div>

      {/* ===== Graphiques simples (sans lib) ===== */}
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card title="Évolution des utilisateurs (30j)">
          <MiniBars data={series} yKey="users" />
        </Card>
        <Card title="Revenus (30j)">
          <MiniBars data={series} yKey="revenueCents" formatY={money} />
        </Card>
      </div>

      {/* ===== Table logs (optionnel) ===== */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <h2 className="text-xl font-semibold mb-3">Détail (30 derniers jours)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white/70">
              <tr className="text-left border-b border-white/10">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Nouveaux utilisateurs</th>
                <th className="py-2 pr-3">Connexions</th>
                <th className="py-2 pr-3">Revenus</th>
              </tr>
            </thead>
            <tbody>
              {series.map(pt => (
                <tr key={pt.date} className="border-b border-white/5">
                  <td className="py-2 pr-3">{new Date(pt.date).toLocaleDateString()}</td>
                  <td className="py-2 pr-3">{pt.users.toLocaleString()}</td>
                  <td className="py-2 pr-3">{pt.logins.toLocaleString()}</td>
                  <td className="py-2 pr-3">{money(pt.revenueCents)}</td>
                </tr>
              ))}
              {series.length === 0 && (
                <tr><td className="py-4 text-white/60" colSpan={4}>Aucune donnée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ===== UI bits ===== */
function KPI({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
      <p className="text-sm text-white/60">{title}</p>
      <p className="text-2xl font-extrabold mt-1">{value}</p>
      {sub && <p className="text-xs text-white/50 mt-1">{sub}</p>}
    </div>
  )
}

function Card({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      {children}
    </div>
  )
}

/** Barres minimalistes en CSS (pas de lib) */
function MiniBars({
  data,
  yKey,
  formatY,
}: {
  data: Array<Record<string, any>>
  yKey: string
  formatY?: (v: number) => string
}) {
  const vals = data.map(d => Number(d[yKey] || 0))
  const max = Math.max(1, ...vals)
  return (
    <div className="h-40 flex items-end gap-1">
      {data.map((d, i) => {
        const v = Number(d[yKey] || 0)
        const h = Math.round((v / max) * 100)
        return (
          <div key={i} className="flex-1 bg-white/10 relative group" style={{ height: `${h}%` }}>
            <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 text-[11px] bg-black/80 px-2 py-1 rounded border border-white/10">
              {new Date(d.date).toLocaleDateString()} — {formatY ? formatY(v) : v}
            </div>
          </div>
        )
      })}
    </div>
  )
}