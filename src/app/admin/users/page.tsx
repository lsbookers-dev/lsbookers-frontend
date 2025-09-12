// src/app/admin/users/page.tsx
'use client'

import * as React from 'react'

type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'
type UserRow = {
  id: number
  name: string
  email?: string | null
  role: Role
  hasSubscription?: boolean
  isSuspended?: boolean
  profileId?: number | null
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export default function AdminUsersPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [rows, setRows] = React.useState<UserRow[]>([])
  const [q, setQ] = React.useState('')

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const load = React.useCallback(async () => {
    if (!token) {
      setError('Non authentifié')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/admin/users?hideAdmin=1`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      // attendu: { users: [...] }
      setRows(Array.isArray(data?.users) ? data.users : [])
    } catch (e) {
      console.error(e)
      setError("Impossible de charger les utilisateurs.")
    } finally {
      setLoading(false)
    }
  }, [token])

  React.useEffect(() => {
    load()
  }, [load])

  const filtered = q
    ? rows.filter(u =>
        (u.name || '').toLowerCase().includes(q.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(q.toLowerCase())
      )
    : rows

  return (
    <div className="max-w-6xl mx-auto text-white">
      <h2 className="text-2xl font-bold mb-4">Gestion des utilisateurs</h2>

      <div className="flex gap-2 items-center mb-4">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher par nom, email…"
          className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2"
        />
        <button onClick={load} className="px-3 py-2 bg-white/10 border border-white/15 rounded hover:bg-white/20">
          Recharger
        </button>
      </div>

      {loading && <p className="text-white/60">Chargement…</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto border border-white/10 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-3 border-b border-white/10">ID</th>
                <th className="text-left p-3 border-b border-white/10">Nom</th>
                <th className="text-left p-3 border-b border-white/10">Email</th>
                <th className="text-left p-3 border-b border-white/10">Rôle</th>
                <th className="text-left p-3 border-b border-white/10">Abonnement</th>
                <th className="text-left p-3 border-b border-white/10">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="odd:bg-white/0 even:bg-white/[0.03]">
                  <td className="p-3">{u.id}</td>
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email ?? '—'}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">{u.hasSubscription ? '✅' : '—'}</td>
                  <td className="p-3">{u.isSuspended ? '⛔️ Suspendu' : 'Actif'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-white/60">
                    Aucun utilisateur.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}