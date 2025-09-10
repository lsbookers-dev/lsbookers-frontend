'use client'

import { useEffect, useState } from 'react'

type Metrics = {
  usersTotal: number
  artists: number
  organizers: number
  providers: number
  conversations: number
  messages: number
  payingUsers?: number
  mrr?: number
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [m, setM] = useState<Metrics | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    const run = async () => {
      setLoading(true)
      setErr(null)
      try {
        const r = await fetch(`${API_BASE}/api/admin/metrics?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        if (!r.ok) throw new Error('HTTP ' + r.status)
        const data = await r.json()
        setM(data?.metrics ?? data ?? null)
      } catch (e) {
        setErr("Impossible de charger les métriques.")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const cards = [
    { label: 'Utilisateurs', value: m?.usersTotal ?? '—' },
    { label: 'Artistes', value: m?.artists ?? '—' },
    { label: 'Organisateurs', value: m?.organizers ?? '—' },
    { label: 'Prestataires', value: m?.providers ?? '—' },
    { label: 'Conversations', value: m?.conversations ?? '—' },
    { label: 'Messages', value: m?.messages ?? '—' },
    { label: 'Clients payants', value: m?.payingUsers ?? '—' },
    { label: 'MRR (€)', value: m?.mrr ?? '—' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>

      {loading && <p className="text-white/70">Chargement…</p>}
      {err && <p className="text-red-400">{err}</p>}

      {!loading && !err && (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.label} className="rounded-xl border border-white/10 bg-neutral-900/60 p-4">
                <p className="text-xs text-white/50">{c.label}</p>
                <p className="text-2xl font-semibold mt-1">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-neutral-900/60 p-4">
              <h2 className="text-lg font-semibold mb-2">Activité récente</h2>
              <p className="text-white/60 text-sm">Courbes et logs récents (à venir).</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-neutral-900/60 p-4">
              <h2 className="text-lg font-semibold mb-2">Tâches d’administration</h2>
              <ul className="list-disc list-inside text-sm text-white/80 space-y-1">
                <li>Vérifier les nouveaux profils</li>
                <li>Suivre les conversations signalées</li>
                <li>Mettre à jour les encarts marketing</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  )
}