'use client'

// Admin › Accueil (choix B1 d'Antho, 31/10/2026) : d'abord ce qui attend une action,
// puis les chiffres clés et les 30 derniers jours. Remplace aussi l'ancienne page Statistiques.

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ChevronRight, Mail, Receipt, Star, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { API, ErrorBox, Kpi, Spinner, money } from '@/components/admin/ui'

type Point = { date: string; signups: number; logins: number; salesCents: number }
type Overview = {
  todo: { carouselOrders: number; otherOrders: number; unreadContact: number; watchMembers: { userId: number; name: string; count: number }[] }
  members: { total: number; artists: number; organizers: number; providers: number; newThisWeek: number; onlineNow: number; loginsToday: number }
  subscriptions: { pro: number; business: number; paying: number; payingPro: number; payingBusiness: number; gifted: number; trial: number; mrrCents: number }
  salesMonth: { commissionsCents: number; servicesCents: number; totalCents: number }
  series: Point[]
}

type Metric = 'signups' | 'logins' | 'salesCents'
const METRICS: { key: Metric; label: string }[] = [
  { key: 'signups', label: 'Inscriptions' },
  { key: 'logins', label: 'Connexions' },
  { key: 'salesCents', label: 'Ventes' },
]

function greeting() {
  const h = new Date().getHours()
  return h >= 5 && h < 18 ? 'Bonjour' : 'Bonsoir'
}

function TodoRow({ href, icon: Icon, text, action }: { href: string; icon: typeof Mail; text: string; action: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 border-b border-line px-5 py-3.5 text-sm transition last:border-0 hover:bg-white/[0.03]">
      <Icon className="h-4 w-4 shrink-0 text-gold" />
      <span className="flex-1 text-white/90">{text}</span>
      <span className="flex items-center gap-1 text-xs text-accent-light">{action}<ChevronRight className="h-3.5 w-3.5" /></span>
    </Link>
  )
}

function Chart({ data, metric }: { data: Point[]; metric: Metric }) {
  const values = data.map(d => d[metric])
  const max = Math.max(1, ...values)
  const total = values.reduce((a, b) => a + b, 0)
  const show = (v: number) => (metric === 'salesCents' ? money(v) : v.toLocaleString('fr-FR'))
  return (
    <div>
      <p className="mb-4 text-sm text-muted">Total sur 30 jours : <span className="font-semibold text-white">{show(total)}</span></p>
      <div className="flex h-40 items-end gap-1">
        {data.map(d => (
          <div key={d.date} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-accent/50 transition group-hover:bg-accent"
              style={{ height: `${Math.max(d[metric] ? 4 : 1, Math.round((d[metric] / max) * 100))}%` }}
            />
            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-[#14121c] px-2 py-1 text-[11px] text-white group-hover:block">
              {new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · {show(d[metric])}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted">
        <span>{data[0] && new Date(data[0].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
        <span>Aujourd&apos;hui</span>
      </div>
    </div>
  )
}

export default function AdminHomePage() {
  const { user } = useAuth()
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState(false)
  const [metric, setMetric] = useState<Metric>('signups')

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`${API}/api/admin/overview`, { cache: 'no-store' })
      if (!res.ok) throw new Error()
      setData(await res.json())
      setError(false)
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 60_000)
    return () => clearInterval(timer)
  }, [load])

  if (error && !data) return <ErrorBox text="L'accueil n'a pas pu être chargé." />
  if (!data) return <Spinner />

  const { todo, members, subscriptions: subs, salesMonth } = data
  const orders = todo.carouselOrders + todo.otherOrders
  const todoCount = orders + todo.unreadContact + todo.watchMembers.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{greeting()}{user?.name ? ` ${user.name.split(' ')[0]}` : ''}</h1>
        <p className="mt-1 text-sm text-muted">Ce qui attend une action, puis les chiffres du site.</p>
      </div>

      {/* À traiter */}
      <section className={`overflow-hidden rounded-2xl border bg-surface ${todoCount ? 'border-gold/35' : 'border-line'}`}>
        <p className={`border-b border-line px-5 py-3 text-sm font-semibold ${todoCount ? 'text-gold' : 'text-white'}`}>
          À traiter{todoCount ? ` · ${todoCount}` : ''}
        </p>
        {todoCount === 0 && (
          <p className="flex items-center gap-2 px-5 py-4 text-sm text-muted">
            <CheckCircle2 className="h-4 w-4 text-accent-light" /> Rien à traiter pour l&apos;instant.
          </p>
        )}
        {todo.carouselOrders > 0 && (
          <TodoRow href="/admin/ventes?tab=orders" icon={Star} action="Valider"
            text={`${todo.carouselOrders} mise${todo.carouselOrders > 1 ? 's' : ''} en avant payée${todo.carouselOrders > 1 ? 's' : ''} à valider`} />
        )}
        {todo.otherOrders > 0 && (
          <TodoRow href="/admin/ventes?tab=orders" icon={Receipt} action="Voir"
            text={`${todo.otherOrders} service${todo.otherOrders > 1 ? 's' : ''} payé${todo.otherOrders > 1 ? 's' : ''} à réaliser`} />
        )}
        {todo.unreadContact > 0 && (
          <TodoRow href="/admin/messages" icon={Mail} action="Lire"
            text={`${todo.unreadContact} message${todo.unreadContact > 1 ? 's' : ''} de contact non lu${todo.unreadContact > 1 ? 's' : ''}`} />
        )}
        {todo.watchMembers.map(m => (
          <TodoRow key={m.userId} href="/admin/users?status=watch" icon={AlertTriangle} action="Décider"
            text={`${m.name} : ${m.count} annulations tardives`} />
        ))}
      </section>

      {/* Chiffres clés */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Membres" value={members.total.toLocaleString('fr-FR')}
          sub={`+${members.newThisWeek} cette semaine`} />
        <Kpi label="En ligne" value={members.onlineNow.toLocaleString('fr-FR')}
          sub={`${members.loginsToday} connexion${members.loginsToday > 1 ? 's' : ''} aujourd'hui`} />
        <Kpi label="Abonnés payants" value={subs.paying.toLocaleString('fr-FR')}
          sub={`${subs.payingPro} Pro · ${subs.payingBusiness} Business${subs.gifted ? ` · ${subs.gifted} offerts` : ''}`} />
        <Kpi label="Abonnements par mois" value={money(subs.mrrCents)} gold
          sub="annuels comptés au 1/12" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Artistes" value={members.artists.toLocaleString('fr-FR')} />
        <Kpi label="Organisateurs" value={members.organizers.toLocaleString('fr-FR')} />
        <Kpi label="Prestataires" value={members.providers.toLocaleString('fr-FR')} />
        <Kpi label="Ventes du mois" value={money(salesMonth.totalCents)} gold
          sub={`${money(salesMonth.commissionsCents)} de commissions · ${money(salesMonth.servicesCents)} de services`} />
      </div>

      {/* 30 derniers jours */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">30 derniers jours</p>
          <div className="flex gap-1">
            {METRICS.map(m => (
              <button key={m.key} type="button" onClick={() => setMetric(m.key)}
                className={`rounded-full px-3 py-1.5 text-xs transition ${metric === m.key ? 'bg-accent text-white' : 'border border-line text-muted hover:text-white'}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <Chart data={data.series} metric={metric} />
        {metric === 'logins' && (
          <p className="mt-3 text-[11px] text-muted">Les connexions sont comptées depuis le 31 octobre 2026.</p>
        )}
      </section>
    </div>
  )
}
