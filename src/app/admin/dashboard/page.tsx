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
  mrrCents: number
  revenueMonthCents: number
  revenueOffersCents: number
  loginsToday: number
  signupsToday: number
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const money = (cents: number) =>
  (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

export default function AdminDashboard() {
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const tokenRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    tokenRef.current = localStorage.getItem('token')
  }, [])

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
        setLoading(true)
        setError(null)
        const r = await fetch(`${API_BASE}/api/admin/stats/summary`, authed())
        if (!r.ok) throw new Error('HTTP ' + r.status)
        const json = await r.json() as { summary?: Summary } | Summary
        const sum: Summary = ('summary' in json && json.summary) ? json.summary as Summary : json as Summary
        if (alive) setSummary(sum)
      } catch (err) {
        console.error(err)
        if (alive) setError('Impossible de charger les indicateurs.')
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
      <h1 className="text-3xl font-bold mb-6">Tableau de bord admin</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <KPI title="Utilisateurs" value={summary.usersTotal.toLocaleString()} sub={`${summary.artists} artistes • ${summary.organizers} orga • ${summary.providers} presta`} />
        <KPI title="Utilisateurs payants" value={summary.payingUsers.toLocaleString()} sub={`MRR ${money(summary.mrrCents)}`} />
        <KPI title="Conversations / Messages" value={`${summary.conversations.toLocaleString()} / ${summary.messages.toLocaleString()}`} />
        <KPI title="CA abonnements (mois)" value={money(summary.revenueMonthCents)} />
        <KPI title="CA formules" value={money(summary.revenueOffersCents)} />
        <KPI title="Aujourd’hui" value={`${summary.loginsToday} connexions`} sub={`${summary.signupsToday} inscriptions`} />
      </div>
    </div>
  )
}

function KPI({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
      <p className="text-sm text-white/60">{title}</p>
      <p className="text-2xl font-extrabold mt-1">{value}</p>
      {sub && <p className="text-xs text-white/50 mt-1">{sub}</p>}
    </div>
  )
}