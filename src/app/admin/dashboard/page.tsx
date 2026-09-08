'use client'

import * as React from 'react'
import { getAuthToken } from '@/utils/auth'
import {
  Users, CreditCard, MessageSquare, TrendingUp,
  Receipt, UserPlus, LogIn, type LucideIcon,
} from 'lucide-react'

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
  onlineNow: number
}

type LoginPeriod = 'day' | 'week' | 'month' | 'year'

const PERIOD_LABELS: Record<LoginPeriod, string> = {
  day:   'Aujourd\'hui',
  week:  '7 derniers jours',
  month: 'Ce mois',
  year:  'Cette année',
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const money = (cents: number) =>
  (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

export default function AdminDashboard() {
  const [summary, setSummary]           = React.useState<Summary | null>(null)
  const [loading, setLoading]           = React.useState(true)
  const [error, setError]               = React.useState<string | null>(null)
  const [loginPeriod, setLoginPeriod]   = React.useState<LoginPeriod>('day')
  const [loginCount, setLoginCount]     = React.useState<number | null>(null)
  const [loginLoading, setLoginLoading] = React.useState(false)

  const tokenRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    tokenRef.current = getAuthToken()
  }, [])

  const authed = React.useCallback((init?: RequestInit) => ({
    ...(init || {}),
    headers: {
      Authorization: `Bearer ${tokenRef.current}`,
      ...(init?.headers || {}),
    },
    cache: 'no-store' as const,
  }), [])

  // Chargement du résumé général + auto-refresh toutes les 30s
  const fetchSummary = React.useCallback(async (alive: { v: boolean }, silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      const r = await fetch(`${API_BASE}/api/admin/stats/summary`, authed())
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const json = await r.json() as { summary?: Summary } | Summary
      const sum: Summary = ('summary' in json && json.summary) ? json.summary as Summary : json as Summary
      if (alive.v) setSummary(sum)
    } catch (err) {
      console.error(err)
      if (alive.v && !silent) setError('Impossible de charger les indicateurs.')
    } finally {
      if (alive.v && !silent) setLoading(false)
    }
  }, [authed])

  React.useEffect(() => {
    const alive = { v: true }
    fetchSummary(alive)
    const interval = setInterval(() => fetchSummary(alive, true), 30_000)
    return () => { alive.v = false; clearInterval(interval) }
  }, [fetchSummary])

  // Chargement du compteur de connexions (se recharge à chaque changement de période)
  React.useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoginLoading(true)
        const r = await fetch(`${API_BASE}/api/admin/stats/logins?period=${loginPeriod}`, authed())
        if (!r.ok) throw new Error('HTTP ' + r.status)
        const json = await r.json() as { count: number }
        if (alive) setLoginCount(json.count)
      } catch {
        if (alive) setLoginCount(null)
      } finally {
        if (alive) setLoginLoading(false)
      }
    })()
    return () => { alive = false }
  }, [authed, loginPeriod])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (error || !summary) return <div className="p-8 text-red-400">{error ?? 'Données indisponibles'}</div>

  return (
    <div className="py-6 text-white">

      {/* ── En-tête ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="text-sm text-white/40 mt-0.5">Vue d&apos;ensemble en temps réel</p>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPIOnline value={summary.onlineNow ?? 0} />
        <KPI
          icon={Users}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10"
          title="Utilisateurs"
          value={summary.usersTotal.toLocaleString()}
          sub={`${summary.artists} artistes · ${summary.organizers} orga · ${summary.providers} presta`}
        />
        <KPI
          icon={CreditCard}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          title="Utilisateurs payants"
          value={summary.payingUsers.toLocaleString()}
          sub={`MRR ${money(summary.mrrCents)}`}
        />
        <KPI
          icon={UserPlus}
          iconColor="text-pink-400"
          iconBg="bg-pink-500/10"
          title="Inscriptions aujourd'hui"
          value={summary.signupsToday.toLocaleString()}
        />
        <KPI
          icon={MessageSquare}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
          title="Conversations / Messages"
          value={`${summary.conversations.toLocaleString()} / ${summary.messages.toLocaleString()}`}
        />
        <KPI
          icon={TrendingUp}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
          title="CA abonnements (mois)"
          value={money(summary.revenueMonthCents)}
        />
        <KPI
          icon={Receipt}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/10"
          title="CA formules"
          value={money(summary.revenueOffersCents)}
        />
      </div>

      {/* ── Carte Connexions avec filtres ── */}
      <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10">
              <LogIn className="h-4 w-4 text-violet-400" />
            </div>
            <p className="text-sm font-medium text-white/70">Connexions</p>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {(Object.keys(PERIOD_LABELS) as LoginPeriod[]).map(p => (
              <button
                key={p}
                onClick={() => setLoginPeriod(p)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  loginPeriod === p
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        <p className="text-3xl font-extrabold">
          {loginLoading ? <span className="text-white/20">…</span>
            : loginCount !== null ? loginCount.toLocaleString() : '—'}
        </p>
        <p className="text-xs text-white/40 mt-1">{PERIOD_LABELS[loginPeriod]}</p>
      </div>
    </div>
  )
}

function KPI({ icon: Icon, iconColor, iconBg, title, value, sub }: {
  icon: LucideIcon; iconColor: string; iconBg: string
  title: string; value: string; sub?: string
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-white/50 uppercase tracking-wider">{title}</p>
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-white">{value}</p>
      {sub && <p className="text-xs text-white/40 mt-1.5">{sub}</p>}
    </div>
  )
}

function KPIOnline({ value }: { value: number }) {
  return (
    <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.04] p-5 hover:bg-green-500/[0.07] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-white/50 uppercase tracking-wider">En ligne</p>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
      </div>
      <p className="text-2xl font-extrabold text-white">{value.toLocaleString()}</p>
      <p className="text-xs text-white/40 mt-1.5">actifs ces 2 dernières minutes</p>
    </div>
  )
}
