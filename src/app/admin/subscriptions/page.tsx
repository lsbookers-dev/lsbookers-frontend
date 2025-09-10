'use client'

import * as React from 'react'

/** ===== Types ===== */
type Plan = {
  id: number
  name: string
  priceCents: number
  interval: 'month' | 'year'
  description?: string | null
  isActive: boolean
}

type Subscription = {
  id: number
  userId: number
  userName?: string | null
  planId: number
  planName?: string | null
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete'
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  updatedAt?: string | null
}

/** ===== Helpers ===== */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const money = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '—')

export default function AdminSubscriptionsPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [plans, setPlans] = React.useState<Plan[]>([])
  const [subs, setSubs] = React.useState<Subscription[]>([])

  // édition plan
  const [editing, setEditing] = React.useState<Plan | null>(null)
  const [form, setForm] = React.useState<Omit<Plan, 'id'>>({
    name: '',
    priceCents: 0,
    interval: 'month',
    description: '',
    isActive: true,
  })

  // filtre subs
  const [q, setQ] = React.useState('')
  const [status, setStatus] = React.useState<string>('')

  const tokenRef = React.useRef<string | null>(null)
  React.useEffect(() => { tokenRef.current = localStorage.getItem('token') || null }, [])

  const authed = React.useCallback((init?: RequestInit) => ({
    ...(init || {}),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenRef.current}`,
      ...(init?.headers || {}),
    },
    cache: 'no-store' as const,
  }), [])

  const loadAll = React.useCallback(async () => {
    try {
      setLoading(true); setError(null)

      // Plans
      const r1 = await fetch(`${API_BASE}/api/admin/plans`, authed())
      if (!r1.ok) throw new Error('HTTP ' + r1.status)
      const p = await r1.json() as { plans?: Plan[] } | Plan[]
      setPlans(Array.isArray(p) ? p : (p.plans || []))

      // Souscriptions
      const r2 = await fetch(`${API_BASE}/api/admin/subscriptions`, authed())
      if (!r2.ok) throw new Error('HTTP ' + r2.status)
      const s = await r2.json() as { subscriptions?: Subscription[] } | Subscription[]
      setSubs(Array.isArray(s) ? s : (s.subscriptions || []))

    } catch (e) {
      console.error(e)
      setError('Impossible de charger les abonnements.')
    } finally {
      setLoading(false)
    }
  }, [authed])

  React.useEffect(() => { loadAll() }, [loadAll])

  /** ===== Actions Plans ===== */
  const startCreate = () => {
    setEditing(null)
    setForm({ name: '', priceCents: 0, interval: 'month', description: '', isActive: true })
  }
  const startEdit = (p: Plan) => {
    setEditing(p)
    setForm({
      name: p.name,
      priceCents: p.priceCents,
      interval: p.interval,
      description: p.description || '',
      isActive: p.isActive,
    })
  }

  const savePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const body = JSON.stringify(form)
      if (editing) {
        const r = await fetch(`${API_BASE}/api/admin/plans/${editing.id}`, authed({ method: 'PUT', body }))
        if (!r.ok) throw new Error('HTTP ' + r.status)
      } else {
        const r = await fetch(`${API_BASE}/api/admin/plans`, authed({ method: 'POST', body }))
        if (!r.ok) throw new Error('HTTP ' + r.status)
      }
      await loadAll()
      setEditing(null)
      startCreate()
      alert('Plan enregistré ✅')
    } catch (e) {
      console.error(e)
      alert('Échec de sauvegarde du plan')
    }
  }

  const toggleActive = async (p: Plan) => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/plans/${p.id}`, authed({
        method: 'PUT',
        body: JSON.stringify({ isActive: !p.isActive }),
      }))
      if (!r.ok) throw new Error('HTTP ' + r.status)
      setPlans(prev => prev.map(x => x.id === p.id ? { ...x, isActive: !x.isActive } : x))
    } catch (e) {
      console.error(e)
      alert('Impossible de changer le statut du plan.')
    }
  }

  const removePlan = async (id: number) => {
    if (!confirm('Supprimer ce plan ?')) return
    try {
      const r = await fetch(`${API_BASE}/api/admin/plans/${id}`, authed({ method: 'DELETE' }))
      if (!r.ok) throw new Error('HTTP ' + r.status)
      setPlans(prev => prev.filter(x => x.id !== id))
      alert('Plan supprimé ✅')
    } catch (e) {
      console.error(e)
      alert('Suppression impossible.')
    }
  }

  /** ===== Filtrage subs ===== */
  const filteredSubs = subs.filter(s => {
    const okQ = q ? (s.userName?.toLowerCase().includes(q.toLowerCase()) || s.planName?.toLowerCase().includes(q.toLowerCase())) : true
    const okSt = status ? s.status === status : true
    return okQ && okSt
  })

  if (loading) {
    return <div className="p-8 text-white">Chargement…</div>
  }

  return (
    <div className="p-6 text-white max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Abonnements & Plans</h1>

      {error && <p className="mb-4 text-red-400">{error}</p>}

      {/* ============ Plans ============ */}
      <section className="mb-10 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Plans proposés</h2>
          <button onClick={startCreate} className="px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20">
            Nouveau plan
          </button>
        </div>

        {/* Liste plans */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white/70">
              <tr className="text-left border-b border-white/10">
                <th className="py-2 pr-3">Nom</th>
                <th className="py-2 pr-3">Tarif</th>
                <th className="py-2 pr-3">Intervalle</th>
                <th className="py-2 pr-3">Actif</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(p => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="py-2 pr-3">{p.name}</td>
                  <td className="py-2 pr-3">{money(p.priceCents)}</td>
                  <td className="py-2 pr-3">{p.interval === 'month' ? 'Mensuel' : 'Annuel'}</td>
                  <td className="py-2 pr-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${p.isActive ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/70'}`}>
                      {p.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="py-2 pr-3 space-x-2">
                    <button onClick={() => startEdit(p)} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20">Modifier</button>
                    <button onClick={() => toggleActive(p)} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20">
                      {p.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                    <button onClick={() => removePlan(p.id)} className="text-xs px-2 py-1 rounded bg-red-600/70 hover:bg-red-600">
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr><td className="py-4 text-white/60" colSpan={5}>Aucun plan pour le moment.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Formulaire plan */}
        <div className="mt-6 rounded-xl border border-white/10 p-4 bg-black/40">
          <h3 className="font-semibold mb-3">{editing ? `Modifier : ${editing.name}` : 'Créer un plan'}</h3>
          <form onSubmit={savePlan} className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm text-white/70 mb-1">Nom</label>
              <input
                className="w-full rounded bg-black/40 border border-white/10 px-3 py-2"
                value={form.name}
                onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Tarif (en €)</label>
              <input
                type="number"
                min={0}
                className="w-full rounded bg-black/40 border border-white/10 px-3 py-2"
                value={form.priceCents / 100}
                onChange={e => setForm(v => ({ ...v, priceCents: Math.round(Number(e.target.value || 0) * 100) }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Intervalle</label>
              <select
                className="w-full rounded bg-black/40 border border-white/10 px-3 py-2"
                value={form.interval}
                onChange={e => setForm(v => ({ ...v, interval: e.target.value as 'month' | 'year' }))}
              >
                <option value="month">Mensuel</option>
                <option value="year">Annuel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Actif</label>
              <select
                className="w-full rounded bg-black/40 border border-white/10 px-3 py-2"
                value={String(form.isActive)}
                onChange={e => setForm(v => ({ ...v, isActive: e.target.value === 'true' }))}
              >
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-white/70 mb-1">Description</label>
              <textarea
                className="w-full rounded bg-black/40 border border-white/10 px-3 py-2"
                rows={3}
                value={form.description || ''}
                onChange={e => setForm(v => ({ ...v, description: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="px-4 py-2 rounded bg-white text-black hover:bg-neutral-200">
                {editing ? 'Enregistrer les modifications' : 'Créer le plan'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ============ Souscriptions ============ */}
      <section className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold">Souscriptions</h2>
          <div className="flex gap-2">
            <input
              placeholder="Rechercher (utilisateur, plan)…"
              className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <select
              className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="">Tous statuts</option>
              {['active','past_due','canceled','trialing','incomplete'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white/70">
              <tr className="text-left border-b border-white/10">
                <th className="py-2 pr-3">Utilisateur</th>
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3">Statut</th>
                <th className="py-2 pr-3">Période</th>
                <th className="py-2 pr-3">MAJ</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.map(s => (
                <tr key={s.id} className="border-b border-white/5">
                  <td className="py-2 pr-3">{s.userName ?? `#${s.userId}`}</td>
                  <td className="py-2 pr-3">{s.planName ?? `#${s.planId}`}</td>
                  <td className="py-2 pr-3">
                    <span className="px-2 py-0.5 rounded bg-white/10">{s.status}</span>
                  </td>
                  <td className="py-2 pr-3">{fmt(s.currentPeriodStart)} → {fmt(s.currentPeriodEnd)}</td>
                  <td className="py-2 pr-3">{fmt(s.updatedAt)}</td>
                </tr>
              ))}
              {filteredSubs.length === 0 && (
                <tr><td className="py-4 text-white/60" colSpan={5}>Aucune souscription.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}